import "./styles.css";

import { createRoot } from "react-dom/client";
import { useMediaQuery } from "usehooks-ts";

import { EditorProvider } from "./context/EditorContext";
import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { OutputPanel } from "./components/OutputPanel";
import { Toolbar } from "./components/Toolbar";
import { MobileNotSupported } from "./components/MobileNotSupported";
import { Toaster } from "./components/ui/sonner";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

function AppContent() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col bg-ctp-base">
      <Toolbar />
      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        <EditorPanel />
        <PreviewPanel />
      </div>
      <OutputPanel />
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
