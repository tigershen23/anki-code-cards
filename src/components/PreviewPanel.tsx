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
      <PanelHeader
        title="Preview"
        right={
          !highlighter ? (
            <span className="text-xs text-ctp-subtext0 normal-case">
              highlighting
              <span className="loading-ellipsis" aria-hidden="true">
                ...
              </span>
            </span>
          ) : null
        }
      />
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
        <div className="preview-code" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    </div>
  );
}
