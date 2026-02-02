import { useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useEditor } from "../context/EditorContext";
import { renderContent, getClozeCount } from "../lib/render";

export function PreviewPanel() {
  const { content, highlighter, previewMode, activeClozeNumber, setActiveClozeNumber } = useEditor();
  const [debouncedContent] = useDebounceValue(content, 150);

  const renderedHtml = useMemo(() => {
    return renderContent(debouncedContent, {
      highlighter,
      mode: previewMode,
      activeClozeNumber,
    });
  }, [debouncedContent, highlighter, previewMode, activeClozeNumber]);

  const clozeCount = useMemo(() => getClozeCount(debouncedContent), [debouncedContent]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">Preview</span>
        {previewMode !== "edit" && clozeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ctp-subtext0">Cloze:</span>
            <div className="flex gap-1">
              {Array.from({ length: clozeCount }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setActiveClozeNumber(num)}
                  className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                    num === activeClozeNumber
                      ? "bg-ctp-mauve text-white"
                      : "bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-white p-4">
        {!highlighter ? (
          <div className="flex h-full items-center justify-center text-ctp-subtext0">Loading syntax highlighter...</div>
        ) : (
          <div className="preview-code" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        )}
      </div>
    </div>
  );
}
