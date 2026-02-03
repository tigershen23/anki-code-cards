import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface InfoPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoPopover({ open, onOpenChange }: InfoPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className="flex h-6 w-6 items-center justify-center rounded text-ctp-subtext0 transition-colors hover:bg-ctp-surface0 hover:text-ctp-text"
        title="About this app"
        data-testid="info-popover-trigger"
      >
        <Info size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80" data-testid="info-popover">
        <div className="space-y-3 text-xs">
          <section>
            <h3 className="mb-1 font-semibold text-ctp-text">What is this?</h3>
            <p className="text-ctp-subtext0">
              A specialized editor for creating Anki cloze cards with syntax-highlighted code blocks.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ctp-text">How to Use</h3>
            <ol className="list-inside list-decimal space-y-1 text-ctp-subtext0">
              <li>
                Write content using markdown code fences (<code className="rounded bg-ctp-surface0 px-1">```ts</code>)
              </li>
              <li>
                Wrap text with cloze syntax: <code className="rounded bg-ctp-surface0 px-1">{"{{c1::hidden}}"}</code>
              </li>
              <li>
                Add hints: <code className="rounded bg-ctp-surface0 px-1">{"{{c1::text::hint}}"}</code>
              </li>
              <li>Click "Copy HTML" when ready</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ctp-text">Pasting into Anki</h3>
            <ol className="list-inside list-decimal space-y-1 text-ctp-subtext0">
              <li>Open Anki and create or edit a card</li>
              <li>Click the field you want to edit</li>
              <li>
                Press <kbd className="rounded bg-ctp-surface0 px-1 py-0.5 font-mono text-[10px]">Cmd-Shift-X</kbd> (Mac)
                or <kbd className="rounded bg-ctp-surface0 px-1 py-0.5 font-mono text-[10px]">Ctrl-Shift-X</kbd> (Win)
                to open the HTML editor
              </li>
              <li>Paste the copied HTML and close the editor</li>
              <li>
                Press <kbd className="rounded bg-ctp-surface0 px-1 py-0.5 font-mono text-[10px]">Cmd-L</kbd> (Mac) or{" "}
                <kbd className="rounded bg-ctp-surface0 px-1 py-0.5 font-mono text-[10px]">Ctrl-L</kbd> (Win) to preview
              </li>
            </ol>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
