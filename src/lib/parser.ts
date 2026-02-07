/**
 * Lightweight parser for splitting content into prose/code blocks.
 *
 * Why: we need stable, index-aware boundaries for rendering and for editor
 * actions (like comment clozes) without pulling in a full markdown parser.
 */
export type BlockType = "prose" | "code";

export interface Block {
  type: BlockType;
  content: string;
  language?: string;
  startIndex: number;
  endIndex: number;
}

const CODE_FENCE_REGEX = /^```(\w*)\n([\s\S]*?)^```$/gm;

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  js: "javascript",
  javascript: "javascript",
  jsx: "jsx",
  css: "css",
  scss: "scss",
  html: "html",
  react: "tsx",
};

export function normalizeLanguage(lang: string): string {
  const normalized = lang.toLowerCase().trim();
  return LANG_MAP[normalized] || "plaintext";
}

export function parseContent(text: string): Block[] {
  const blocks: Block[] = [];
  let lastIndex = 0;

  CODE_FENCE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CODE_FENCE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const proseContent = text.slice(lastIndex, match.index);
      if (proseContent.trim()) {
        blocks.push({
          type: "prose",
          content: proseContent,
          startIndex: lastIndex,
          endIndex: match.index,
        });
      }
    }

    const langIdentifier = match[1] || "";
    const codeContent = match[2] ?? "";

    blocks.push({
      type: "code",
      content: codeContent,
      language: normalizeLanguage(langIdentifier),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const proseContent = text.slice(lastIndex);
    if (proseContent.trim()) {
      blocks.push({
        type: "prose",
        content: proseContent,
        startIndex: lastIndex,
        endIndex: text.length,
      });
    }
  }

  return blocks;
}

// Determine whether the cursor is inside a code block and capture line context.
export function detectCodeContext(
  text: string,
  cursorPosition: number,
): { inCode: boolean; language: string | null; lineStart: number; indent: string } {
  const blocks = parseContent(text);

  for (const block of blocks) {
    if (block.type === "code" && cursorPosition >= block.startIndex && cursorPosition <= block.endIndex) {
      const currentLineStart = text.lastIndexOf("\n", cursorPosition - 1) + 1;
      const currentLine = text.slice(currentLineStart, cursorPosition);
      const indent = currentLine.match(/^(\s*)/)?.[1] || "";

      return {
        inCode: true,
        language: block.language || null,
        lineStart: currentLineStart,
        indent,
      };
    }
  }

  const currentLineStart = text.lastIndexOf("\n", cursorPosition - 1) + 1;
  const currentLine = text.slice(currentLineStart, cursorPosition);
  const indent = currentLine.match(/^(\s*)/)?.[1] || "";

  return {
    inCode: false,
    language: null,
    lineStart: currentLineStart,
    indent,
  };
}

export function getCommentSyntax(language: string | null): { prefix: string; suffix: string } {
  if (!language) {
    return { prefix: "<!-- ", suffix: " -->" };
  }

  switch (language) {
    case "css":
    case "scss":
      return { prefix: "/* ", suffix: " */" };
    case "html":
      return { prefix: "<!-- ", suffix: " -->" };
    default:
      return { prefix: "// ", suffix: "" };
  }
}
