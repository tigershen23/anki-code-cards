/**
 * Clipboard helper for HTML output.
 *
 * Why: both toolbar and hotkeys should share the same copy path and toasts so
 * messaging stays consistent.
 */
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { useEditor } from "../context/EditorContext";
import { renderContentForOutput } from "../lib/render";

interface CopyHtmlOptions {
  successMessage?: string;
  errorMessage?: string;
}

export function useCopyHtml(options: CopyHtmlOptions = {}) {
  const { content, highlighter } = useEditor();
  const [, copy] = useCopyToClipboard();

  return async () => {
    const outputHtml = renderContentForOutput(content, highlighter);
    const success = await copy(outputHtml);
    if (success) {
      toast.success(options.successMessage ?? "Copied HTML to clipboard");
    } else {
      toast.error(options.errorMessage ?? "Failed to copy");
    }
  };
}
