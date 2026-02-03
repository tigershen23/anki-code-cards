# Human

Okay, let's have a tooltip that's open by default. We can put it in local storage once it's closed, and it can be opened again. But just the first time a user loads the application, it should be open and should have a description of how to use the application, what the application is for, the problem it solves, and you can model it after the current keyboard shortcuts in terms of the tooltip-y-ness (remember to use base ui though, probably best to convert both to base ui so you get the arrow for example).

The tooltip should take over the space in the current keyboard shortcuts menu, and the current keyboard shortcuts menu should go behind a keyboard icon next to it. Additionally, let's put the info icon next to the title in Keycode cards and the keyboard shortcut icon. Move them both over to the right of the title so that "Copy HTML" is the only button in the top right of the page.

The instructions should be very clear and they should also link to instructions to open the HTML editor in Anki, which is where things should be pasted, as well as give instructions for previewing the card from the Anki editor. 

---

# Agent

## Overview

Implement a first-time user (FTU) experience using a Base UI Popover that shows app description and usage instructions. The popover opens automatically on first visit (tracked via localStorage) and can be reopened via an info icon. Additionally, migrate the existing keyboard shortcuts help to Base UI Popover and reorganize the toolbar layout.

## Architecture Decisions

### Why Popover over Tooltip

Per Base UI docs, Tooltip is for brief hints shown on hover/focus. For rich content with close buttons and complex instructions, Popover is the correct choice. It supports:
- `defaultOpen` prop for first-load behavior
- Explicit Close component
- Title and Description sub-components
- Click-outside-to-close behavior (default)
- Arrow pointing to trigger

### localStorage Strategy

Key: `anki-code-cards-ftu-dismissed`
- On first load: key doesn't exist → popover opens
- When closed: set key to `"true"`
- Info icon click: always opens popover regardless of localStorage state

The state will be managed with React `useState` initialized from localStorage, combined with Base UI's controlled `open`/`onOpenChange` pattern.

## Component Changes

### New File: `src/components/HelpPopover.tsx`

Create a reusable popover wrapper that encapsulates Base UI Popover styling consistent with current help panel aesthetic. This will be used by both the info popover and keyboard shortcuts popover.

Structure:
```tsx
// Shared popover styling wrapper
export function HelpPopover({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen
})
```

### New File: `src/components/InfoPopover.tsx`

Contains the FTU/info content:

**Content sections:**
1. **What is this?** - Brief description: "A specialized editor for creating Anki cloze cards with syntax-highlighted code blocks."

2. **The Problem** - Why it exists: "Anki's editor doesn't preserve code formatting or syntax highlighting. This tool generates styled HTML that maintains proper formatting."

3. **How to Use:**
   - Write content in the editor using markdown code fences
   - Wrap text with cloze syntax: `{{c1::hidden text}}`
   - Use `{{c1::text::hint}}` for hints
   - Click "Copy HTML" when ready

4. **Pasting into Anki:**
   - Open Anki and create/edit a card
   - Click the field you want to edit
   - Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Win) to open HTML editor
   - Paste the copied HTML
   - Close HTML editor to see formatted preview
   - Click "Preview" button (or `Cmd+P`/`Ctrl+P`) to test the card

### Modified: `src/components/Toolbar.tsx`

**Layout restructure:**

Before:
```
[Anki Code Cards]                    [Copy HTML] [?]
```

After:
```
[Anki Code Cards] [ℹ] [⌨]                  [Copy HTML]
```

**Changes:**
1. Remove inline keyboard shortcuts help panel
2. Import `InfoPopover` and `KeyboardShortcutsPopover` components
3. Add `Info` icon (lucide-react) next to title
4. Add `Keyboard` icon (lucide-react) next to info icon
5. Both icons trigger their respective Base UI Popovers
6. Move icons to left side, keep only Copy HTML on right

**State management:**
- `infoOpen` state initialized from localStorage check
- `keyboardOpen` state (starts closed)
- Pass controlled state to popover components

### New File: `src/components/KeyboardShortcutsPopover.tsx`

Migrated from current inline implementation to Base UI Popover. Same content structure as before but wrapped in Popover components with Arrow.

## Styling Approach

Use existing Tailwind utilities and Catppuccin color variables. Match current help panel aesthetic:
- White background (`bg-white`)
- Border: `border-ctp-surface0`
- Shadow: `shadow-lg`
- Rounded corners: `rounded-lg`
- Text sizes: `text-xs` for content, `text-xs font-semibold` for headings

For Base UI Popover custom styling:
- Apply classes to `Popover.Popup`: `w-80 rounded-lg border border-ctp-surface0 bg-white p-4 shadow-lg`
- Arrow styling: `fill-white stroke-ctp-surface0`

## Implementation Order

1. **Create `HelpPopover.tsx`** - Base wrapper component with Arrow and common styling
2. **Create `KeyboardShortcutsPopover.tsx`** - Migrate existing shortcuts content to use HelpPopover
3. **Create `InfoPopover.tsx`** - New FTU content component
4. **Update `Toolbar.tsx`** - Restructure layout, wire up both popovers with localStorage logic
5. **Test FTU flow** - Verify opens on first load, remembers dismissal, reopens via icon

## Edge Cases

- **localStorage unavailable**: Default to showing popover (fail open for discoverability)
- **Both popovers open**: Base UI handles this - clicking one trigger while other is open will close the first
- **Mobile**: App already shows mobile-not-supported screen, so not a concern

## Dependencies

All required packages already installed:
- `@base-ui/react` - Popover component
- `lucide-react` - Info and Keyboard icons
- `usehooks-ts` - Optional for localStorage hook if preferred

## Testing

Manual verification:
1. Clear localStorage, reload → info popover opens
2. Close popover, reload → stays closed
3. Click info icon → opens
4. Click keyboard icon → keyboard shortcuts show
5. Click outside either → closes
