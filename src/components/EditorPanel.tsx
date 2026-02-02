import { useEditor } from "../context/EditorContext";
import { Textarea } from "./ui/textarea";

export function EditorPanel() {
  const { content, setContent, textareaRef } = useEditor();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey && start !== end) {
        const lines = content.slice(start, end).split("\n");
        const dedented = lines.map((line) => (line.startsWith("  ") ? line.slice(2) : line)).join("\n");
        const newContent = content.slice(0, start) + dedented + content.slice(end);
        setContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = start;
          textarea.selectionEnd = start + dedented.length;
        }, 0);
      } else if (start !== end) {
        const lineStart = content.lastIndexOf("\n", start - 1) + 1;
        const selectedLines = content.slice(lineStart, end);
        const indented = selectedLines
          .split("\n")
          .map((line) => "  " + line)
          .join("\n");
        const newContent = content.slice(0, lineStart) + indented + content.slice(end);
        setContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = lineStart + indented.length;
        }, 0);
      } else {
        const newContent = content.slice(0, start) + "  " + content.slice(end);
        setContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }

    if (e.key === "Enter") {
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const currentLine = content.slice(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] || "";

      const charBefore = content[start - 1] ?? "";
      const extraIndent = ["{", "(", "["].includes(charBefore) ? "  " : "";

      e.preventDefault();
      const newContent = content.slice(0, start) + "\n" + indent + extraIndent + content.slice(start);
      setContent(newContent);
      setTimeout(() => {
        const newPos = start + 1 + indent.length + extraIndent.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-ctp-surface0">
      <div className="border-b border-ctp-surface0 bg-ctp-mantle px-4 py-2">
        <span className="text-xs font-medium tracking-wider text-ctp-subtext0 uppercase">Editor</span>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="editor-textarea h-full flex-1 resize-none rounded-none border-0 bg-white p-4 focus-visible:ring-0"
        placeholder="Write your card content here..."
        spellCheck={false}
      />
    </div>
  );
}
