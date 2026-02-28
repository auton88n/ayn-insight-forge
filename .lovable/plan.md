
Implementation steps:
1. Update `src/components/dashboard/CenterStageLayout.tsx` ResponseCard wrapper sizing logic so inline mode gets a real bounded height (not only `maxHeight` + clip).
   - Replace current inline wrapper style with a computed `responseCardViewportHeight` using `100dvh` and `footerHeight`.
   - Apply both `height` and `maxHeight` to the wrapper in inline mode.
   - Keep transcript mode behavior unchanged.

2. Update `src/components/eye/ResponseCard.tsx` root container to fully respect parent height in inline mode.
   - Add inline-specific `h-full max-h-full min-h-0` on the outer card container.
   - Keep transcript mode `h-full` behavior intact.

3. Refactor inline content area constraint in `ResponseCard.tsx`.
   - Remove dependency on fixed `calc(50vh-84px)` as the primary limiter.
   - Let content area use `flex-1 min-h-0 overflow-y-auto` under the parent’s bounded height so footer actions (copy/like/dislike/expand) always remain visible.

4. Keep the bottom fade indicator aligned with the action bar.
   - Verify/update the absolute fade offset (`bottom-14`) if needed after height refactor so it never overlaps action buttons.

5. Validate layout behavior in preview for long responses.
   - Desktop: confirm card bottom actions are always visible.
   - Smaller viewport: confirm action bar remains visible and content scrolls internally.
   - Transcript mode: confirm no regression in history panel scrolling.

Technical details:
- Root cause is parent-level clipping (`overflow: hidden`) with only `maxHeight` on wrapper while child card is auto-height.
- Reliable fix is structural: give wrapper an explicit height budget + make card/content honor that budget with flex/min-h-0 rules.
- This avoids fragile pixel-subtraction tuning and keeps footer controls persistently visible.
