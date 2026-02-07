/**
 * Pure text-editing actions for the editor. These actions are then applied in textareaMutations.ts, which is the only place that directly manipulates the textarea content and selection.
 */
import { detectCodeContext, getCommentSyntax } from "./parser";
import { getNextClozeNumber, insertClozeAtSelection as buildClozeInsertion } from "./cloze";

export interface EditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export function indentSelection(text: string, selectionStart: number, selectionEnd: number): EditResult {
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

export function dedentSelection(text: string, selectionStart: number, selectionEnd: number): EditResult {
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

export function insertNewlineWithIndent(text: string, selectionStart: number, selectionEnd: number): EditResult {
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

export function autoDedentClosing(
  text: string,
  selectionStart: number,
  _selectionEnd: number,
  closingChar: string,
): EditResult | null {
  // Only adjust indentation when the closing token is the first non-whitespace.
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

export function insertClozeAtSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  clozeNumber: number,
): EditResult {
  const { newText, newCursorPosition } = buildClozeInsertion(text, selectionStart, selectionEnd, clozeNumber);
  return { text: newText, selectionStart: newCursorPosition, selectionEnd: newCursorPosition };
}

export function insertCommentCloze(text: string, cursorPosition: number): EditResult {
  // Insert a language-appropriate comment line with a new cloze marker.
  const context = detectCodeContext(text, cursorPosition);
  const { prefix, suffix } = getCommentSyntax(context.language);
  const clozeNum = getNextClozeNumber(text);
  const lineStart = context.lineStart;
  const commentLine = context.indent + prefix + `{{c${clozeNum}::}}` + suffix + "\n";
  const cursorInCloze = lineStart + context.indent.length + prefix.length + `{{c${clozeNum}::`.length;

  const newText = text.slice(0, lineStart) + commentLine + text.slice(lineStart);

  return { text: newText, selectionStart: cursorInCloze, selectionEnd: cursorInCloze };
}
