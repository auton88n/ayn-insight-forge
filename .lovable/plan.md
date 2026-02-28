

# Fix ResponseCard Height — Control from Outside

The problem: the wrapper in `CenterStageLayout.tsx` uses `footerHeight + 200` which wastes ~200px of space. The `55vh` cap in `ResponseCard.tsx` adds a second conflicting constraint. The card stops growing well before the chat input.

The fix: let the **parent wrapper** define the exact available space (viewport minus footer minus 8px gap), and remove all fixed caps from inside `ResponseCard.tsx`.

## Changes

### 1. `src/components/dashboard/CenterStageLayout.tsx` — lines 660-663

Replace the wrapper style:

```tsx
// FROM:
style={{
  maxHeight: `calc(100dvh - ${footerHeight + 200}px)`,
  height: `calc(100dvh - ${footerHeight + 200}px)`,
  overflow: "hidden",
}}

// TO:
style={{
  maxHeight: `calc(100dvh - ${footerHeight + 8}px)`,
  ...(transcriptOpen ? { height: `calc(100dvh - ${footerHeight + 8}px)` } : {}),
  overflow: "hidden",
}}
```

- `footerHeight` already includes the chat input height + 24px padding (line 230).
- Adding only 8px keeps a subtle gap between card bottom and chat input top.
- Removing `height` in non-transcript mode lets the card be shorter than max when content is small.

### 2. `src/components/eye/ResponseCard.tsx` — line 373

Remove the fixed `55vh` cap; let the parent control sizing:

```tsx
// FROM:
transcriptOpen ? "h-full" : "max-h-[55vh]",

// TO:
"h-full",
```

The card now fills whatever height the parent allows. Internal scrolling is already handled by `flex-1 min-h-0 overflow-y-auto` on the content area.

No other files need changes.

