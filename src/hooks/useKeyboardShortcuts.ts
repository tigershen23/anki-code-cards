import { useHotkeys } from "react-hotkeys-hook";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { useEditor } from "../context/EditorContext";
import { renderContentForOutput } from "../lib/render";
import { getNextClozeNumber } from "../lib/cloze";
import { detectCodeContext, getCommentSyntax } from "../lib/parser";

// Helper to replace selection range with text while preserving undo history
function replaceRange(textarea: HTMLTextAreaElement, start: number, end: number, text: string) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
  document.execCommand("insertText", false, text);
}

export function useKeyboardShortcuts() {
  const { content, highlighter, textareaRef } = useEditor();
  const [, copy] = useCopyToClipboard();

  const insertCloze = (clozeNumber?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const num = clozeNumber ?? getNextClozeNumber(textarea.value);
    const selectedText = textarea.value.slice(start, end);

    const clozePrefix = `{{c${num}::`;
    const clozeSuffix = "}}";

    if (selectedText.length === 0) {
      replaceRange(textarea, start, end, clozePrefix + clozeSuffix);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + clozePrefix.length;
      }, 0);
    } else {
      replaceRange(textarea, start, end, clozePrefix + selectedText + clozeSuffix);
      setTimeout(() => {
        const newCursorPos = start + clozePrefix.length + selectedText.length + clozeSuffix.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  const insertCommentCloze = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    const context = detectCodeContext(text, cursorPos);
    const { prefix, suffix } = getCommentSyntax(context.language);
    const clozeNum = getNextClozeNumber(text);

    const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;
    const commentLine = context.indent + prefix + `{{c${clozeNum}::}}` + suffix + "\n";

    const cursorInCloze = lineStart + context.indent.length + prefix.length + `{{c${clozeNum}::`.length;

    replaceRange(textarea, lineStart, lineStart, commentLine);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorInCloze;
    }, 0);
  };

  const copyHtml = async () => {
    const outputHtml = renderContentForOutput(content, highlighter);
    const success = await copy(outputHtml);
    if (success) {
      toast.success("Copied HTML to clipboard!");
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  useHotkeys(
    "mod+shift+k",
    (e) => {
      e.preventDefault();
      insertCloze();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+1",
    (e) => {
      e.preventDefault();
      insertCloze(1);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+2",
    (e) => {
      e.preventDefault();
      insertCloze(2);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+3",
    (e) => {
      e.preventDefault();
      insertCloze(3);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+4",
    (e) => {
      e.preventDefault();
      insertCloze(4);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+5",
    (e) => {
      e.preventDefault();
      insertCloze(5);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+6",
    (e) => {
      e.preventDefault();
      insertCloze(6);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+7",
    (e) => {
      e.preventDefault();
      insertCloze(7);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+8",
    (e) => {
      e.preventDefault();
      insertCloze(8);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+9",
    (e) => {
      e.preventDefault();
      insertCloze(9);
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  // mod+shift+/ - need both variants for cross-platform compatibility
  useHotkeys(
    "mod+shift+/",
    (e) => {
      e.preventDefault();
      insertCommentCloze();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+slash",
    (e) => {
      e.preventDefault();
      insertCommentCloze();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+enter",
    (e) => {
      const textarea = textareaRef.current;
      // Only copy HTML if there's no selection
      if (textarea && textarea.selectionStart === textarea.selectionEnd) {
        e.preventDefault();
        copyHtml();
      }
      // If there's a selection, let the default behavior happen (none for mod+enter)
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );
}
