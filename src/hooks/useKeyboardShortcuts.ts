import { useHotkeys } from "react-hotkeys-hook";
import { useEditor } from "../context/EditorContext";
import { getNextClozeNumber } from "../lib/cloze";
import { insertClozeAtSelection, insertCommentCloze as buildCommentCloze } from "../lib/textSelectionTransforms";
import { applyTextEdit } from "../lib/textareaMutations";
import type { TextSelectionState } from "../lib/textSelection.types";
import { useCopyHtml } from "./useCopyHtml";

export function useKeyboardShortcuts() {
  const { textareaRef } = useEditor();
  const copyHtml = useCopyHtml({
    successMessage: "Copied HTML to clipboard!",
    errorMessage: "Failed to copy to clipboard",
  });

  const insertCloze = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selection: TextSelectionState = {
      text: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
    const num = getNextClozeNumber(textarea.value);
    const result = insertClozeAtSelection(selection, num);
    applyTextEdit(textarea, result);
  };

  const handleInsertCommentCloze = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selection: TextSelectionState = {
      text: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
    const result = buildCommentCloze(selection);
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
