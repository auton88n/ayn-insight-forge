

# Fix ResponseCard Dynamic Height

The wrapper at line 658-664 uses `calc(100dvh - ${footerHeight + 200}px)` for both `height` and `maxHeight`. The `+200` is an arbitrary padding that wastes space. The card should grow up to the chat input, not stop 200px above it.

## Changes

### 1. `src/components/dashboard/CenterStageLayout.tsx` (lines 658-664)

**Current:**
```tsx
<motion.div
  className={cn("w-full flex justify-center mt-2", transcriptOpen && "flex-1 min-h-0")}
  style={{
    maxHeight: `calc(100dvh - ${footerHeight + 200}px)`,
    height: `calc(100dvh - ${footerHeight + 200}px)`,
    overflow: "hidden",
  }}
```

**New:**
- Remove fixed `height` — only use `maxHeight` so the card doesn't force full height when content is short.
- Replace `+200` with `+16` (just a small gap above the input). The `footerHeight` already accounts for the chat input area, so we only need a tiny margin.
- For transcript mode keep using both height+maxHeight so it fills available space.

```tsx
<motion.div
  className={cn("w-full flex justify-center mt-2", transcriptOpen && "flex-1 min-h-0")}
  style={{
    maxHeight: `calc(100dvh - ${footerHeight + 16}px)`,
    ...(transcriptOpen ? { height: `calc(100dvh - ${footerHeight + 16}px)` } : {}),
    overflow: "hidden",
  }}
```

### 2. `src/components/eye/ResponseCard.tsx` (line 373)

Remove the `max-h-[55vh]` cap since the parent wrapper now dynamically controls the budget:

**Current:** `transcriptOpen ? "h-full" : "max-h-[55vh]"`  
**New:** `"h-full"`

This makes the card fill whatever space the parent allows, and the parent's `maxHeight` ensures it never overlaps the chat input.

