

# Remove Deleted PerformanceDashboard References + Fix Build Errors

The `PerformanceDashboard` component and `ayn_*` tables were deleted, but references remain in two frontend files causing build failures.

## Changes

### 1. `src/pages/Performance.tsx` — Delete the file
This page only exists to render `PerformanceDashboard`. With the component and tables gone, this page is dead code. Delete it entirely.

### 2. `src/pages/ChartAnalyzerPage.tsx` — Remove performance tab
- Remove the `PerformanceDashboard` import (line 8)
- Remove the `Activity` icon import (line 3) if only used for the performance tab
- Remove the "Performance" tab button (lines 125-136)
- Remove the performance tab content block (lines 194-201)
- Remove `'performance'` from the `activeTab` union type (line 19)

### 3. `src/App.tsx` — Remove Performance route (if it exists)
Check if there's a route pointing to `Performance.tsx` and remove it. (Search showed no match in App.tsx, so it may be lazy-loaded or already removed.)

### 4. Verify no other frontend files import `PerformanceDashboard`
The search confirmed only `Performance.tsx` and `ChartAnalyzerPage.tsx` import it. Both are covered above.

**Note:** The edge functions (`ayn-open-trade`, `ayn-monitor-trades`, `ayn-kill-switch`, `ayn-calculate-metrics`) still reference `ayn_*` tables but those are Supabase functions — they don't cause build errors and can be cleaned up separately if needed.

