import { useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useEditor } from "../context/EditorContext";
import { renderContentForPreview } from "../lib/render";
import { PanelHeader } from "./PanelHeader";

export function PreviewPanel() {
  const { content, highlighter } = useEditor();
  const [debouncedContent] = useDebounceValue(content, 150);

  const renderedHtml = useMemo(() => {
    return renderContentForPreview(debouncedContent, { highlighter });
  }, [debouncedContent, highlighter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Preview" />
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
