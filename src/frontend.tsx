import "./styles.css";

import { createRoot } from "react-dom/client";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f4ee] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%),radial-gradient(circle_at_20%_80%,_rgba(251,191,36,0.16),_transparent_55%)]"
      />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-20">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-700/80">Anki + Code</p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Anki Code Cards
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Cards with beautiful code in vanilla Anki. Draft, refine, and export clean snippets with a
            lightweight toolkit.
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-600">
            <span className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2">Bun</span>
            <span className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2">React</span>
            <span className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2">Tailwind v4</span>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/75 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.6)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <h2 className="text-xl font-semibold">What ships in the scaffold</h2>
            <p className="text-sm text-slate-500">Minimal, fast, and ready to extend.</p>
          </div>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">Dev server + PM2</p>
              <p className="mt-2 text-slate-600">Bun serves a hot-reload React entry with PM2 support.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">Type + lint checks</p>
              <p className="mt-2 text-slate-600">tsgo, oxlint, and oxfmt stay wired for fast feedback.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">Playwright smoke test</p>
              <p className="mt-2 text-slate-600">A single check validates the title renders.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">Tailwind v4</p>
              <p className="mt-2 text-slate-600">One stylesheet with sorted utility classes.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
