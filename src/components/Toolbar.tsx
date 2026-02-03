import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { renderContentForOutput } from "../lib/render";
import { InfoPopover } from "./InfoPopover";
import { KeyboardShortcutsPopover } from "./KeyboardShortcutsPopover";

const FTU_STORAGE_KEY = "anki-code-cards-ftu-dismissed";

function getInitialInfoOpen(): boolean {
  try {
    return localStorage.getItem(FTU_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export function Toolbar() {
  const { content, highlighter } = useEditor();
  const [, copy] = useCopyToClipboard();
  const [infoOpen, setInfoOpen] = useState(getInitialInfoOpen);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const handleInfoOpenChange = (open: boolean) => {
    setInfoOpen(open);
    if (!open) {
      try {
        localStorage.setItem(FTU_STORAGE_KEY, "true");
      } catch {
        // localStorage unavailable
      }
    }
  };

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
    <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ctp-text">Anki Code Cards</span>
        <InfoPopover open={infoOpen} onOpenChange={handleInfoOpenChange} />
        <KeyboardShortcutsPopover open={keyboardOpen} onOpenChange={setKeyboardOpen} />
      </div>
      <button
        onClick={handleCopyHtml}
        className="flex items-center gap-1 rounded bg-ctp-blue px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-ctp-sapphire"
        title="Copy HTML (Cmd+Enter)"
      >
        <Copy size={12} />
        Copy HTML
      </button>
    </div>
  );
}
