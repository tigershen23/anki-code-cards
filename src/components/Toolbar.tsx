import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Copy, HelpCircle } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { renderContentForOutput } from "../lib/render";

export function Toolbar() {
  const { content, highlighter } = useEditor();
  const [, copy] = useCopyToClipboard();
  const [showHelp, setShowHelp] = useState(false);

  const handleCopyHtml = async () => {
    const outputHtml = renderContentForOutput(content, highlighter);
    const success = await copy(outputHtml);
    if (success) {
      toast.success("Copied HTML to clipboard");
    } else {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <span className="text-sm font-medium text-ctp-text">Anki Code Cards</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1 rounded bg-ctp-blue px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-ctp-sapphire"
            title="Copy HTML (Cmd+Enter)"
          >
            <Copy size={12} />
            Copy HTML
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex h-6 w-6 items-center justify-center rounded text-ctp-subtext0 transition-colors hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Keyboard shortcuts"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="absolute top-12 right-4 z-50 w-72 rounded-lg border border-ctp-surface0 bg-white p-3 shadow-lg">
          <h3 className="mb-2 text-xs font-semibold text-ctp-text">Keyboard Shortcuts</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Insert new cloze</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">⌘⇧K</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Insert cloze 1-9</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">⌘⇧1-9</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Comment cloze</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">⌘⇧/</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Copy HTML</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">⌘↵</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Indent/dedent</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">Tab/⇧Tab</kbd>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-2 w-full rounded bg-ctp-surface0 py-1 text-xs font-medium text-ctp-text hover:bg-ctp-surface1"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
