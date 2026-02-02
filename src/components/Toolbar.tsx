import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Copy, Plus, Hash, MessageSquare, Eye, EyeOff, Check, HelpCircle } from "lucide-react";
import { useEditor, type PreviewMode } from "../context/EditorContext";
import { renderContentForOutput, getClozeCount } from "../lib/render";
import { getNextClozeNumber, insertClozeAtSelection } from "../lib/cloze";
import { detectCodeContext, getCommentSyntax } from "../lib/parser";
import { useState } from "react";

const PREVIEW_MODE_LABELS: Record<PreviewMode, string> = {
  edit: "Edit",
  hidden: "Hidden",
  revealed: "Revealed",
};

const PREVIEW_MODE_ICONS: Record<PreviewMode, typeof Eye> = {
  edit: Eye,
  hidden: EyeOff,
  revealed: Check,
};

export function Toolbar() {
  const { content, setContent, highlighter, previewMode, setPreviewMode, activeClozeNumber, textareaRef } = useEditor();
  const [, copy] = useCopyToClipboard();
  const [showHelp, setShowHelp] = useState(false);

  const handleCopyHtml = async () => {
    const outputHtml = renderContentForOutput(content, highlighter);
    const success = await copy(outputHtml);
    if (success) {
      toast.success("Copied HTML to clipboard!");
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleInsertCloze = (clozeNumber?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const num = clozeNumber ?? getNextClozeNumber(content);

    const { newText, newCursorPosition } = insertClozeAtSelection(content, start, end, num);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = newCursorPosition;
    }, 0);
  };

  const handleInsertCommentCloze = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const context = detectCodeContext(content, cursorPos);
    const { prefix, suffix } = getCommentSyntax(context.language);
    const clozeNum = getNextClozeNumber(content);

    const lineStart = content.lastIndexOf("\n", cursorPos - 1) + 1;
    const commentLine = context.indent + prefix + `{{c${clozeNum}::}}` + suffix + "\n";

    const newContent = content.slice(0, lineStart) + commentLine + content.slice(lineStart);
    setContent(newContent);

    const cursorInCloze = lineStart + context.indent.length + prefix.length + `{{c${clozeNum}::`.length;

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = cursorInCloze;
    }, 0);
  };

  const cyclePreviewMode = () => {
    const modes: PreviewMode[] = ["edit", "hidden", "revealed"];
    const currentIndex = modes.indexOf(previewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    if (nextMode) {
      setPreviewMode(nextMode);
    }
  };

  const PreviewIcon = PREVIEW_MODE_ICONS[previewMode];

  return (
    <>
      <div className="flex items-center justify-between border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleInsertCloze()}
            className="flex items-center gap-1 rounded bg-ctp-surface0 px-3 py-1.5 text-xs font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
            title="Insert new cloze (Cmd+Shift+K)"
          >
            <Plus size={14} />
            Cloze
          </button>

          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleInsertCloze(num)}
                className="flex h-7 w-7 items-center justify-center rounded text-xs font-medium text-ctp-subtext0 transition-colors hover:bg-ctp-surface0 hover:text-ctp-text"
                title={`Insert c${num} cloze (Cmd+Shift+${num})`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="mx-2 h-4 w-px bg-ctp-surface0" />

          <button
            onClick={handleInsertCommentCloze}
            className="flex items-center gap-1 rounded bg-ctp-surface0 px-3 py-1.5 text-xs font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
            title="Insert comment cloze (Cmd+Shift+/)"
          >
            <MessageSquare size={14} />
            Comment
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cyclePreviewMode}
            className="flex items-center gap-1 rounded bg-ctp-surface0 px-3 py-1.5 text-xs font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
            title="Cycle preview mode (Cmd+Shift+P)"
          >
            <PreviewIcon size={14} />
            {PREVIEW_MODE_LABELS[previewMode]}
          </button>

          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1 rounded bg-ctp-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ctp-sapphire"
            title="Copy HTML (Cmd+Enter)"
          >
            <Copy size={14} />
            Copy HTML
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex h-7 w-7 items-center justify-center rounded text-ctp-subtext0 transition-colors hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Keyboard shortcuts"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="absolute top-14 right-4 z-50 w-80 rounded-lg border border-ctp-surface0 bg-white p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold text-ctp-text">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Insert new cloze</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">⌘⇧K</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Insert cloze 1-9</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">⌘⇧1-9</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Comment cloze</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">⌘⇧/</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Copy HTML</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">⌘↵</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Cycle preview mode</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">⌘⇧P</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-ctp-subtext0">Indent/dedent</span>
              <kbd className="rounded bg-ctp-surface0 px-1.5 py-0.5 font-mono">Tab/⇧Tab</kbd>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-3 w-full rounded bg-ctp-surface0 py-1.5 text-xs font-medium text-ctp-text hover:bg-ctp-surface1"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
