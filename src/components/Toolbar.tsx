// Top toolbar with app actions and help controls.
import { useState } from "react";
import { Copy } from "lucide-react";
import { useCopyHtml } from "../hooks/useCopyHtml";
import { InfoPopover } from "./InfoPopover";
import { KeyboardShortcutsPopover } from "./KeyboardShortcutsPopover";
import { Button } from "./ui/button";

const FTU_STORAGE_KEY = "anki-code-cards-ftu-dismissed";

function getInitialInfoOpen(): boolean {
  try {
    return localStorage.getItem(FTU_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export function Toolbar() {
  const copyHtml = useCopyHtml();
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
    await copyHtml();
  };

  return (
    <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ctp-text">Anki Code Cards</span>
        <InfoPopover open={infoOpen} onOpenChange={handleInfoOpenChange} />
        <KeyboardShortcutsPopover open={keyboardOpen} onOpenChange={setKeyboardOpen} />
      </div>
      <Button onClick={handleCopyHtml} title="Copy HTML (Cmd+Enter)">
        <Copy size={12} />
        Copy HTML
      </Button>
    </div>
  );
}
