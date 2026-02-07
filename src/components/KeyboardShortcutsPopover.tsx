import { Keyboard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const shortcuts = [
  { label: "Insert new cloze", key: "⌘⇧K" },
  { label: "Comment cloze", key: "⌘⇧/" },
  { label: "Copy HTML", key: "⌘↵" },
  { label: "Indent/dedent", key: "Tab/⇧Tab" },
];

interface KeyboardShortcutsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsPopover({ open, onOpenChange }: KeyboardShortcutsPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className="flex h-6 w-6 items-center justify-center rounded text-ctp-subtext0 transition-colors hover:bg-ctp-surface0 hover:text-ctp-text"
        title="Keyboard shortcuts"
      >
        <Keyboard size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <h3 className="mb-2 text-xs font-semibold text-ctp-text">Keyboard Shortcuts</h3>
        <div className="space-y-1.5 text-xs">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex justify-between">
              <span className="text-ctp-subtext0">{shortcut.label}</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono text-[10px]">{shortcut.key}</kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
