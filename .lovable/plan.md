

# Fix ResponseCard Height Constraint

## Changes in `src/components/eye/ResponseCard.tsx`

### 1. Line 372-373: Replace inline height classes
Change:
```
variant === "inline" && "h-full max-h-full min-h-0",
transcriptOpen && "h-full",
```
To:
```
variant === "inline" && "min-h-0",
transcriptOpen ? "h-full" : "max-h-[55vh]",
```

This caps the card at 55vh when not in transcript mode, forcing internal scrolling instead of unbounded growth.

No other changes needed — the content area already has `flex-1 min-h-0 overflow-y-auto` from the previous fix, so it will scroll correctly inside the bounded card.

