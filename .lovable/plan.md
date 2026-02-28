

# Add scroll-to-bottom arrow for ResponseCard (normal mode)

The auto-scroll logic already works (lines 264-272) — it scrolls when `shouldAutoScrollRef` is true (user is at bottom). The scroll-down arrow button already exists in history/transcript mode but is missing from normal response mode.

## Changes

### `src/components/eye/ResponseCard.tsx`

**1. Add a clickable scroll-to-bottom button in normal response mode (after the gradient overlay, lines 556-561)**

Replace the current non-clickable gradient overlay with a clickable scroll-down arrow button (matching the history mode pattern):

```tsx
{isScrollable && !isAtBottom && (
  <>
    <div
      className="absolute bottom-14 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"
      aria-hidden="true"
    />
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      onClick={() => {
        contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
        shouldAutoScrollRef.current = true;
      }}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 p-1.5 rounded-full bg-foreground text-background shadow-lg hover:bg-foreground/90 transition-colors"
      aria-label="Scroll to bottom"
    >
      <ChevronDown size={14} />
    </motion.button>
  </>
)}
```

Clicking the arrow also re-enables auto-scroll (`shouldAutoScrollRef = true`) so the card continues following new streaming content.

**2. Wrap the scroll button in `AnimatePresence` for smooth enter/exit.**

No other files need changes. The auto-scroll during streaming already works via the existing `useEffect` on `combinedContent` (line 264-272).

