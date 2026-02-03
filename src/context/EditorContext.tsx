import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

export interface ShikiHighlighter {
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
}

interface EditorState {
  content: string;
  setContent: (content: string) => void;
  highlighter: ShikiHighlighter | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const EditorContext = createContext<EditorState | null>(null);

const SAMPLE_CONTENT = `What does this React hook return?

\`\`\`tsx
import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
}

// {{c2::Custom hook that fetches user data and manages loading state}}
function useUser(id: number): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<{{c1::User | null}}>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    {{c3::fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })}};
  }, [id]);

  return { user, loading };
}
\`\`\`

The hook returns an object with \`user\` (nullable) and \`loading\` state.
`;

export function EditorProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(SAMPLE_CONTENT);
  const [highlighter, setHighlighter] = useState<ShikiHighlighter | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    import("shiki/bundle/web").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["catppuccin-latte"],
        langs: ["typescript", "tsx", "javascript", "jsx", "css", "scss", "html"],
      }).then(setHighlighter),
    );
  }, []);

  return (
    <EditorContext.Provider
      value={{
        content,
        setContent,
        highlighter,
        textareaRef,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
