import { Monitor } from "lucide-react";

export function MobileNotSupported() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ctp-base p-8 text-center">
      <div className="mb-6 rounded-full bg-ctp-surface0 p-4">
        <Monitor size={48} className="text-ctp-blue" />
      </div>
      <h1 className="mb-4 text-2xl font-semibold text-ctp-text">Desktop Required</h1>
      <p className="max-w-md text-ctp-subtext0">
        Anki Code Cards requires a desktop browser with keyboard support for the best editing experience. Please visit
        this page on a desktop or laptop computer.
      </p>
    </div>
  );
}
