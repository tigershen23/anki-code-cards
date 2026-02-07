/**
 * Centralized textarea mutation helpers.
 *
 * Why: the editor needs predictable undo/redo and React state updates without
 * deprecated `execCommand`, so we apply edits with `setRangeText` and emit an
 * `input` event to keep the browser history and React in sync.
 */
import type { TextSelectionState } from "./textSelection.types";

interface ReplaceRangeOptions {
  selectionStart?: number;
  selectionEnd?: number;
  inputType?: string;
  data?: string;
}

/**
 * Clamps selection indices so they always stay within `[0, valueLength]`.
 * Example: `clampSelection(5, -1, 99) -> { selectionStart: 0, selectionEnd: 5 }`.
 */
function clampSelection(valueLength: number, start: number, end: number) {
  const nextStart = Math.max(0, Math.min(valueLength, start));
  const nextEnd = Math.max(0, Math.min(valueLength, end));
  return {
    selectionStart: Math.min(nextStart, nextEnd),
    selectionEnd: Math.max(nextStart, nextEnd),
  };
}

/**
 * Emits an `input` event so React receives updates from imperative textarea edits.
 * Example: after `replaceRange(...)`, this triggers the component `onChange` path.
 */
function dispatchInput(textarea: HTMLTextAreaElement, options: { inputType?: string; data?: string } = {}) {
  const { inputType = "insertText", data } = options;

  if (typeof InputEvent === "function") {
    const event = new InputEvent("input", {
      bubbles: true,
      inputType,
      data,
    });
    textarea.dispatchEvent(event);
    return;
  }

  const fallbackEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(fallbackEvent);
}

/**
 * Computes the smallest changed span from `current` to `next`.
 * Example: `"abc"` -> `"aXc"` returns `{ start: 1, end: 2, replacement: "X" }`.
 */
function diffText(current: string, next: string) {
  let start = 0;
  const currentLength = current.length;
  const nextLength = next.length;

  while (start < currentLength && start < nextLength && current[start] === next[start]) {
    start += 1;
  }

  let currentEnd = currentLength;
  let nextEnd = nextLength;

  while (currentEnd > start && nextEnd > start && current[currentEnd - 1] === next[nextEnd - 1]) {
    currentEnd -= 1;
    nextEnd -= 1;
  }

  return {
    start,
    end: currentEnd,
    replacement: next.slice(start, nextEnd),
  };
}

/**
 * Sets textarea selection after clamping to valid bounds.
 * Example: `setSelection(textarea, 2, 4)` selects the third and fourth characters.
 */
export function setSelection(textarea: HTMLTextAreaElement, start: number, end = start) {
  textarea.focus();
  const { selectionStart, selectionEnd } = clampSelection(textarea.value.length, start, end);
  textarea.setSelectionRange(selectionStart, selectionEnd);
}

/**
 * Replaces text in `[start, end)` and updates selection in one operation.
 * Example: replacing `"world"` with `"friend"` in `"hello world"` yields `"hello friend"`.
 */
export function replaceRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  options: ReplaceRangeOptions = {},
) {
  textarea.focus();
  textarea.setRangeText(text, start, end, "preserve");

  const { selectionStart, selectionEnd } = clampSelection(
    textarea.value.length,
    options.selectionStart ?? start + text.length,
    options.selectionEnd ?? start + text.length,
  );

  textarea.setSelectionRange(selectionStart, selectionEnd);
  dispatchInput(textarea, { inputType: options.inputType, data: options.data ?? text });
}

/**
 * Inserts text at the current selection range.
 * Example: cursor at index `3`, insert `"x"` into `"abc"` -> `"abcx"`.
 */
export function insertText(textarea: HTMLTextAreaElement, text: string, options: ReplaceRangeOptions = {}) {
  replaceRange(textarea, textarea.selectionStart, textarea.selectionEnd, text, options);
}

/**
 * Applies a computed text/selection result with a minimal DOM replacement.
 * Example: `{ text: "ab", selectionStart: 2, selectionEnd: 2 }` updates value and cursor.
 */
export function applyTextEdit(
  textarea: HTMLTextAreaElement,
  result: TextSelectionState,
  options: { inputType?: string } = {},
) {
  const current = textarea.value;
  const next = result.text;

  if (current === next) {
    setSelection(textarea, result.selectionStart, result.selectionEnd);
    return;
  }

  const { start, end, replacement } = diffText(current, next);
  replaceRange(textarea, start, end, replacement, {
    selectionStart: result.selectionStart,
    selectionEnd: result.selectionEnd,
    inputType: options.inputType,
    data: replacement,
  });
}
