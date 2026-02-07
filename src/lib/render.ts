import { parseClozes } from "./cloze";
import { parseContent, type Block } from "./parser";
import type { ShikiHighlighter } from "../context/EditorContext";

/**
 * Rendering pipeline:
 * Input: raw editor text + optional Shiki highlighter.
 * Step 1: split text into prose/code blocks.
 * Step 2: replace cloze markers with zero-width sentinels before formatting.
 * Step 3: render each block (Shiki for code when available, fallback otherwise).
 * Step 4: clean marker fragments that Shiki may split across tags, then restore
 * cloze syntax as raw `{{cN::...}}` markers.
 * Output: one self-contained HTML string with inline styles.
 *
 * `renderContentForPreview` is the live UI path (highlighter can be null while loading).
 * `renderContentForOutput` is the clipboard path for Anki export.
 */

const ZWS = "\u200B";
const MARKER_START = `${ZWS}CLZS`;
const MARKER_NUM_END = `N${ZWS}`;
const MARKER_HINT = `${ZWS}CLZH`;
const MARKER_END = `${ZWS}CLZE${ZWS}`;

const WRAPPER_STYLE =
  "font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px; line-height: 1.5; color: #4c4f69; text-align: left;";
const PRE_STYLE = "background: #eff1f5; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;";
const CODE_STYLE =
  "font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px;";
const INLINE_CODE_STYLE =
  "font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; background: #e6e9ef; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;";
const HR_STYLE = "border: none; border-top: 1px solid #ccd0da; margin: 12px 0;";
const PARAGRAPH_STYLE = "margin: 8px 0;";

interface RenderOptions {
  highlighter: ShikiHighlighter | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractAndReplaceClozes(text: string): { processedText: string } {
  const clozes = parseClozes(text);
  let processedText = text;
  let offset = 0;

  for (const cloze of clozes) {
    const startMarker = `{{c${cloze.clozeNumber}::`;
    const endMarker = cloze.hint !== undefined ? `::${cloze.hint}}}` : "}}";
    const fullMatch = startMarker + cloze.content + endMarker;

    const startPlaceholder = `${MARKER_START}${cloze.clozeNumber}${MARKER_NUM_END}`;
    const hintPlaceholder = cloze.hint !== undefined ? `${MARKER_HINT}${cloze.hint}${MARKER_NUM_END}` : "";
    const replacement = startPlaceholder + cloze.content + hintPlaceholder + MARKER_END;

    const adjustedStart = cloze.startIndex + offset;
    processedText =
      processedText.slice(0, adjustedStart) + replacement + processedText.slice(adjustedStart + fullMatch.length);

    offset += replacement.length - fullMatch.length;
  }

  return { processedText };
}

function cleanMarkers(html: string): string {
  return html
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*S/g, MARKER_START)
    .replace(/N(<[^>]*>)*\u200B/g, MARKER_NUM_END)
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*H/g, MARKER_HINT)
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*E(<[^>]*>)*\u200B/g, MARKER_END);
}

function restoreClozes(html: string): string {
  let result = cleanMarkers(html);

  result = result.replace(
    new RegExp(`${escapeRegex(MARKER_START)}(\\d+)${escapeRegex(MARKER_NUM_END)}`, "g"),
    "{{c$1::",
  );
  result = result.replace(
    new RegExp(`${escapeRegex(MARKER_HINT)}([^${ZWS}]*?)${escapeRegex(MARKER_NUM_END)}`, "g"),
    "::$1",
  );
  result = result.replace(new RegExp(escapeRegex(MARKER_END), "g"), "}}");

  return result;
}

function highlightCode(code: string, language: string, highlighter: ShikiHighlighter): string {
  try {
    const html = highlighter.codeToHtml(code, {
      lang: language === "plaintext" ? "text" : language,
      theme: "catppuccin-latte",
    });

    return html
      .replace(/class="[^"]*"/g, "")
      .replace(/<pre[^>]*>/, `<pre style="${PRE_STYLE}">`)
      .replace(/<code[^>]*>/, `<code style="${CODE_STYLE}">`);
  } catch {
    return `<pre style="${PRE_STYLE}"><code style="${CODE_STYLE}">${escapeHtml(code)}</code></pre>`;
  }
}

function renderCodeBlock(block: Block, highlighter: ShikiHighlighter | null): string {
  const { processedText } = extractAndReplaceClozes(block.content);

  let html: string;
  if (highlighter && block.language && block.language !== "plaintext") {
    html = highlightCode(processedText, block.language, highlighter);
  } else {
    html = `<pre style="${PRE_STYLE}"><code style="${CODE_STYLE}">${escapeHtml(processedText)}</code></pre>`;
  }

  return restoreClozes(html);
}

function renderProse(content: string): string {
  const { processedText } = extractAndReplaceClozes(content);

  let html = processedText
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>')
    .replace(/`([^`]+)`/g, `<code style="${INLINE_CODE_STYLE}">$1</code>`)
    .replace(/^---$/gm, `<hr style="${HR_STYLE}">`)
    .replace(/\n\n/g, `</p><p style="${PARAGRAPH_STYLE}">`)
    .replace(/\n/g, "<br>");

  html = `<p style="${PARAGRAPH_STYLE}">${html}</p>`;

  return restoreClozes(html);
}

function renderBlocks(content: string, highlighter: ShikiHighlighter | null): string {
  const blocks = parseContent(content);
  const renderedBlocks = blocks.map((block) => {
    if (block.type === "code") {
      return renderCodeBlock(block, highlighter);
    }
    return renderProse(block.content);
  });

  return `<div style="${WRAPPER_STYLE}">${renderedBlocks.join("")}</div>`;
}

export function renderContentForPreview(content: string, options: RenderOptions): string {
  // Live preview path. Highlighter may still be null while loading.
  return renderBlocks(content, options.highlighter);
}

export function renderContentForOutput(content: string, highlighter: ShikiHighlighter | null): string {
  // Clipboard/export path used by Anki copy action.
  return renderBlocks(content, highlighter);
}
