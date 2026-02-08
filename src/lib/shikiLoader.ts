/*
 * Dynamically and selectively load Shiki bc it's very heavy
 */
import type { ShikiHighlighter } from "../context/EditorContext";

let highlighterPromise: Promise<ShikiHighlighter> | null = null;

export function getShikiHighlighter(): Promise<ShikiHighlighter> {
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = import("shiki/core").then(async ({ createBundledHighlighter }) => {
    const { createOnigurumaEngine } = await import("shiki/engine/oniguruma");

    const createHighlighter = createBundledHighlighter({
      langs: {
        typescript: () => import("@shikijs/langs/typescript"),
        tsx: () => import("@shikijs/langs/tsx"),
        javascript: () => import("@shikijs/langs/javascript"),
        jsx: () => import("@shikijs/langs/jsx"),
        css: () => import("@shikijs/langs/css"),
        scss: () => import("@shikijs/langs/scss"),
        html: () => import("@shikijs/langs/html"),
      },
      themes: {
        "catppuccin-latte": () => import("@shikijs/themes/catppuccin-latte"),
      },
      engine: () => createOnigurumaEngine(import("shiki/wasm")),
    });

    return createHighlighter({
      themes: ["catppuccin-latte"],
      langs: ["typescript", "tsx", "javascript", "jsx", "css", "scss", "html"],
    });
  });

  return highlighterPromise;
}
