/**
 * Cloze parsing and manipulation utilities.
 *
 * Why: cloze markers are central to Anki output, and we need consistent
 * parsing for rendering, numbering, and editor actions.
 */
export interface ClozeMatch {
  clozeNumber: number;
  content: string;
  hint?: string;
  startIndex: number;
  endIndex: number;
  contentStartIndex: number;
  contentEndIndex: number;
}

const CLOZE_REGEX = /\{\{c(\d+)::((?:(?!\{\{c\d+::)(?!\}\}).)*?)(?:::((?:(?!\}\}).)*?))?\}\}/gs;

export function parseClozes(text: string): ClozeMatch[] {
  const matches: ClozeMatch[] = [];
  let match: RegExpExecArray | null;

  CLOZE_REGEX.lastIndex = 0;

  while ((match = CLOZE_REGEX.exec(text)) !== null) {
    const fullMatch = match[0];
    const clozeNumber = parseInt(match[1] ?? "1", 10);
    const content = match[2] ?? "";
    const hint = match[3];

    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    const contentStartIndex = startIndex + `{{c${clozeNumber}::`.length;
    const contentEndIndex = hint !== undefined ? contentStartIndex + content.length : endIndex - 2;

    matches.push({
      clozeNumber,
      content,
      hint,
      startIndex,
      endIndex,
      contentStartIndex,
      contentEndIndex,
    });
  }

  return matches;
}

export function isInsideCloze(text: string, cursorPosition: number): ClozeMatch | null {
  const clozes = parseClozes(text);

  for (const cloze of clozes) {
    if (cursorPosition >= cloze.startIndex && cursorPosition <= cloze.endIndex) {
      return cloze;
    }
  }

  return null;
}

export function getMaxClozeNumber(text: string): number {
  const clozes = parseClozes(text);

  if (clozes.length === 0) {
    return 0;
  }

  return Math.max(...clozes.map((c) => c.clozeNumber));
}

export function getNextClozeNumber(text: string): number {
  return getMaxClozeNumber(text) + 1;
}

export function wrapWithCloze(text: string, clozeNumber: number): string {
  return `{{c${clozeNumber}::${text}}}`;
}

export function insertClozeAtSelection(
  fullText: string,
  selectionStart: number,
  selectionEnd: number,
  clozeNumber: number,
): { newText: string; newCursorPosition: number } {
  const before = fullText.slice(0, selectionStart);
  const selected = fullText.slice(selectionStart, selectionEnd);
  const after = fullText.slice(selectionEnd);

  const clozePrefix = `{{c${clozeNumber}::`;
  const clozeSuffix = "}}";

  if (selected.length === 0) {
    const newText = before + clozePrefix + clozeSuffix + after;
    const newCursorPosition = selectionStart + clozePrefix.length;
    return { newText, newCursorPosition };
  }

  const newText = before + clozePrefix + selected + clozeSuffix + after;
  const newCursorPosition = selectionStart + clozePrefix.length + selected.length + clozeSuffix.length;
  return { newText, newCursorPosition };
}

export function addHintToCloze(
  fullText: string,
  cursorPosition: number,
  hint: string,
): { newText: string; newCursorPosition: number } | null {
  const cloze = isInsideCloze(fullText, cursorPosition);

  if (!cloze) {
    return null;
  }

  if (cloze.hint !== undefined) {
    return null;
  }

  const before = fullText.slice(0, cloze.contentEndIndex);
  const after = fullText.slice(cloze.contentEndIndex);

  const newText = before + "::" + hint + after;
  const newCursorPosition = cloze.contentEndIndex + 2 + hint.length;

  return { newText, newCursorPosition };
}
