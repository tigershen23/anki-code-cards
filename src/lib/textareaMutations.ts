/**
 * Centralized textarea mutation helpers.
 *
 * Why: the editor needs predictable undo/redo and React state updates without
 * deprecated `execCommand`, so we apply edits with `setRangeText` and emit an
 * `input` event to keep the browser history and React in sync.
 */
export interface TextEditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

interface ReplaceRangeOptions {
  selectionStart?: number;
  selectionEnd?: number;
  inputType?: string;
  data?: string;
}

function clampSelection(valueLength: number, start: number, end: number) {
  const nextStart = Math.max(0, Math.min(valueLength, start));
  const nextEnd = Math.max(0, Math.min(valueLength, end));
  return {
    selectionStart: Math.min(nextStart, nextEnd),
    selectionEnd: Math.max(nextStart, nextEnd),
  };
}

// Emit an `input` event so React and the browser undo stack observe the change.
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

// Compute a minimal replacement span to reduce how much the undo stack changes.
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

export function setSelection(textarea: HTMLTextAreaElement, start: number, end = start) {
  textarea.focus();
  const { selectionStart, selectionEnd } = clampSelection(textarea.value.length, start, end);
  textarea.setSelectionRange(selectionStart, selectionEnd);
}

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

export function insertText(textarea: HTMLTextAreaElement, text: string, options: ReplaceRangeOptions = {}) {
  replaceRange(textarea, textarea.selectionStart, textarea.selectionEnd, text, options);
}

export function applyTextEdit(
  textarea: HTMLTextAreaElement,
  result: TextEditResult,
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
