# Human

# Anki Cloze Code Card Editor — Implementation Spec

## What This Is

A local web app for authoring Anki Cloze deletion cards that contain syntax-highlighted code. You write mixed markdown + fenced code blocks, add cloze deletions via keyboard shortcuts, preview what the card will look like, and copy the final HTML to paste into Anki's single Text field.

Cloze cards in Anki use one text field — Anki automatically generates multiple cards from the cloze markers (each `{{cN::...}}` becomes a card where that cloze is hidden during review, then revealed when you flip).

The output is self-contained HTML with inline styles — no external CSS or JS dependencies — so it renders identically on Anki Desktop, AnkiMobile, and AnkiDroid.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React (Bun) | Fast dev, hot reload |
| UI Components | **shadcn/ui** with **Base UI** primitives | Modern unstyled components, full style control, accessible by default. Note: shadcn with Base UI will be configured separately before implementation begins. |
| Syntax highlighting | **Shiki** (`shiki/bundle/web`) | Uses TextMate grammars (same as VSCode), supports `catppuccin-latte` theme, produces inline-styled HTML. Use the web bundle for smaller size (~700KB gzip). |
| Markdown parsing | **react-markdown** with remark plugins | 100% CommonMark/GFM compliant, handles lists/bold/italic/inline code, extensible plugin ecosystem, safe by default |
| Toast notifications | **Sonner** via shadcn/ui | Beautiful defaults, simple API (`toast()`), already installed |
| Styling | Tailwind CSS | Required for shadcn, utility-first, works well with Catppuccin colors |
| Fonts | System monospace stack only | `ui-monospace, 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace` — no external font deps, looks native on macOS |
| Keyboard shortcuts | **react-hotkeys-hook** | Declarative hotkey binding via `useHotkeys` hook, handles Cmd vs Ctrl detection, scopes support, works in form fields with options |
| Utility hooks | **usehooks-ts** | Battle-tested hooks for common patterns: `useDebounce`, `useCopyToClipboard`, `useLocalStorage`, `useMediaQuery` |
| State management | **React Context** | Built-in, sufficient for this app's state needs (editor content, preview mode, active cloze number, highlighter instance) |
| Editor | **shadcn Textarea** | Native undo/redo, simple to implement Tab handling and auto-indent. No CodeMirror — keeps bundle small and avoids complexity. |

**Note:** All dependencies are already installed. No additional `bun add` commands needed.

---

## Catppuccin Latte Palette Reference

Use https://github.com/catppuccin/vscode/tree/main/packages/catppuccin-vscode

This is the light-background flavor. Use for all UI chrome. Shiki handles code token colors automatically via its `catppuccin-latte` theme. Make sure the overall color scheme of the application is consistent with the Catppuccin Latte palette but of course the code should be highlighted with the appropriate colors and stuff

```
Rosewater  #dc8a78    Flamingo  #dd7878    Pink      #ea76cb
Mauve      #8839ef    Red       #d20f39    Maroon    #e64553
Peach      #fe640b    Yellow    #df8e1d    Green     #40a02b
Teal       #179299    Sky       #04a5e5    Sapphire  #209fb5
Blue       #1e66f5    Lavender  #7287fd

Text       #4c4f69    Subtext1  #5c5f77    Subtext0  #6c6f85
Overlay2   #7c7f93    Overlay1  #8c8fa1    Overlay0  #9ca0b0
Surface2   #acb0be    Surface1  #bcc0cc    Surface0  #ccd0da
Base       #eff1f5    Mantle    #e6e9ef    Crust     #dce0e8
```

UI mapping:
- Page background: `Base` (#eff1f5)
- Editor background: white or `Mantle` (#e6e9ef)
- Code block background in preview/output: `Base` (#eff1f5) — matches Shiki's catppuccin-latte bg
- Borders: `Surface0` (#ccd0da)
- Primary text: `Text` (#4c4f69)
- Cloze highlight bg: `Lavender` (#7287fd) at ~20% opacity
- Cloze highlight border: `Lavender` (#7287fd)
- Active cloze (hidden): `Mauve` (#8839ef) pill/badge for `[...]`
- Buttons/accents: `Blue` (#1e66f5)

---

## Architecture — Three Panels

Roughly:

```
┌──────────────────────────────────────────────────────────────────┐
│  Toolbar: [Cloze ▾] [Comment Cloze] [Copy HTML] [Preview Mode ▾] │
├────────────────────────┬─────────────────────────────────────────┤
│                        │                                         │
│   EDITOR               │   PREVIEW                               │
│   (shadcn Textarea)    │   (rendered HTML)                       │
│                        │                                         │
│   Write markdown with  │   Live-updating preview showing         │
│   fenced code blocks   │   syntax-highlighted code with          │
│   and {{cN::...}}      │   cloze regions visually marked         │
│   cloze markers        │                                         │
│                        │                                         │
├────────────────────────┴─────────────────────────────────────────┤
│  OUTPUT (collapsible)                                             │
│  Raw HTML string — click to copy                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Panel 1: Editor (left)

A shadcn Textarea component where the user writes their card content. No fancy code editor (CodeMirror, Monaco, etc.) — just a styled textarea with manual handling for Tab and auto-indent. This keeps the bundle small and implementation simple. Content is a mix of:

1. **Prose** — plain text or basic markdown (bold, italic, inline code)
2. **Fenced code blocks** — standard triple-backtick blocks with language identifier:
   ````
   ```ts
   const x: number = 10;
   ```
   ````
3. **Cloze markers** — `{{c1::answer}}` or `{{c1::answer::hint}}` placed anywhere in text or inside code. These should be visually marked somehow in the editor and preview

Supported languages for code fences: `ts`, `tsx`, `js`, `jsx`, `css`, `scss`, `html`. Load these into Shiki upfront.

**Editor features:**
- Use shadcn Textarea component (`bunx shadcn@latest add textarea`) as the base
- Monospace font throughout
- Tab inserts 2 spaces (not a real tab character)
- Auto-indent: when pressing Enter after `{`, `(`, `[`, indent the next line
- Cmd+Z / Cmd+Shift+Z undo/redo (native textarea behavior)

### Panel 2: Preview (right)

A live-rendered view of what the card content will look like. Updates on every keystroke (debounce ~150ms using `useDebounce` from usehooks-ts).

**Rendering pipeline:**

1. Parse the editor text to identify:
   - Fenced code blocks (` ```lang ... ``` `)
   - Everything else (prose)
2. For code blocks: run through Shiki with `catppuccin-latte` theme and the detected language → get HTML with inline styles
3. For prose: run through react-markdown with remark-gfm → get HTML (lists, bold, italic, inline code)
4. For both: post-process to handle cloze markers (see Cloze Rendering below)

**Preview modes** (toggleable via toolbar dropdown or keyboard shortcut):

- **Edit mode** (default): Shows everything. Cloze regions are highlighted with a colored background/underline but the text is visible. Cloze markers (`{{c1::` and `}}`) are shown as subtle badges/pills.
- **Hidden mode**: Simulates reviewing a card with a specific cloze hidden. Select which cloze number to test (c1, c2, etc.). The active cloze shows `[...]` (or `[hint]` if a hint exists). Other clozes show their content normally.
- **Revealed mode**: Same as hidden mode but the active cloze is now shown (with a highlight to distinguish it as the "answer").

### Panel 3: Output (bottom, collapsible)

Shows the raw HTML string that gets pasted into Anki. This is the final deliverable.

**Output format:**

The HTML must be self-contained with ALL styles inline. No `<style>` blocks, no class names, no external resources. This is because Anki's field content is just raw HTML — there's no `<head>` or stylesheet.

Structure:
```html
<div style="font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 14px; line-height: 1.5; color: #4c4f69;">
  <!-- prose sections as <p> with inline styles -->
  <p style="...">What does this function return when called with <code style="...">add(2, 3)</code>?</p>
  
  <!-- code blocks as <pre><code> with Shiki's inline token styles -->
  <pre style="background: #eff1f5; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;">
    <code style="font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 14px;">
      <span style="color: #8839ef;">const</span> <span style="color: #4c4f69;">result</span> <span style="color: #04a5e5;">=</span> {{c1::<span style="color: #dd7878;">add</span><span style="color: #4c4f69;">(</span><span style="color: #fe640b;">2</span><span style="color: #4c4f69;">,</span> <span style="color: #fe640b;">3</span><span style="color: #4c4f69;">)</span>}};
    </code>
  </pre>
</div>
```

**Critical detail about cloze + HTML interaction:**

Anki processes cloze markers FIRST, then renders the remaining HTML. So cloze markers can wrap around HTML tags and it works. The `{{c1::` and `}}` markers must be in the output HTML at the exact positions they appear in the source text.

This means:
- The cloze markers are NOT HTML — they're raw text that Anki interprets
- They can span across multiple `<span>` tags
- They should NOT be inside HTML attributes
- The `{{` and `}}` delimiters must survive HTML entity encoding — they should be literal characters, not `&lbrace;&lbrace;`

Example of what Anki sees vs renders:

```
Input:  {{c1::const x = 5}}
Anki HTML stored: {{c1::<span style="color:#8839ef">const</span> <span style="color:#4c4f69">x</span> = <span style="color:#fe640b">5</span>}}
During review (hidden): [...]
After flip (revealed):  const x = 5  (syntax highlighted)
```

---

## Cloze Marker Handling — The Core Logic

### In the Editor

Cloze markers are literal text: `{{c1::content}}` or `{{c1::content::hint}}`

The user can type them manually or insert them via keyboard shortcuts (see below).

### In the Rendering Pipeline

When generating the preview and output HTML, the pipeline needs to:

1. **Before Shiki highlighting**: Extract cloze markers from code blocks, replacing them with unique placeholders that won't interfere with tokenization. E.g., replace `{{c1::` with `‹CLOZE_START_1›` and `}}` with `‹CLOZE_END›`. Use Unicode characters or strings that won't appear in real code.

2. **Run Shiki**: Highlight the code with placeholders in place. Shiki will treat them as regular text and wrap them in spans.

3. **After Shiki highlighting**: In the output HTML string, find the placeholders and replace them back with the literal cloze markers `{{c1::` and `}}`. These sit in the HTML as raw text — Anki will process them before rendering.

4. **For preview rendering**: Instead of replacing back to raw cloze markers, replace with visual indicators:
   - Edit mode: colored background span around the cloze content
   - Hidden mode: replace entire cloze content with `[...]` or `[hint]`
   - Revealed mode: show content with reveal highlight

**Edge case — cloze across prose:** In markdown prose sections, cloze markers just wrap around the rendered HTML the same way. E.g., `{{c1::some **bold** text}}` → `{{c1::some <strong>bold</strong> text}}`.

### Regex for Parsing Cloze Markers

```
/\{\{c(\d+)::((?:(?!\{\{c\d+::)(?!\}\}).)*?)(?:::((?:(?!\}\}).)*?))?\}\}/gs
```

Breaking it down:
- `\{\{c(\d+)::` — opening marker, capture cloze number
- `((?:(?!\{\{c\d+::)(?!\}\}).)*?)` — content (non-greedy, won't match nested cloze starts or ends)
- `(?:::((?:(?!\}\}).)*?))?\}\}` — optional hint, then closing

For nested clozes (Anki supports up to 3 levels), you'll need recursive handling. For v1, support non-nested clozes only. Nested is a stretch goal.

### Cloze Parser with Position Awareness

The parser should track cursor/character positions to answer: "Is position X inside a cloze, and if so, which one?"

This is needed for:
- Cmd+Shift+H (add hint) — needs to know if cursor is inside a cloze
- Syntax highlighting in editor — to visually mark cloze regions
- Comment cloze insertion — to determine the next cloze number

Implement a function like:

```ts
interface ClozeMatch {
  clozeNumber: number;
  content: string;
  hint?: string;
  startIndex: number;  // position of first `{`
  endIndex: number;    // position after last `}`
  contentStartIndex: number;  // position after `::`
  contentEndIndex: number;    // position before `}}` or `::hint`
}

function parseClozes(text: string): ClozeMatch[];
function isInsideCloze(text: string, cursorPosition: number): ClozeMatch | null;
```

---

## Keyboard Shortcuts

All shortcuts use Cmd on Mac. Detect platform and show appropriate modifier in UI. These shortcuts are chosen to avoid conflicts with browser DevTools (Cmd+Shift+C, Cmd+Shift+J) and navigation (Cmd+[, Cmd+]).

| Shortcut | Action | Details |
|----------|--------|---------|
| `Cmd+Shift+K` | **Insert cloze (new card)** | Wraps selected text in `{{cN::...}}` where N is `max_existing_cloze_number + 1`. If nothing selected, inserts `{{cN::}}` with cursor between `::` and `}}`. |
| `Cmd+Shift+[1-9]` | **Insert cloze (specific number)** | Wraps selected text in `{{cN::...}}` with the specified N. |
| `Cmd+Shift+H` | **Add hint to nearest cloze** | If cursor is inside a cloze, prompts (inline) for hint text and appends `::hint` before the `}}`. |
| `Cmd+Shift+/` | **Insert comment cloze above** | Inserts a new line above the current line: `// {{cN::}}` with cursor positioned to type the explanation. Auto-increments N. The `//` should match the code context — use `/* */` for CSS blocks. |
| `Cmd+Enter` | **Copy HTML to clipboard** | Copies the output HTML and shows a brief "Copied!" toast. |
| `Cmd+Shift+P` | **Cycle preview mode** | Cycles: Edit → Hidden (c1) → Hidden (c2) → ... → Revealed → Edit |
| `Tab` / `Shift+Tab` | **Indent/dedent selected lines** | When text is selected, adds/removes 2 spaces at start of selected lines. When no selection, Tab inserts 2 spaces normally. |

### Implementation with react-hotkeys-hook

Use the `useHotkeys` hook from `react-hotkeys-hook` for all keyboard shortcuts. The library handles Cmd vs Ctrl detection automatically when using `mod` modifier.

```tsx
import { useHotkeys } from 'react-hotkeys-hook';

// Example: Insert new cloze (Cmd+Shift+K)
useHotkeys('mod+shift+k', (e) => {
  e.preventDefault();
  insertCloze(getNextClozeNumber());
}, { enableOnFormTags: ['TEXTAREA'] });

// Example: Insert specific cloze number (1-9)
useHotkeys('mod+shift+1, mod+shift+2, mod+shift+3, mod+shift+4, mod+shift+5, mod+shift+6, mod+shift+7, mod+shift+8, mod+shift+9', (e, handler) => {
  e.preventDefault();
  const num = handler.keys?.[0];
  if (num) insertCloze(parseInt(num));
}, { enableOnFormTags: ['TEXTAREA'] });

// Example: Copy HTML
useHotkeys('mod+enter', (e) => {
  e.preventDefault();
  copyHtmlToClipboard();
}, { enableOnFormTags: ['TEXTAREA'] });
```

Key options to use:
- `enableOnFormTags: ['TEXTAREA']` — required since the editor is a textarea
- `preventDefault: true` — can be set globally or per-handler
- Use `mod` instead of `meta` or `ctrl` for cross-platform Cmd/Ctrl support

### Cloze Number Auto-Increment Logic

Scan the entire editor text for existing `{{cN::` patterns. Track the highest N seen. When inserting a new cloze via `Cmd+Shift+K`, use `highest + 1`. When inserting via `Cmd+Shift+/` (comment cloze), also use `highest + 1`.

---

## Shiki Integration Details

### Setup

Use the web bundle for smaller bundle size. Shiki will be bundled with the app — no need to handle loading failures.

```ts
import { createHighlighter } from 'shiki/bundle/web';

const highlighter = await createHighlighter({
  themes: ['catppuccin-latte'],
  langs: ['typescript', 'tsx', 'javascript', 'jsx', 'css', 'scss', 'html'],
});
```

### Generating Output HTML

```ts
// For each code block extracted from the markdown:
const html = highlighter.codeToHtml(codeWithPlaceholders, {
  lang: detectedLang,  // 'ts', 'tsx', 'jsx', 'css', etc.
  theme: 'catppuccin-latte',
});
```

Shiki's `codeToHtml` produces a `<pre class="shiki catppuccin-latte" style="background-color:#eff1f5;color:#4c4f69">` wrapper. For the Anki output, you'll want to:

1. Keep the inline styles on the `<pre>` and `<code>` elements
2. Strip class names (Anki doesn't need them)
3. Add the font-family stack to the `<pre>` and `<code>` 
4. Ensure the background, padding, border-radius are on `<pre>`

### Language Detection from Fence

Map fence identifiers to Shiki language names:
```
ts, typescript → typescript
tsx → tsx  
js, javascript → javascript
jsx → jsx
css → css
scss → scss
html → html
react → tsx
```

---

## Anki Output — Paste Workflow

The user's workflow is:

1. Write card content in the editor
2. Verify in preview
3. Hit `Cmd+Enter` to copy HTML
4. In Anki: Add Note → select Cloze note type → paste into the Text field
5. Add note

**Note about Anki cards**: Since all cards are cloze deletions, there's only one text field to work with. Anki automatically generates cards from the cloze markers — each `{{cN::...}}` becomes a separate card where that cloze is hidden during review and revealed when you flip.

---

## Markdown/Prose Handling

Use **react-markdown** with remark-gfm plugin for text outside code fences.

**For preview:** Render react-markdown directly as React components with custom `components` prop for inline styles.

**For output HTML:** Use `ReactDOMServer.renderToStaticMarkup()` on the same react-markdown tree to produce an HTML string. This keeps preview and output rendering unified.

```tsx
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom components with inline styles
const components = {
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
  code: ({ children }) => <code style={{ fontFamily: '...', background: '#e6e9ef', padding: '2px 6px', borderRadius: '4px' }}>{children}</code>,
  // ... etc
};

// For preview: render as React
<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{prose}</ReactMarkdown>

// For output: serialize to HTML string
const outputHtml = ReactDOMServer.renderToStaticMarkup(
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{prose}</ReactMarkdown>
);
```

Support:

- `**bold**` → `<strong style="font-weight:700;">bold</strong>`
- `*italic*` → `<em style="font-style:italic;">italic</em>`
- `` `inline code` `` → `<code style="font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace; background: #e6e9ef; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">inline code</code>`
- Line breaks → `<br>` (Anki uses `<br>` not `<p>` typically, but either works)
- `---` → `<hr style="border: none; border-top: 1px solid #ccd0da; margin: 12px 0;">`
- Unordered lists (`- item`) → `<ul><li>` with inline styles
- Ordered lists (`1. item`) → `<ol><li>` with inline styles
- Nested lists → proper indentation preserved

Do NOT support:
- Headers (h1-h6) — these don't make sense on flashcards
- Links — not useful in Anki
- Images — separate workflow

Cloze markers in prose are passed through literally to the output HTML.

---

## UI Design Notes

### Catppuccin Latte Theme Application

The entire app UI should use the Catppuccin Latte palette. This is a light, warm, pastel theme — NOT a dark coding theme.

- Clean, warm white backgrounds (`Base` and `Mantle`)
- Soft borders using `Surface0`/`Crust`
- Accent colors for interactive elements: `Blue` for primary actions, `Mauve` for cloze-related UI
- Monospace font everywhere (this is a code-focused tool)
- Minimal chrome — the content is the focus

### Toolbar

Horizontal bar. Buttons styled as subtle pills with Catppuccin colors.
- Cloze insertion buttons on the left
- Preview mode toggle on the right
- Copy button prominent, maybe with `Blue` background

### Keyboard Shortcut Hints

Show shortcut hints on hover for all toolbar buttons. Also show a small `?` button that reveals a shortcut cheat sheet overlay.

### Toast Notifications

Use **Sonner** via shadcn/ui (already installed). Add `<Toaster />` to the app root and use `toast()` anywhere:

```tsx
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// In app root
<Toaster />

// Usage anywhere
toast.success('Copied to clipboard!');
toast.error('Failed to copy');
```

Position bottom-right, auto-dismiss after 2s. Style toasts to match Catppuccin Latte palette — use `Green` (#40a02b) for success, `Red` (#d20f39) for errors.

### Mobile Support

This app is desktop-only. Below a reasonable breakpoint (e.g., `md` / 768px), show a friendly "Mobile not supported" screen instead of the editor UI. The message should:

- Be centered and use Catppuccin Latte styling
- Explain the app requires a desktop browser
- Look polished, not like an error page

---

## Cloze Visual Rendering in Preview

### Edit Mode
```html
<!-- Cloze region gets a colored background -->
<span style="background: rgba(114,135,253,0.15); border-bottom: 2px solid #7287fd; padding: 1px 2px; border-radius: 2px;">
  <span style="color: #7287fd; font-size: 0.75em; font-weight: 600; vertical-align: super;">c1</span>
  <!-- actual highlighted content here -->
</span>
```

### Hidden Mode (testing c1)
```html
<!-- Active cloze (c1) shown as blank -->
<span style="background: #8839ef; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600;">[...]</span>

<!-- or with hint: -->
<span style="background: #8839ef; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600;">[hint text]</span>

<!-- Other clozes (c2, c3) shown normally with subtle underline -->
<span style="border-bottom: 1px dashed #7287fd;">content</span>
```

### Revealed Mode (showing c1)
```html
<!-- Revealed cloze shown with highlight -->
<span style="background: rgba(64,160,43,0.15); border-bottom: 2px solid #40a02b; padding: 1px 2px; border-radius: 2px;">
  revealed content
</span>
```

---

## Comment Cloze Feature (Cmd+Shift+/)

This inserts a JavaScript/CSS comment line above the current cursor line, with a cloze inside it. The purpose is to create "explain this code" cards where the hidden content is a comment/explanation.

Behavior:
1. Detect whether the cursor is inside a code block
2. If inside a TS/JS/JSX/TSX block: insert `// {{cN::}}`
3. If inside a CSS block: insert `/* {{cN::}} */`
4. If in prose: insert `<!-- {{cN::}} -->`
5. Place cursor inside the cloze (between `::` and `}}`)
6. The new line is inserted ABOVE the current line, at the same indentation level

Example before pressing Cmd+Shift+/:
```ts
const result = arr.filter(x => x > 0);
```

After (cursor at `|`):
```ts
// {{c2::|}}
const result = arr.filter(x => x > 0);
```

User types "filter returns a new array with elements passing the test":
```ts
// {{c2::filter returns a new array with elements passing the test}}
const result = arr.filter(x => x > 0);
```

---

## Implementation Order

1. **Theme + Layout**: Define Catppuccin Latte palette constants, build the 3-panel layout with correct colors/fonts. (shadcn/Base UI will already be configured)

2. **Shiki singleton**: Initialize Shiki with `catppuccin-latte` and all needed langs using the web bundle. Shiki is bundled with the app and will always load successfully.

3. **Parser**: Write `parseContent(text: string): Block[]` that splits editor text into prose and code blocks. Handle the fence detection (` ```lang ... ``` `).

4. **Basic rendering**: For code blocks, run through Shiki. For prose, do basic markdown. Combine into preview HTML. Wire up live preview on editor change (use `useDebounce` from usehooks-ts).

5. **Cloze placeholder system**: Implement the extract→placeholder→highlight→replace pipeline for both preview and output rendering.

6. **Keyboard shortcuts**: Wire up all shortcuts using `useHotkeys` from react-hotkeys-hook. Test cloze insertion, comment cloze, copy, indent/dedent.

7. **Preview modes**: Implement edit/hidden/revealed toggle with cloze number selection.

8. **Output panel**: Generate the Anki-ready HTML string. Implement copy to clipboard (use `useCopyToClipboard` from usehooks-ts).

9. **Polish**: Toast notifications (Sonner), shortcut help overlay, mobile-not-supported screen (use `useMediaQuery` from usehooks-ts), edge cases.

---

## State Management (React Context)

Use React Context for shared state. No external state management library (zustand, redux, etc.) — the app is simple enough that Context handles it well.

### EditorContext

```tsx
interface EditorState {
  content: string;
  setContent: (content: string) => void;
  previewMode: 'edit' | 'hidden' | 'revealed';
  setPreviewMode: (mode: 'edit' | 'hidden' | 'revealed') => void;
  activeClozeNumber: number;
  setActiveClozeNumber: (n: number) => void;
  highlighter: Highlighter | null; // Shiki instance, null until loaded
}

const EditorContext = createContext<EditorState | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'hidden' | 'revealed'>('edit');
  const [activeClozeNumber, setActiveClozeNumber] = useState(1);
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    // Initialize Shiki on mount (using web bundle)
    import('shiki/bundle/web').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['catppuccin-latte'],
        langs: ['typescript', 'tsx', 'javascript', 'jsx', 'css', 'scss', 'html'],
      }).then(setHighlighter)
    );
  }, []);

  return (
    <EditorContext.Provider value={{
      content, setContent,
      previewMode, setPreviewMode,
      activeClozeNumber, setActiveClozeNumber,
      highlighter,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
```

Components access state via `useEditor()` hook. The provider wraps the app at the root level.

---

## Utility Hooks (usehooks-ts)

Use these hooks from usehooks-ts instead of writing custom implementations:

| Hook | Usage |
|------|-------|
| `useDebounce` | Debounce editor content for preview updates (~150ms) |
| `useCopyToClipboard` | Copy HTML output to clipboard with success/error handling |
| `useLocalStorage` | Optionally persist editor content between sessions |
| `useMediaQuery` | Detect mobile breakpoint for "Mobile not supported" screen |

Example usage:

```tsx
import { useDebounce, useCopyToClipboard, useMediaQuery } from 'usehooks-ts';

// Debounced preview
const debouncedContent = useDebounce(editorContent, 150);
useEffect(() => {
  renderPreview(debouncedContent);
}, [debouncedContent]);

// Copy to clipboard
const [, copy] = useCopyToClipboard();
const handleCopy = async () => {
  const success = await copy(outputHtml);
  if (success) toast.success('Copied!');
  else toast.error('Failed to copy');
};

// Mobile detection
const isMobile = useMediaQuery('(max-width: 768px)');
if (isMobile) return <MobileNotSupported />;
```

---

## Unit Testing

Run tests with `mise test` (wraps `bun test`). Tests live in `src/**/*.test.ts` files alongside the code they test.

### What to Test

Focus unit tests on the core parsing/rendering logic — these are pure functions that are easy to test and critical to get right.

**Cloze parser (`src/lib/cloze.test.ts`):**
- Basic cloze extraction: `{{c1::content}}` → correct ClozeMatch
- Cloze with hint: `{{c1::content::hint}}` → hint captured correctly
- Multiple clozes in text → all found with correct positions
- `isInsideCloze()` at various cursor positions
- Code containing `}}` that's NOT a cloze end (e.g., `obj = {{ key }}`)
- Empty cloze: `{{c1::}}` → valid match with empty content
- Cloze number extraction for auto-increment logic

**Content parser (`src/lib/parser.test.ts`):**
- Splits prose and code blocks correctly
- Detects language from fence (` ```ts `, ` ```javascript `, etc.)
- Handles multiple code blocks
- Handles no code blocks (pure prose)
- Handles code block at start/end of content

**Cloze placeholder system (`src/lib/render.test.ts`):**
- Placeholders inserted correctly before Shiki
- Placeholders replaced with cloze markers in output
- Placeholders replaced with visual indicators in preview (edit/hidden/revealed modes)
- Cloze spanning multiple Shiki spans works correctly

**Example test file structure:**

```ts
// src/lib/cloze.test.ts
import { describe, test, expect } from 'bun:test';
import { parseClozes, isInsideCloze, getMaxClozeNumber } from './cloze';

describe('parseClozes', () => {
  test('extracts basic cloze', () => {
    const result = parseClozes('Hello {{c1::world}}!');
    expect(result).toHaveLength(1);
    expect(result[0].clozeNumber).toBe(1);
    expect(result[0].content).toBe('world');
  });

  test('handles code with }} that is not a cloze end', () => {
    const result = parseClozes('const obj = {{ a: 1 }}; {{c1::answer}}');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('answer');
  });
});

describe('isInsideCloze', () => {
  test('returns cloze when cursor is inside content', () => {
    const text = 'Hello {{c1::world}}!';
    const result = isInsideCloze(text, 12); // cursor on 'o' in 'world'
    expect(result).not.toBeNull();
    expect(result?.clozeNumber).toBe(1);
  });

  test('returns null when cursor is outside cloze', () => {
    const text = 'Hello {{c1::world}}!';
    const result = isInsideCloze(text, 2); // cursor on 'l' in 'Hello'
    expect(result).toBeNull();
  });
});
```

---

## Edge Cases to Handle

- **Empty cloze**: `{{c1::}}` — valid in Anki, show as empty bracket `[...]` in hidden mode
- **Cloze spanning multiple lines in code**: Should work, but warn user it can be tricky in Anki
- **Cloze inside a string literal**: `const msg = "hello {{c1::world}}"` — the `{{` could confuse some parsers. Make sure the cloze regex is greedy-safe.
- **Code containing `}}`**: e.g., `const obj = {{ a: 1 }};` — the parser must not confuse object literals with cloze endings. Test this thoroughly.
- **Multiple code blocks**: Each block is highlighted independently
- **No code blocks**: Pure prose card — still valid, just no syntax highlighting
- **Unknown language on fence**: Fall back to plaintext
- **Very long lines**: Use `overflow-x: auto` on `<pre>` in output so Anki scrolls horizontally
- **Anki paste quirks**: Anki may auto-close tags or add `<div>` wrappers. The output should be flat (no deeply nested divs) to minimize interference.

---

## Testing Checklist

### Syntax Highlighting
- [ ] Code block with TS is syntax-highlighted correctly in preview
- [ ] TSX/JSX components highlighted (tags, props, expressions)
- [ ] CSS properties, values, selectors, at-rules highlighted
- [ ] React/JSX component tags highlighted differently from HTML tags
- [ ] Unknown language fence falls back to plaintext gracefully

### Cloze Functionality
- [ ] Cloze markers render visually in edit mode (colored background)
- [ ] Hidden mode hides the correct cloze with `[...]`, shows others normally
- [ ] Revealed mode shows the correct cloze with highlight
- [ ] Cmd+Shift+K inserts cloze with correct auto-incremented number
- [ ] Cmd+Shift+1 through 9 inserts specific cloze numbers
- [ ] Cmd+Shift+/ inserts comment cloze above current line (with correct comment syntax)
- [ ] Cloze with hint shows hint text in `[hint]` in hidden mode
- [ ] Multiple clozes generate correct preview for each cloze number

### Markdown/Prose
- [ ] Bold text (`**bold**`) renders correctly
- [ ] Italic text (`*italic*`) renders correctly
- [ ] Inline code (`` `code` ``) renders with monospace styling
- [ ] Unordered lists (`- item`) render with proper styling
- [ ] Ordered lists (`1. item`) render with proper styling
- [ ] Nested lists render with proper indentation
- [ ] Mixed prose + code card renders both sections correctly

### Output & Clipboard
- [ ] Cmd+Enter copies output HTML to clipboard
- [ ] Sonner toast shows "Copied!" confirmation
- [ ] Pasting output HTML into Anki works
- [ ] Card renders correctly in Anki review (cloze hides/reveals properly)
- [ ] Output HTML has all inline styles (no external CSS)

### UI/UX
- [ ] Mobile breakpoint shows "Mobile not supported" screen
- [ ] Desktop shows full editor/preview layout
- [ ] Shortcut help overlay displays correctly
- [ ] Preview updates live on editor changes (debounced)
- [ ] Tab inserts 2 spaces in editor (no selection)
- [ ] Tab/Shift+Tab indent/dedent selected lines

---

## Sample Test Cards

Use these cards to verify the editor works correctly. They cover various scenarios: prose-heavy, code-heavy, and mixed content.

---

### Test Card 1: React Hook (Code-Heavy)

````
What does this React hook return?

```tsx
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
    {{c3::fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })}};
  }, [id]);

  return { user, loading };
}
```

The hook returns an object with `user` (nullable) and `loading` state.
````

---

### Test Card 2: JavaScript Concepts (Prose-Heavy with Lists)

````
What are the key differences between `let`, `const`, and `var` in JavaScript?

**Scope:**
- `var` is {{c1::function-scoped}}
- `let` and `const` are {{c2::block-scoped}}

**Hoisting:**
- `var` declarations are hoisted and initialized to `undefined`
- `let` and `const` are hoisted but {{c3::not initialized}} (temporal dead zone)

**Reassignment:**
- `var` and `let` can be {{c4::reassigned}}
- `const` {{c5::cannot be reassigned}} (but object properties can still be mutated)

Example of block scoping:

```js
if (true) {
  var x = 1;
  let y = 2;
}
console.log(x); // {{c6::1}}
console.log(y); // {{c7::ReferenceError}}
```
````

---

### Test Card 3: CSS Flexbox (Mixed)

````
How do you center an element both horizontally and vertically using Flexbox?

```css
.container {
  display: {{c1::flex}};
  justify-content: {{c2::center}};
  align-items: {{c3::center}};
  height: 100vh;
}
```

- `justify-content` controls alignment along the {{c4::main axis}} (horizontal by default)
- `align-items` controls alignment along the {{c5::cross axis}} (vertical by default)
````

---

### Test Card 4: TypeScript Generics (Code-Focused)

````
What does this generic function do?

```ts
// {{c1::Extracts the resolved type from a Promise}}
type Awaited<T> = T extends Promise<infer U> ? U : T;

// {{c2::Creates a function that only runs once, caching the result}}
function once<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  
  return () => {
    if (!called) {
      {{c3::result = fn();
      called = true;}}
    }
    return result;
  };
}
```

Usage: `const getConfig = once(() => loadExpensiveConfig());`
````

---

### Test Card 5: Array Methods (Prose with Inline Code)

````
What's the difference between `map()`, `filter()`, and `reduce()`?

- `map()` — {{c1::transforms each element}}, returns array of **same length**
- `filter()` — {{c2::keeps elements passing a test}}, returns array of **equal or fewer** elements  
- `reduce()` — {{c3::accumulates into a single value}}, returns **any type**

```js
const nums = [1, 2, 3, 4, 5];

// Double each number
const doubled = nums.map(n => {{c4::n * 2}});
// [2, 4, 6, 8, 10]

// Keep only even numbers
const evens = nums.filter(n => {{c5::n % 2 === 0}});
// [2, 4]

// Sum all numbers
const sum = nums.reduce((acc, n) => {{c6::acc + n}}, 0);
// 15
```
````

---

### Test Card 6: React Component Pattern (JSX)

````
What pattern does this component implement?

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

// {{c1::Compound component pattern for flexible composition}}
function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}

// {{c2::Sub-component attached to parent for namespaced usage}}
Button.Icon = ({ name }: { name: string }) => (
  <span className="btn-icon">{name}</span>
);

// Usage:
<Button variant="primary">
  {{c3::<Button.Icon name="save" />}}
  Save Changes
</Button>
```
````

---

# Agent
