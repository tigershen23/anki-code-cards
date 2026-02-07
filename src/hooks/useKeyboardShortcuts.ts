import { useHotkeys } from "react-hotkeys-hook";
import { useEditor } from "../context/EditorContext";
import { getNextClozeNumber } from "../lib/cloze";
import { insertClozeAtSelection, insertCommentCloze as buildCommentCloze } from "../lib/editorActions";
import { applyTextEdit } from "../lib/textareaMutations";
import { useCopyHtml } from "./useCopyHtml";

export function useKeyboardShortcuts() {
  const { textareaRef } = useEditor();
  const copyHtml = useCopyHtml({
    successMessage: "Copied HTML to clipboard!",
    errorMessage: "Failed to copy to clipboard",
  });

  const insertCloze = (clozeNumber?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const num = clozeNumber ?? getNextClozeNumber(textarea.value);
    const result = insertClozeAtSelection(textarea.value, start, end, num);
    applyTextEdit(textarea, result);
  };

  const handleInsertCommentCloze = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const result = buildCommentCloze(textarea.value, cursorPos);
    applyTextEdit(textarea, result);
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
    [
      "mod+shift+1",
      "mod+shift+2",
      "mod+shift+3",
      "mod+shift+4",
      "mod+shift+5",
      "mod+shift+6",
      "mod+shift+7",
      "mod+shift+8",
      "mod+shift+9",
    ],
    (e, hotkeysEvent) => {
      e.preventDefault();
      const hotkey = hotkeysEvent?.hotkey ?? "";
      const match = hotkey.match(/(\d)$/);
      const clozeNumber = match ? parseInt(match[1] ?? "", 10) : NaN;
      if (!Number.isNaN(clozeNumber)) {
        insertCloze(clozeNumber);
      }
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  // mod+shift+/ - need both variants for cross-platform compatibility
  useHotkeys(
    ["mod+shift+/", "mod+shift+slash"],
    (e) => {
      e.preventDefault();
      handleInsertCommentCloze();
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
        void copyHtml();
      }
      // If there's a selection, let the default behavior happen (none for mod+enter)
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );
}
