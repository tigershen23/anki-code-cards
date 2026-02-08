# Hopefully Final Data Flow

## Scope
This describes the runtime data flow from text entered in the editor textarea through:
1. Preview rendering in the right panel.
2. HTML generation and clipboard copy for Anki export.

## End-to-End Flow (Mermaid)
```mermaid
flowchart TD
  A["User edits textarea text/selection"] --> B["EditorPanel:onKeyDown"]
  A --> C["EditorPanel:onChange"]

  B --> D{"Key path"}
  D -->|"Tab / Shift+Tab"| E["textSelectionTransforms.indentSelection / dedentSelection"]
  D -->|"Enter (without Cmd/Ctrl)"| F["textSelectionTransforms.insertNewlineWithIndent"]
  D -->|"Closing token ] } )"| G["textSelectionTransforms.autoDedentClosing"]
  D -->|"No transform"| C

  E --> H["textareaMutations.applyTextEdit"]
  F --> H
  G -->|"returns edit"| H
  G -->|"returns null"| C

  I["useKeyboardShortcuts"] --> J{"Shortcut"}
  J -->|"mod+shift+k"| K["getNextClozeNumber + textSelectionTransforms.insertClozeAtSelection"]
  J -->|"mod+shift+/"| L["textSelectionTransforms.insertCommentCloze"]
  J -->|"mod+enter (no selection)"| M["useCopyHtml()"]

  K --> H
  L --> H

  H --> N["setRangeText + selection update + dispatch InputEvent('input')"]
  N --> C

  C --> O["EditorContext.setContent(nextText)"]

  P["EditorProvider mount"] --> Q["getShikiHighlighter()"]
  Q -->|"resolve"| R["setHighlighter(instance)"]
  Q -->|"reject"| S["setHighlighterError(true)"]

  O --> T["AppContent reads context state"]
  R --> T
  S --> T

  T --> U{"highlighterError?"}
  U -->|"yes"| V["Render fatal screen: 'Unfortunately, your environment does not support Anki Code Cards.'"]
  U -->|"no"| W["Render Toolbar + EditorPanel + PreviewPanel"]

  O --> X["PreviewPanel: useDebounceValue(content, 150ms)"]
  R --> X
  X --> Y["renderContentForPreview(debouncedContent, { highlighter })"]

  Y --> Z["parseContent -> prose/code blocks"]
  Z --> AA{"Block type"}
  AA -->|"code"| AB["extractAndReplaceClozes"]
  AB --> AC{"highlighter + non-plaintext lang?"}
  AC -->|"yes"| AD["highlightCode (Shiki codeToHtml)"]
  AC -->|"no"| AE["fallback escaped <pre><code>"]
  AD --> AF["cleanMarkers + restoreClozes"]
  AE --> AF
  AA -->|"prose"| AG["inline markdown-ish replacements + restoreClozes"]
  AF --> AH["join blocks with wrapper styles"]
  AG --> AH
  AH --> AI["PreviewPanel dangerouslySetInnerHTML"]

  W --> AJ{"highlighter available?"}
  AJ -->|"no"| AK["Preview header shows subtle 'highlighting...' animated ellipsis"]
  AJ -->|"yes"| AL["No loading label"]

  W --> AM["Toolbar Copy button"]
  AM --> M
  M --> AN["renderContentForOutput(content, highlighter)"]
  AN --> AO["same render pipeline as preview"]
  AO --> AP["useCopyToClipboard(outputHtml)"]
  AP --> AQ{"copy success?"}
  AQ -->|"yes"| AR["toast.success"]
  AQ -->|"no"| AS["toast.error"]
```

## Pipeline Contracts
- Editor input contract:
  - Input: `TextSelectionState` (`text`, `selectionStart`, `selectionEnd`) from textarea DOM.
  - Output: transformed `TextSelectionState` passed to `applyTextEdit`.
- Mutation contract:
  - Input: current textarea value + target edit result.
  - Output: minimal DOM text replacement + selection update + bubbling `input` event.
- Render contract (preview and output):
  - Input: raw markdown-like content + optional Shiki highlighter.
  - Output: full HTML string with inline styles and restored raw cloze markers (`{{cN::...}}`).
- Copy contract:
  - Input: rendered output HTML string.
  - Output: clipboard write success/failure + toast feedback.

## Notes on Current Behavior
- Preview is intentionally debounced by `150ms` to reduce render churn while typing.
- Loading UI is preview-only and subtle (`highlighting...` with animated ellipsis).
- Highlighter initialization failure is fatal for the app shell (`highlighterError` path).
- If rendering executes while highlighter is `null`, code blocks still render via escaped `<pre><code>` fallback.
