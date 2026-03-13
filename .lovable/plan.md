

# AYN Intelligence Section — Implementation Plan

## Where It Lives

In `CenterStageLayout.tsx`, between the Eye container and the footer/input area. It appears only when the user has **no active conversation** (no visible responses, no transcript open) — the idle/welcome state. Once the user starts chatting, it fades away and the normal response flow takes over.

## Component Structure

### New file: `src/components/dashboard/AYNIntelligence.tsx`

A single component with three collapsible/expandable cards stacked vertically:

**1. World Mood** — Always visible at the top
- A subtle ambient card with a one-sentence placeholder like "Things are a bit shaky right now. People are being careful with money."
- Small "Updated 2h ago" timestamp
- Gentle pulse animation to feel "alive"

**2. Is Now a Good Time?** — Expandable section
- 6 preset chips: "Start a business", "Raise my prices", "Sign a long-term contract", "Invest my savings", "Hire someone", "Build up savings"
- Plus a small text input for custom moves
- Clicking a chip shows a placeholder response card below it (e.g., "Not the best timing. People are holding back on spending, so new businesses face a tougher crowd right now.")
- Response includes a simple sentiment indicator (green/amber/red dot)

**3. My Decision** — Expandable section
- Free text input with placeholder "Describe any decision you're thinking about..."
- Submit button
- Shows a placeholder response below when submitted

### Design Approach
- Cards use subtle glass/muted backgrounds consistent with existing dark theme
- Compact on mobile (full width, stacked), slightly wider on tablet/desktop
- Framer Motion for enter/exit animations (consistent with existing codebase patterns)
- Max width matches the eye stage area

## Integration into CenterStageLayout.tsx

In the eye stage area (around line 636-711), after the eye container but before the ResponseCard wrapper, add the AYN Intelligence section — conditionally rendered when:
- `!hasVisibleResponses` (no chat responses showing)
- `!transcriptOpen` (history panel not open)
- `!showThinking` (AYN not processing)
- `!isTransitioningToChat`

This means it shows in the "idle" state where the eye is full-size and centered.

## Files to Create/Edit

1. **Create** `src/components/dashboard/AYNIntelligence.tsx` — The full intelligence component with all 3 features using placeholder data
2. **Edit** `src/components/dashboard/CenterStageLayout.tsx` — Import and render `AYNIntelligence` in the idle state, between eye and input

## Placeholder Data

- World Mood: "Things are a bit shaky right now. People are being careful with money." (updated 2h ago)
- Is Now a Good Time responses: hardcoded map of move → response string with sentiment color
- My Decision response: generic placeholder like "Based on what's happening in the world right now, this move has some headwinds..."

All placeholder data will be replaced later when connected to the `ayn_market_snapshot` backend.

