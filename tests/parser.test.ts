import { describe, test, expect } from "bun:test";
import { parseContent, normalizeLanguage, detectCodeContext, getCommentSyntax } from "../src/lib/parser";

describe("normalizeLanguage", () => {
  test("normalizes ts to typescript", () => {
    expect(normalizeLanguage("ts")).toBe("typescript");
  });

  test("normalizes tsx", () => {
    expect(normalizeLanguage("tsx")).toBe("tsx");
  });

  test("normalizes js to javascript", () => {
    expect(normalizeLanguage("js")).toBe("javascript");
  });

  test("normalizes react to tsx", () => {
    expect(normalizeLanguage("react")).toBe("tsx");
  });

  test("returns plaintext for unknown language", () => {
    expect(normalizeLanguage("unknown")).toBe("plaintext");
  });

  test("handles case insensitivity", () => {
    expect(normalizeLanguage("TypeScript")).toBe("typescript");
  });
});

describe("parseContent", () => {
  test("parses prose only", () => {
    const result = parseContent("Hello world");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("prose");
    expect(result[0].content).toBe("Hello world");
  });

  test("parses single code block", () => {
    const content = "```ts\nconst x = 1;\n```";
    const result = parseContent(content);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("code");
    expect(result[0].language).toBe("typescript");
    expect(result[0].content).toBe("const x = 1;\n");
  });

  test("parses mixed prose and code", () => {
    const content = `Hello

\`\`\`ts
const x = 1;
\`\`\`

Goodbye`;
    const result = parseContent(content);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("prose");
    expect(result[1].type).toBe("code");
    expect(result[2].type).toBe("prose");
  });

  test("parses multiple code blocks", () => {
    const content = `\`\`\`ts
const x = 1;
\`\`\`

\`\`\`css
.foo { color: red; }
\`\`\``;
    const result = parseContent(content);
    expect(result).toHaveLength(2);
    expect(result[0].language).toBe("typescript");
    expect(result[1].language).toBe("css");
  });

  test("handles code block without language", () => {
    const content = "```\ncode here\n```";
    const result = parseContent(content);
    expect(result).toHaveLength(1);
    expect(result[0].language).toBe("plaintext");
  });

  test("tracks correct positions", () => {
    const content = "Hello\n```ts\ncode\n```";
    const result = parseContent(content);
    expect(result[0].startIndex).toBe(0);
    expect(result[0].endIndex).toBe(6);
    expect(result[1].startIndex).toBe(6);
  });
});

describe("detectCodeContext", () => {
  test("detects cursor inside code block", () => {
    const content = "Hello\n```ts\nconst x = 1;\n```";
    const result = detectCodeContext(content, 15);
    expect(result.inCode).toBe(true);
    expect(result.language).toBe("typescript");
  });

  test("detects cursor outside code block", () => {
    const content = "Hello\n```ts\nconst x = 1;\n```";
    const result = detectCodeContext(content, 3);
    expect(result.inCode).toBe(false);
    expect(result.language).toBeNull();
  });

  test("captures indentation", () => {
    const content = "Hello\n```ts\n  const x = 1;\n```";
    const result = detectCodeContext(content, 20);
    expect(result.indent).toBe("  ");
  });
});

describe("getCommentSyntax", () => {
  test("returns // for typescript", () => {
    const result = getCommentSyntax("typescript");
    expect(result.prefix).toBe("// ");
    expect(result.suffix).toBe("");
  });

  test("returns /* */ for css", () => {
    const result = getCommentSyntax("css");
    expect(result.prefix).toBe("/* ");
    expect(result.suffix).toBe(" */");
  });

  test("returns <!-- --> for html", () => {
    const result = getCommentSyntax("html");
    expect(result.prefix).toBe("<!-- ");
    expect(result.suffix).toBe(" -->");
  });

  test("returns <!-- --> for null (prose)", () => {
    const result = getCommentSyntax(null);
    expect(result.prefix).toBe("<!-- ");
    expect(result.suffix).toBe(" -->");
  });
});
