import { useEditor } from "../context/EditorContext";
import { autoDedentClosing, dedentSelection, indentSelection, insertNewlineWithIndent } from "../lib/editorActions";
import { applyTextEdit } from "../lib/textareaMutations";
import { PanelHeader } from "./PanelHeader";
import { Textarea } from "./ui/textarea";

export function EditorPanel() {
  const { content, setContent, textareaRef } = useEditor();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    if (e.key === "Tab") {
      e.preventDefault();
      const result = e.shiftKey
        ? dedentSelection(value, selectionStart, selectionEnd)
        : indentSelection(value, selectionStart, selectionEnd);
      applyTextEdit(textarea, result);
      return;
    }

    // Skip Enter handling if Cmd/Ctrl is pressed (let hotkey handle Cmd+Enter)
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const result = insertNewlineWithIndent(value, selectionStart, selectionEnd);
      applyTextEdit(textarea, result, { inputType: "insertLineBreak" });
      return;
    }

    // Auto-dedent closing braces when typed as first non-whitespace character
    const autoDedentResult = autoDedentClosing(value, selectionStart, selectionEnd, e.key);
    if (autoDedentResult) {
      e.preventDefault();
      applyTextEdit(textarea, autoDedentResult);
    }
  };

  // Sync textarea changes back to React state
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-ctp-surface0">
      <PanelHeader title="Editor" />
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="editor-textarea h-full min-h-0 flex-1 resize-none overflow-auto rounded-none border-0 bg-white p-4 focus-visible:ring-0"
        placeholder="Write your card content here..."
        spellCheck={false}
      />
    </div>
  );
}
