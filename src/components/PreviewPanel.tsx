import { useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useEditor } from "../context/EditorContext";
import { renderContent } from "../lib/render";

export function PreviewPanel() {
  const { content, highlighter } = useEditor();
  const [debouncedContent] = useDebounceValue(content, 150);

  const renderedHtml = useMemo(() => {
    return renderContent(debouncedContent, { highlighter });
  }, [debouncedContent, highlighter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">Preview</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
        {!highlighter ? (
          <div className="flex h-full items-center justify-center text-ctp-subtext0">Loading syntax highlighter...</div>
        ) : (
          <div className="preview-code" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        )}
      </div>
    </div>
  );
}
