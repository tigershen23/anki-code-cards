import "./styles.css";

import { createRoot } from "react-dom/client";
import { useMediaQuery } from "usehooks-ts";

import { EditorProvider } from "./context/EditorContext";
import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { Toolbar } from "./components/Toolbar";
import { MobileNotSupported } from "./components/MobileNotSupported";
import { Toaster } from "./components/ui/sonner";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useEditor } from "./context/EditorContext";

function AppContent() {
  const { highlighterError } = useEditor();
  useKeyboardShortcuts();

  if (highlighterError) {
    return (
      <div className="flex h-screen items-center justify-center bg-ctp-base p-8 text-center">
        <p className="max-w-lg text-sm text-ctp-subtext0">
          Unfortunately, your environment does not support Anki Code Cards.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ctp-base">
      <Toolbar />
      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        <EditorPanel />
        <PreviewPanel />
      </div>
    </div>
  );
}

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return <MobileNotSupported />;
  }

  return (
    <EditorProvider>
      <AppContent />
      <Toaster />
    </EditorProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
