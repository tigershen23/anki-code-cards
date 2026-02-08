/**
 * Pure text editing transforms for textarea content.
 *
 * These functions only compute the next text/selection state.
 */
import { detectCodeContext, getCommentSyntax } from "./parser";
import { getNextClozeNumber, insertClozeAtSelection as buildClozeInsertion } from "./cloze";
import type { TextSelectionState } from "./textSelection.types";

/**
 * Indents the current selection by two spaces.
 * Example: `{ text: "a\\nb", selectionStart: 2, selectionEnd: 3 } -> { text: "a\\n  b", ... }`
 */
export function indentSelection(selection: TextSelectionState): TextSelectionState {
  const { text, selectionStart, selectionEnd } = selection;
  if (selectionStart === selectionEnd) {
    const newText = text.slice(0, selectionStart) + "  " + text.slice(selectionEnd);
    const cursor = selectionStart + 2;
    return { text: newText, selectionStart: cursor, selectionEnd: cursor };
  }

  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
  const selectedLines = text.slice(lineStart, selectionEnd);
  const indented = selectedLines
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
  const newText = text.slice(0, lineStart) + indented + text.slice(selectionEnd);

  return {
    text: newText,
    selectionStart: selectionStart + 2,
    selectionEnd: lineStart + indented.length,
  };
}

/**
 * Dedents selected lines by up to two spaces each.
 * Example: `{ text: "  a\\n  b", selectionStart: 0, selectionEnd: 7 } -> { text: "a\\nb", ... }`
 */
export function dedentSelection(selection: TextSelectionState): TextSelectionState {
  const { text, selectionStart, selectionEnd } = selection;
  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = selectionStart === selectionEnd ? text.indexOf("\n", selectionStart) : selectionEnd;
  const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
  const selectedLines = text.slice(lineStart, actualLineEnd);
  const dedented = selectedLines
    .split("\n")
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n");
  const currentLineIndent = text.slice(lineStart, selectionStart).match(/^(\s*)/)?.[1]?.length ?? 0;
  const reduction = selectedLines.length - dedented.length;
  const newText = text.slice(0, lineStart) + dedented + text.slice(actualLineEnd);
  const newStart = Math.max(lineStart, selectionStart - Math.min(2, currentLineIndent));
  const newEnd = selectionStart === selectionEnd ? newStart : Math.max(lineStart, selectionEnd - reduction);

  return {
    text: newText,
    selectionStart: newStart,
    selectionEnd: newEnd,
  };
}

/**
 * Inserts a newline and carries current indentation.
 * Example: `if (x) {|` becomes `if (x) {\\n  |`.
 */
export function insertNewlineWithIndent(selection: TextSelectionState): TextSelectionState {
  const { text, selectionStart, selectionEnd } = selection;
  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
  const currentLine = text.slice(lineStart, selectionStart);
  const indent = currentLine.match(/^(\s*)/)?.[1] || "";

  const charBefore = text[selectionStart - 1] ?? "";
  const extraIndent = ["{", "(", "["].includes(charBefore) ? "  " : "";
  const insertion = "\n" + indent + extraIndent;

  const newText = text.slice(0, selectionStart) + insertion + text.slice(selectionEnd);
  const cursor = selectionStart + insertion.length;

  return { text: newText, selectionStart: cursor, selectionEnd: cursor };
}

/**
 * Dedents the current line before inserting a closing token.
 * Example: line `"  |"` with key `"}"` becomes `"}|"`.
 */
export function autoDedentClosing(selection: TextSelectionState, closingChar: string): TextSelectionState | null {
  const { text, selectionStart } = selection;
  if (!["]", "}", ")"].includes(closingChar)) {
    return null;
  }

  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
  const textBeforeCursor = text.slice(lineStart, selectionStart);

  if (!/^\s+$/.test(textBeforeCursor) || textBeforeCursor.length < 2) {
    return null;
  }

  const dedentedIndent = textBeforeCursor.slice(2);
  const replacement = dedentedIndent + closingChar;
  const newText = text.slice(0, lineStart) + replacement + text.slice(selectionStart);
  const cursor = lineStart + replacement.length;

  return { text: newText, selectionStart: cursor, selectionEnd: cursor };
}

/**
 * Wraps selected content in a cloze marker.
 * Example: `"hello world"` with `world` selected + `1` -> `"hello {{c1::world}}"`.
 */
export function insertClozeAtSelection(selection: TextSelectionState, clozeNumber: number): TextSelectionState {
  const { text, selectionStart, selectionEnd } = selection;
  const { newText, newCursorPosition } = buildClozeInsertion(text, selectionStart, selectionEnd, clozeNumber);
  return { text: newText, selectionStart: newCursorPosition, selectionEnd: newCursorPosition };
}

/**
 * Inserts a language-aware comment line with an empty cloze.
 * Example in TS code: inserts `// {{cN::}}` above the current line.
 */
export function insertCommentCloze(selection: TextSelectionState): TextSelectionState {
  const { text, selectionStart } = selection;
  const context = detectCodeContext(text, selectionStart);
  const { prefix, suffix } = getCommentSyntax(context.language);
  const clozeNum = getNextClozeNumber(text);
  const lineStart = context.lineStart;
  const commentLine = context.indent + prefix + `{{c${clozeNum}::}}` + suffix + "\n";
  const cursorInCloze = lineStart + context.indent.length + prefix.length + `{{c${clozeNum}::`.length;

  const newText = text.slice(0, lineStart) + commentLine + text.slice(lineStart);

  return { text: newText, selectionStart: cursorInCloze, selectionEnd: cursorInCloze };
}
