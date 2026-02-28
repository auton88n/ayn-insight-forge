

# Fix: ResponseCard cut off / hidden under chat input

The card is being capped too aggressively by two constraints working against each other.

## Changes

### 1. `src/components/dashboard/CenterStageLayout.tsx` (lines 660-663)

Replace the wrapper sizing to use a small gap (`+16`) instead of `+200`, and only set fixed `height` in transcript mode:

```tsx
// Current:
maxHeight: `calc(100dvh - ${footerHeight + 200}px)`,
height: `calc(100dvh - ${footerHeight + 200}px)`,
overflow: "hidden",

// New:
maxHeight: `calc(100dvh - ${footerHeight + 16}px)`,
...(transcriptOpen ? { height: `calc(100dvh - ${footerHeight + 16}px)` } : {}),
overflow: "hidden",
```

### 2. `src/components/eye/ResponseCard.tsx` (line 373)

Remove the fixed `max-h-[55vh]` cap — let the parent wrapper control the budget:

```tsx
// Current:
transcriptOpen ? "h-full" : "max-h-[55vh]",

// New:
"h-full",
```

The parent's dynamic `maxHeight` (viewport minus footer minus 16px) ensures the card never overlaps the chat input. The card fills available space and scrolls internally via the existing `flex-1 min-h-0 overflow-y-auto` on the content area.

