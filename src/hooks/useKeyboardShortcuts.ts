import { useHotkeys } from "react-hotkeys-hook";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { useEditor, type PreviewMode } from "../context/EditorContext";
import { renderContentForOutput, getClozeCount } from "../lib/render";
import { getNextClozeNumber, insertClozeAtSelection } from "../lib/cloze";
import { detectCodeContext, getCommentSyntax } from "../lib/parser";

export function useKeyboardShortcuts() {
  const { content, setContent, highlighter, previewMode, setPreviewMode, textareaRef } = useEditor();
  const [, copy] = useCopyToClipboard();

  const insertCloze = (clozeNumber?: number) => {
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

  const insertCommentCloze = () => {
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

  const copyHtml = async () => {
    const outputHtml = renderContentForOutput(content, highlighter);
    const success = await copy(outputHtml);
    if (success) {
      toast.success("Copied HTML to clipboard!");
    } else {
      toast.error("Failed to copy to clipboard");
    }
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

  useHotkeys(
    "mod+shift+/",
    (e) => {
      e.preventDefault();
      insertCommentCloze();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+enter",
    (e) => {
      e.preventDefault();
      copyHtml();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );

  useHotkeys(
    "mod+shift+p",
    (e) => {
      e.preventDefault();
      cyclePreviewMode();
    },
    { enableOnFormTags: ["TEXTAREA"] },
  );
}
