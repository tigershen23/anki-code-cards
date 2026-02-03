import { parseContent, type Block } from "./parser";
import { parseClozes } from "./cloze";
import type { ShikiHighlighter } from "../context/EditorContext";

// Use single zero-width space as delimiter - simple and won't be split
const ZWS = "\u200B";
const MARKER_START = `${ZWS}CLZS`;
const MARKER_NUM_END = `N${ZWS}`;
const MARKER_HINT = `${ZWS}CLZH`;
const MARKER_END = `${ZWS}CLZE${ZWS}`;

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

// Clean up any HTML tags that got inserted into our markers by Shiki
function cleanMarkers(html: string): string {
  // Remove any HTML tags that appear inside our markers
  // Pattern: marker characters potentially interspersed with <span> tags
  return html
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*S/g, MARKER_START)
    .replace(/N(<[^>]*>)*\u200B/g, MARKER_NUM_END)
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*H/g, MARKER_HINT)
    .replace(/\u200B(<[^>]*>)*C(<[^>]*>)*L(<[^>]*>)*Z(<[^>]*>)*E(<[^>]*>)*\u200B/g, MARKER_END);
}

function restoreClozesForOutput(html: string): string {
  let result = cleanMarkers(html);

  // Replace markers with cloze syntax
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderClozesForPreview(html: string): string {
  let result = cleanMarkers(html);

  // Match: START + num + NUM_END + content + (optional: HINT + hint + NUM_END) + END
  const pattern = new RegExp(
    `${escapeRegex(MARKER_START)}(\\d+)${escapeRegex(MARKER_NUM_END)}(.*?)(?:${escapeRegex(MARKER_HINT)}[^${ZWS}]*?${escapeRegex(MARKER_NUM_END)})?${escapeRegex(MARKER_END)}`,
    "gs",
  );

  result = result.replace(pattern, (_, clozeNum, content) => {
    const num = parseInt(clozeNum, 10);
    return `<span style="background: rgba(114,135,253,0.15); border-bottom: 2px solid #7287fd; padding: 1px 2px; border-radius: 2px;"><span style="color: #7287fd; font-size: 0.75em; font-weight: 600; vertical-align: super;">c${num}</span>${content}</span>`;
  });

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
      .replace(
        /<pre[^>]*>/,
        '<pre style="background: #eff1f5; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;">',
      )
      .replace(
        /<code[^>]*>/,
        `<code style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px;">`,
      );
  } catch {
    return `<pre style="background: #eff1f5; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px;">${escapeHtml(code)}</code></pre>`;
  }
}

function renderCodeBlock(block: Block, highlighter: ShikiHighlighter | null, forOutput: boolean): string {
  const { processedText } = extractAndReplaceClozes(block.content);

  let html: string;
  if (highlighter && block.language && block.language !== "plaintext") {
    html = highlightCode(processedText, block.language, highlighter);
  } else {
    html = `<pre style="background: #eff1f5; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px;">${escapeHtml(processedText)}</code></pre>`;
  }

  if (forOutput) {
    return restoreClozesForOutput(html);
  }

  return renderClozesForPreview(html);
}

function renderProse(content: string, forOutput: boolean): string {
  const { processedText } = extractAndReplaceClozes(content);

  let html = processedText
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>')
    .replace(
      /`([^`]+)`/g,
      `<code style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; background: #e6e9ef; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</code>`,
    )
    .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #ccd0da; margin: 12px 0;">')
    .replace(/\n\n/g, '</p><p style="margin: 8px 0;">')
    .replace(/\n/g, "<br>");

  html = `<p style="margin: 8px 0;">${html}</p>`;

  if (forOutput) {
    return restoreClozesForOutput(html);
  }

  return renderClozesForPreview(html);
}

export function renderContent(content: string, options: RenderOptions): string {
  const blocks = parseContent(content);
  const { highlighter } = options;

  const renderedBlocks = blocks.map((block) => {
    if (block.type === "code") {
      return renderCodeBlock(block, highlighter, false);
    }
    return renderProse(block.content, false);
  });

  return `<div style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px; line-height: 1.5; color: #4c4f69; text-align: left;">${renderedBlocks.join("")}</div>`;
}

export function renderContentForOutput(content: string, highlighter: ShikiHighlighter | null): string {
  const blocks = parseContent(content);

  const renderedBlocks = blocks.map((block) => {
    if (block.type === "code") {
      return renderCodeBlock(block, highlighter, true);
    }
    return renderProse(block.content, true);
  });

  return `<div style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px; line-height: 1.5; color: #4c4f69; text-align: left;">${renderedBlocks.join("")}</div>`;
}
