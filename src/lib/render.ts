import { parseContent, type Block } from "./parser";
import { parseClozes, type ClozeMatch } from "./cloze";
import type { PreviewMode, ShikiHighlighter } from "../context/EditorContext";

const CLOZE_START_PLACEHOLDER = "\u200B\u200BCLOZE_START_";
const CLOZE_END_PLACEHOLDER = "\u200B\u200BCLOZE_END\u200B\u200B";
const CLOZE_HINT_PLACEHOLDER = "\u200B\u200BCLOZE_HINT_";

interface RenderOptions {
  highlighter: ShikiHighlighter | null;
  mode: PreviewMode;
  activeClozeNumber: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractAndReplaceClozes(text: string): { processedText: string; clozes: ClozeMatch[] } {
  const clozes = parseClozes(text);
  let processedText = text;
  let offset = 0;

  for (const cloze of clozes) {
    const startMarker = `{{c${cloze.clozeNumber}::`;
    const endMarker = cloze.hint !== undefined ? `::${cloze.hint}}}` : "}}";
    const fullMatch = startMarker + cloze.content + endMarker;

    const startPlaceholder = `${CLOZE_START_PLACEHOLDER}${cloze.clozeNumber}\u200B\u200B`;
    const hintPlaceholder = cloze.hint !== undefined ? `${CLOZE_HINT_PLACEHOLDER}${cloze.hint}\u200B\u200B` : "";
    const replacement = startPlaceholder + cloze.content + hintPlaceholder + CLOZE_END_PLACEHOLDER;

    const adjustedStart = cloze.startIndex + offset;
    processedText =
      processedText.slice(0, adjustedStart) + replacement + processedText.slice(adjustedStart + fullMatch.length);

    offset += replacement.length - fullMatch.length;
  }

  return { processedText, clozes };
}

function restoreClozesForOutput(html: string): string {
  let result = html;

  const startPattern = new RegExp(escapeHtml(CLOZE_START_PLACEHOLDER) + "(\\d+)" + escapeHtml("\u200B\u200B"), "g");
  result = result.replace(startPattern, "{{c$1::");

  const hintPattern = new RegExp(escapeHtml(CLOZE_HINT_PLACEHOLDER) + "([^<]*?)" + escapeHtml("\u200B\u200B"), "g");
  result = result.replace(hintPattern, "::$1");

  const endPattern = new RegExp(escapeHtml(CLOZE_END_PLACEHOLDER), "g");
  result = result.replace(endPattern, "}}");

  return result;
}

function renderClozesForPreview(html: string, mode: PreviewMode, activeClozeNumber: number): string {
  let result = html;

  const clozePattern = new RegExp(
    escapeHtml(CLOZE_START_PLACEHOLDER) +
      "(\\d+)" +
      escapeHtml("\u200B\u200B") +
      "(.*?)" +
      "(?:" +
      escapeHtml(CLOZE_HINT_PLACEHOLDER) +
      "([^<]*?)" +
      escapeHtml("\u200B\u200B") +
      ")?" +
      escapeHtml(CLOZE_END_PLACEHOLDER),
    "gs",
  );

  result = result.replace(clozePattern, (_, clozeNum, content, hint) => {
    const num = parseInt(clozeNum, 10);
    const isActive = num === activeClozeNumber;

    if (mode === "edit") {
      return `<span style="background: rgba(114,135,253,0.15); border-bottom: 2px solid #7287fd; padding: 1px 2px; border-radius: 2px;"><span style="color: #7287fd; font-size: 0.75em; font-weight: 600; vertical-align: super;">c${num}</span>${content}</span>`;
    } else if (mode === "hidden") {
      if (isActive) {
        const displayText = hint || "...";
        return `<span style="background: #8839ef; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600;">[${displayText}]</span>`;
      }
      return `<span style="border-bottom: 1px dashed #7287fd;">${content}</span>`;
    } else {
      if (isActive) {
        return `<span style="background: rgba(64,160,43,0.15); border-bottom: 2px solid #40a02b; padding: 1px 2px; border-radius: 2px;">${content}</span>`;
      }
      return `<span style="border-bottom: 1px dashed #7287fd;">${content}</span>`;
    }
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

function renderCodeBlock(
  block: Block,
  highlighter: ShikiHighlighter | null,
  mode: PreviewMode,
  activeClozeNumber: number,
  forOutput: boolean,
): string {
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

  return renderClozesForPreview(html, mode, activeClozeNumber);
}

function renderProse(content: string, mode: PreviewMode, activeClozeNumber: number, forOutput: boolean): string {
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

  return renderClozesForPreview(html, mode, activeClozeNumber);
}

export function renderContent(content: string, options: RenderOptions): string {
  const blocks = parseContent(content);
  const { highlighter, mode, activeClozeNumber } = options;

  const renderedBlocks = blocks.map((block) => {
    if (block.type === "code") {
      return renderCodeBlock(block, highlighter, mode, activeClozeNumber, false);
    }
    return renderProse(block.content, mode, activeClozeNumber, false);
  });

  return `<div style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px; line-height: 1.5; color: #4c4f69;">${renderedBlocks.join("")}</div>`;
}

export function renderContentForOutput(content: string, highlighter: ShikiHighlighter | null): string {
  const blocks = parseContent(content);

  const renderedBlocks = blocks.map((block) => {
    if (block.type === "code") {
      return renderCodeBlock(block, highlighter, "edit", 1, true);
    }
    return renderProse(block.content, "edit", 1, true);
  });

  return `<div style="font-family: ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace; font-size: 14px; line-height: 1.5; color: #4c4f69;">${renderedBlocks.join("")}</div>`;
}

export function getClozeCount(content: string): number {
  const clozes = parseClozes(content);
  if (clozes.length === 0) return 0;
  return Math.max(...clozes.map((c) => c.clozeNumber));
}
