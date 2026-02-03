import { useEditor } from "../context/EditorContext";
import { Textarea } from "./ui/textarea";

// Helper to modify textarea content while preserving undo history
function execInsert(textarea: HTMLTextAreaElement, text: string) {
  textarea.focus();
  document.execCommand("insertText", false, text);
}

// Replace selection range with text while preserving undo history
function replaceRange(textarea: HTMLTextAreaElement, start: number, end: number, text: string) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
  document.execCommand("insertText", false, text);
}

export function EditorPanel() {
  const { content, setContent, textareaRef } = useEditor();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift-Tab: de-dent current line or selection
        const lineStart = content.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = start === end ? content.indexOf("\n", start) : end;
        const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
        const selectedLines = content.slice(lineStart, actualLineEnd);
        const dedented = selectedLines
          .split("\n")
          .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
          .join("\n");
        const currentLineIndent = content.slice(lineStart, start).match(/^(\s*)/)?.[1]?.length ?? 0;
        const reduction = selectedLines.length - dedented.length;
        replaceRange(textarea, lineStart, actualLineEnd, dedented);
        setTimeout(() => {
          const newStart = Math.max(lineStart, start - Math.min(2, currentLineIndent));
          textarea.selectionStart = newStart;
          textarea.selectionEnd = start === end ? newStart : Math.max(lineStart, end - reduction);
        }, 0);
      } else if (start !== end) {
        const lineStart = content.lastIndexOf("\n", start - 1) + 1;
        const selectedLines = content.slice(lineStart, end);
        const indented = selectedLines
          .split("\n")
          .map((line) => "  " + line)
          .join("\n");
        replaceRange(textarea, lineStart, end, indented);
        setTimeout(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = lineStart + indented.length;
        }, 0);
      } else {
        execInsert(textarea, "  ");
      }
    }

    // Skip Enter handling if Cmd/Ctrl is pressed (let hotkey handle Cmd+Enter)
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const currentLine = content.slice(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] || "";

      const charBefore = content[start - 1] ?? "";
      const extraIndent = ["{", "(", "["].includes(charBefore) ? "  " : "";

      execInsert(textarea, "\n" + indent + extraIndent);
    }

    // Auto-dedent closing braces when typed as first non-whitespace character
    if (["]", "}", ")"].includes(e.key)) {
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const textBeforeCursor = content.slice(lineStart, start);

      // Only dedent if line is whitespace-only before cursor
      if (/^\s+$/.test(textBeforeCursor) && textBeforeCursor.length >= 2) {
        e.preventDefault();
        const dedentedIndent = textBeforeCursor.slice(2);
        replaceRange(textarea, lineStart, start, dedentedIndent + e.key);
      }
    }
  };

  // Sync textarea changes back to React state
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-ctp-surface0">
      <div className="flex items-center border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">Editor</span>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="editor-textarea h-full min-h-0 flex-1 resize-none rounded-none border-0 bg-white p-4 focus-visible:ring-0 overflow-auto"
        placeholder="Write your card content here..."
        spellCheck={false}
      />
    </div>
  );
}
