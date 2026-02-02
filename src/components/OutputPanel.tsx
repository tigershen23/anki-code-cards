import { useState, useMemo } from "react";
import { useCopyToClipboard, useDebounceValue } from "usehooks-ts";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { renderContentForOutput } from "../lib/render";

export function OutputPanel() {
  const { content, highlighter } = useEditor();
  const [debouncedContent] = useDebounceValue(content, 150);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, copy] = useCopyToClipboard();

  const outputHtml = useMemo(() => {
    return renderContentForOutput(debouncedContent, highlighter);
  }, [debouncedContent, highlighter]);

  const handleCopy = async () => {
    const success = await copy(outputHtml);
    if (success) {
      toast.success("Copied HTML to clipboard!");
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="border-t border-ctp-surface0 bg-ctp-mantle">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-ctp-surface0"
      >
        <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">Output HTML</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="flex items-center gap-1 rounded bg-ctp-blue px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-ctp-sapphire"
          >
            <Copy size={12} />
            Copy
          </button>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      {isExpanded && (
        <div className="max-h-64 overflow-auto border-t border-ctp-surface0 bg-ctp-base p-4">
          <pre className="text-xs break-all whitespace-pre-wrap text-ctp-text">{outputHtml}</pre>
        </div>
      )}
    </div>
  );
}
