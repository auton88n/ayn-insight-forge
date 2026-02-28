

# Fix ResponseCard Action Bar Clipping

The action bar (copy, like/dislike, expand) gets cut off on long responses because the content area's `max-h-[50vh]` doesn't leave room for the header and action bar within the parent's overflow-hidden container.

## Change

**File:** `src/components/eye/ResponseCard.tsx`, line 509

Change:
```
variant === "inline" && "max-h-[50vh] sm:max-h-[55vh]",
```
To:
```
variant === "inline" && "max-h-[calc(50vh-84px)] sm:max-h-[calc(55vh-84px)]",
```

This reserves ~84px for the header (~40px) and action bar (~44px), keeping the buttons always visible.

