
Implementation steps:
1) In `src/components/dashboard/CenterStageLayout.tsx`, remove the current ResponseCard wrapper `maxHeight/height` formula based only on `footerHeight`.
2) Add a dedicated `responseWrapperRef` on the ResponseCard wrapper (`motion.div`) and a new state (e.g. `responseWrapperMaxHeight`).
3) Add a layout-measure effect that computes dynamic available height from outside:
   - `wrapperTop = responseWrapperRef.current.getBoundingClientRect().top`
   - `footerTop = footerRef.current.getBoundingClientRect().top`
   - `available = footerTop - wrapperTop - 8`
   - clamp to `>= 0` and store in state.
4) Recompute this measurement on:
   - footer resize (`ResizeObserver` on `footerRef`)
   - wrapper resize (`ResizeObserver` on `responseWrapperRef`)
   - viewport resize (`window.resize` + `visualViewport.resize` when available)
   - transcript/response visibility changes (`transcriptOpen`, `responseBubbles.length`, `sidebarOpen`, `isMobile`).
5) Apply wrapper sizing from the computed value:
   - `style={{ maxHeight: \`\${responseWrapperMaxHeight}px\`, ...(transcriptOpen ? { height: \`\${responseWrapperMaxHeight}px\` } : {}), overflow: "hidden" }}`
   - keep wrapper as the only outer height boundary (no hardcoded vh caps).
6) In `src/components/eye/ResponseCard.tsx`, keep/remain on outside-driven sizing:
   - no `max-h-[55vh]`
   - keep root `h-full`
   - keep internal content scroll (`flex-1 min-h-0 overflow-y-auto`) unchanged.
7) Clean up old comments mentioning the previous `footerHeight + 8` formula and replace with concise comment that height is now measured from wrapper top to footer top dynamically.

Technical details:
- This fully decouples card height from viewport assumptions and uses real runtime geometry, so the card cannot render under the fixed chat input.
- Keeping `height` only in transcript mode preserves full-panel transcript behavior; non-transcript mode remains content-sized up to dynamic `maxHeight`.
- Measurement should run in `useLayoutEffect` (or equivalent pre-paint timing) to reduce one-frame overlap/flicker during transitions.
