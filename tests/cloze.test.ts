import { describe, test, expect } from "bun:test";
import {
  parseClozes,
  isInsideCloze,
  getMaxClozeNumber,
  getNextClozeNumber,
  wrapWithCloze,
  insertClozeAtSelection,
  addHintToCloze,
} from "../src/lib/cloze";

describe("parseClozes", () => {
  test("extracts basic cloze", () => {
    const result = parseClozes("Hello {{c1::world}}!");
    expect(result).toHaveLength(1);
    expect(result[0].clozeNumber).toBe(1);
    expect(result[0].content).toBe("world");
    expect(result[0].hint).toBeUndefined();
  });

  test("extracts cloze with hint", () => {
    const result = parseClozes("Hello {{c1::world::greeting}}!");
    expect(result).toHaveLength(1);
    expect(result[0].clozeNumber).toBe(1);
    expect(result[0].content).toBe("world");
    expect(result[0].hint).toBe("greeting");
  });

  test("extracts multiple clozes", () => {
    const result = parseClozes("{{c1::first}} and {{c2::second}}");
    expect(result).toHaveLength(2);
    expect(result[0].clozeNumber).toBe(1);
    expect(result[0].content).toBe("first");
    expect(result[1].clozeNumber).toBe(2);
    expect(result[1].content).toBe("second");
  });

  test("handles empty cloze", () => {
    const result = parseClozes("{{c1::}}");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("");
  });

  test("handles code with }} that is not a cloze end", () => {
    const result = parseClozes("const obj = {{ a: 1 }}; {{c1::answer}}");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("answer");
  });

  test("extracts correct positions", () => {
    const text = "Hello {{c1::world}}!";
    const result = parseClozes(text);
    expect(result[0].startIndex).toBe(6);
    expect(result[0].endIndex).toBe(19);
    expect(result[0].contentStartIndex).toBe(12);
    expect(result[0].contentEndIndex).toBe(17);
  });

  test("handles multiline content", () => {
    const text = "{{c1::line1\nline2}}";
    const result = parseClozes(text);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("line1\nline2");
  });

  test("handles clozes with special characters", () => {
    const result = parseClozes("{{c1::const x = 5;}}");
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("const x = 5;");
  });
});

describe("isInsideCloze", () => {
  test("returns cloze when cursor is inside content", () => {
    const text = "Hello {{c1::world}}!";
    const result = isInsideCloze(text, 14);
    expect(result).not.toBeNull();
    expect(result?.clozeNumber).toBe(1);
  });

  test("returns cloze when cursor is at start marker", () => {
    const text = "Hello {{c1::world}}!";
    const result = isInsideCloze(text, 6);
    expect(result).not.toBeNull();
  });

  test("returns cloze when cursor is at end marker", () => {
    const text = "Hello {{c1::world}}!";
    const result = isInsideCloze(text, 18);
    expect(result).not.toBeNull();
  });

  test("returns null when cursor is outside cloze", () => {
    const text = "Hello {{c1::world}}!";
    const result = isInsideCloze(text, 2);
    expect(result).toBeNull();
  });

  test("returns null for text without clozes", () => {
    const text = "Hello world!";
    const result = isInsideCloze(text, 5);
    expect(result).toBeNull();
  });
});

describe("getMaxClozeNumber", () => {
  test("returns 0 for no clozes", () => {
    expect(getMaxClozeNumber("Hello world")).toBe(0);
  });

  test("returns max for multiple clozes", () => {
    expect(getMaxClozeNumber("{{c1::a}} {{c3::b}} {{c2::c}}")).toBe(3);
  });

  test("handles double-digit cloze numbers", () => {
    expect(getMaxClozeNumber("{{c10::a}} {{c2::b}}")).toBe(10);
  });
});

describe("getNextClozeNumber", () => {
  test("returns 1 for no clozes", () => {
    expect(getNextClozeNumber("Hello world")).toBe(1);
  });

  test("returns max+1 for existing clozes", () => {
    expect(getNextClozeNumber("{{c1::a}} {{c2::b}}")).toBe(3);
  });
});

describe("wrapWithCloze", () => {
  test("wraps text with cloze markers", () => {
    expect(wrapWithCloze("world", 1)).toBe("{{c1::world}}");
  });

  test("handles empty text", () => {
    expect(wrapWithCloze("", 2)).toBe("{{c2::}}");
  });
});

describe("insertClozeAtSelection", () => {
  test("wraps selected text", () => {
    const result = insertClozeAtSelection("Hello world!", 6, 11, 1);
    expect(result.newText).toBe("Hello {{c1::world}}!");
  });

  test("inserts empty cloze when no selection", () => {
    const result = insertClozeAtSelection("Hello world!", 6, 6, 1);
    expect(result.newText).toBe("Hello {{c1::}}world!");
    expect(result.newCursorPosition).toBe(12);
  });

  test("positions cursor correctly after selection", () => {
    const result = insertClozeAtSelection("Hello world!", 6, 11, 1);
    expect(result.newCursorPosition).toBe(19);
  });
});

describe("addHintToCloze", () => {
  test("adds hint to existing cloze", () => {
    const result = addHintToCloze("{{c1::world}}", 8, "greeting");
    expect(result).not.toBeNull();
    expect(result?.newText).toBe("{{c1::world::greeting}}");
  });

  test("returns null when not inside cloze", () => {
    const result = addHintToCloze("Hello world", 5, "hint");
    expect(result).toBeNull();
  });

  test("returns null when cloze already has hint", () => {
    const result = addHintToCloze("{{c1::world::existing}}", 8, "new");
    expect(result).toBeNull();
  });
});
