
# Remove All Trading Chart Analyzer Features

## What Will Be Removed

This is a large cleanup across the full stack. Here is everything identified:

---

## Frontend Files to Delete

### Pages
- `src/pages/ChartAnalyzerPage.tsx` — the entire Chart Analyzer page
- `src/pages/Performance.tsx` — AYN's paper trading performance page

### Components (src/components/dashboard/)
- `ChartAnalyzerResults.tsx`
- `ChartAnalysisSidebar.tsx`
- `ChartCoachSidebar.tsx`
- `ChartCoachChat.tsx`
- `ChartCompareView.tsx`
- `ChartHistoryDetail.tsx`
- `ChartHistoryList.tsx`
- `ChartHistoryStats.tsx`
- `ChartHistoryTab.tsx`
- `ChartUnifiedChat.tsx`

### Components (src/components/trading/)
- `AIDecisionLog.tsx`
- `ActivityTimeline.tsx`
- `LivePositionChart.tsx`
- `PerformanceDashboard.tsx`
- The entire `src/components/trading/` folder

### Hooks (src/hooks/)
- `useChartAnalyzer.ts`
- `useChartCoach.ts`
- `useChartHistory.ts`
- `useLivePrices.ts`

### Types
- `src/types/chartAnalyzer.types.ts`

---

## Frontend Files to Modify

### `src/App.tsx`
- Remove `ChartAnalyzerPage` and `Performance` lazy imports
- Remove `/chart-analyzer` and `/performance` routes

### `src/components/dashboard/Sidebar.tsx`
- Remove the "Charts" button card (the amber `BarChart3` button that navigates to `/chart-analyzer`)
- Remove the `BarChart3` and `Activity` icon imports if unused

### `src/constants/apiEndpoints.ts`
- Remove the `ANALYZE_TRADING_CHART: 'analyze-trading-chart'` entry

### `src/constants/routes.ts`
- Remove `CHART_ANALYZER: '/chart-analyzer'`

### `src/types/tutorial.types.ts`
- Remove the `chart-analyzer` entry from `TUTORIAL_STEPS`

### `src/components/tutorial/TutorialPage.tsx`
- Remove `ChartAnalyzerIllustration` import and its mapping entry

### `src/components/tutorial/TutorialIllustrations.tsx`
- Remove the `ChartAnalyzerIllustration` export function

### `src/hooks/useBubbleAnimation.ts`
- Remove `chartAnalysis` parameter references that import from `chartAnalyzer.types`

### `supabase/functions/ayn-unified/index.ts`
- Remove the `chart_analyses` query from the parallel data-fetch
- Remove the `ayn_account_state` + `ayn_paper_trades` queries and the `accountPerformance` context block
- Remove `EXECUTE_TRADE` parsing logic and autonomous trade execution block
- Remove the `marketScanner.ts` import and all scanner-related code
- Remove the `wantsAutonomousTrading` detection and scan injection logic
- Remove the chart history context injection (`chartSection`)

---

## Edge Functions to Delete

The following edge functions are exclusively trading/chart related and will be fully removed:

| Function | Purpose |
|---|---|
| `analyze-trading-chart` | Core chart analysis AI (with full trading knowledge base) |
| `ayn-calculate-metrics` | Computes Sharpe ratio, profit factor etc. |
| `ayn-close-trade` | Closes paper trades |
| `ayn-daily-snapshot` | Daily P&L snapshots |
| `ayn-kill-switch` | Emergency stop for trading |
| `ayn-monitor-trades` | 5-minute cron that runs TP/SL exits |
| `ayn-open-trade` | Opens paper trades |
| `get-klines` | Fetches Pionex candlestick data |
| `ws-relay` | WebSocket relay for live prices |

> **Note:** `ayn-unified` is kept but cleaned — it powers the main AYN chat and only the trading-specific code blocks inside it are removed.

---

## What Stays Untouched

- Main dashboard chat (`CenterStageLayout`, `DashboardContainer`)
- Engineering tools, compliance, AI grading
- Authentication, settings, pricing, support
- All other edge functions (admin, engineering, email, etc.)
- The `ayn-unified` edge function (cleaned of trading code)
- Tutorial system (just removing the chart-analyzer step)

---

## Technical Notes

- `marketScanner.ts` inside `ayn-unified/` will be deleted since it's only used for trading
- The `useBubbleAnimation.ts` hook references `ChartAnalysisResult` type — the relevant parameter will be removed
- The sidebar "Charts" quick-access button will be replaced by removing the entire third button slot (leaving Engineering + Compliance as a 2-column grid)
- No database schema changes are needed — the trading tables (`ayn_paper_trades`, `ayn_account_state`, etc.) can remain in the DB safely; only the code that reads/writes them is removed

