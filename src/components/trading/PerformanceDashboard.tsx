import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Target, Award, BarChart3, AlertTriangle, CheckCircle, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import AIDecisionLog from '@/components/trading/AIDecisionLog';
import ActivityTimeline, { type TimelineEntry } from '@/components/trading/ActivityTimeline';
import { useLivePrices } from '@/hooks/useLivePrices';
import LivePositionChart from '@/components/trading/LivePositionChart';

// Types
interface AccountState {
  current_balance: number;
  starting_balance: number;
  total_pnl_dollars: number;
  total_pnl_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  largest_win_percent: number;
  largest_loss_percent: number;
  // Advanced metrics (populated by ayn-calculate-metrics daily)
  sharpe_ratio?: number;
  sortino_ratio?: number;
  profit_factor?: number;
  expectancy?: number;
  avg_trade_duration_hours?: number;
  longest_win_streak?: number;
  longest_loss_streak?: number;
  current_win_streak?: number;
  current_loss_streak?: number;
  max_drawdown_duration_days?: number;
  recovery_factor?: number;
  avg_win_size?: number;
  avg_loss_size?: number;
}

interface PaperTrade {
  id: string;
  ticker: string;
  timeframe: string;
  signal: string;
  entry_price: number;
  entry_time: string;
  position_size_percent: number;
  position_size_dollars: number;
  shares_or_coins: number;
  stop_loss_price: number;
  take_profit_1_price: number | null;
  take_profit_2_price: number | null;
  exit_price: number | null;
  exit_time: string | null;
  exit_reason: string | null;
  partial_exits: any[];
  pnl_dollars: number;
  pnl_percent: number;
  status: string;
  confidence_score: number | null;
  setup_type: string | null;
  reasoning: string | null;
  market_context: any;
  created_at: string;
}

interface DailySnapshot {
  snapshot_date: string;
  balance: number;
  daily_pnl_dollars: number;
}

interface SetupPerf {
  setup_type: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  avg_win_percent: number;
  avg_loss_percent: number;
  profit_factor: number;
}

interface CircuitBreaker {
  breaker_type: string;
  is_tripped: boolean;
  tripped_at: string | null;
  reason: string | null;
}

function StatsCard({ title, value, subtitle, positive }: {
  title: string; value: string; subtitle?: string; positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className={`text-2xl font-bold ${positive === true ? 'text-green-500' : positive === false ? 'text-red-500' : ''}`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

type MetricStatus = 'excellent' | 'good' | 'neutral' | 'poor' | 'warning';

function MetricCard({ title, value, subtitle, status = 'neutral' }: {
  title: string; value: string | number; subtitle?: string; status?: MetricStatus;
}) {
  const colorMap: Record<MetricStatus, string> = {
    excellent: 'text-green-500',
    good: 'text-blue-400',
    neutral: 'text-foreground',
    poor: 'text-red-500',
    warning: 'text-yellow-500',
  };
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] text-muted-foreground mb-1 leading-tight">{title}</p>
        <p className={`text-xl font-bold ${colorMap[status]}`}>{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function OpenPositionCard({ trade, onClose, livePrice }: {
  trade: PaperTrade;
  onClose: (id: string) => Promise<void>;
  livePrice?: number;
}) {
  const [closing, setClosing] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const entryPrice = Number(trade.entry_price);
  const shares = Number(trade.shares_or_coins);
  const isBuy = trade.signal === 'BUY';
  const positionSizeDollars = Number(trade.position_size_dollars);

  // Use live price for P&L when available, fallback to DB value
  const isLiveActive = !!livePrice;
  const currentPrice = livePrice ?? entryPrice;
  const liveGrossPnl = isBuy
    ? (currentPrice - entryPrice) * shares
    : (entryPrice - currentPrice) * shares;
  const displayPnl = isLiveActive ? liveGrossPnl : Number(trade.pnl_dollars);
  const displayPercent = positionSizeDollars > 0
    ? (displayPnl / positionSizeDollars) * 100 : 0;

  const handleClose = async () => {
    setClosing(true);
    try {
      await onClose(trade.id);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-lg font-bold">{trade.ticker}</span>
          <Badge variant="outline" className={`ml-2 text-[10px] ${isBuy ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
            {trade.signal}
          </Badge>
          {trade.setup_type && (
            <Badge variant="secondary" className="ml-1 text-[10px]">{trade.setup_type}</Badge>
          )}
          {isLiveActive && (
            <Badge variant="outline" className="ml-1 text-[10px] text-amber-400 border-amber-500/30">LIVE</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-right ${displayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span className="text-sm font-bold">
              {displayPnl >= 0 ? '+' : ''}{displayPercent.toFixed(2)}%
            </span>
            <br />
            <span className="text-xs">${displayPnl.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowChart(v => !v)}
            className="h-7 px-2 text-[11px] rounded border border-border/50 flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Chart {showChart ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={handleClose}
            disabled={closing}
          >
            {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" />Close</>}
          </Button>
        </div>
      </div>

      {/* Live price row */}
      {isLiveActive && (
        <div className="flex items-center gap-1.5 mb-2 text-xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
          <span className="text-muted-foreground">Current:</span>
          <span className="font-mono font-semibold">${livePrice!.toFixed(4)}</span>
          <span className="text-muted-foreground text-[10px]">● LIVE</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 text-xs">
        <div><span className="text-muted-foreground">Entry</span><br /><span className="font-medium">${entryPrice.toFixed(2)}</span></div>
        <div><span className="text-muted-foreground">Stop</span><br /><span className="font-medium text-red-400">${Number(trade.stop_loss_price).toFixed(2)}</span></div>
        <div><span className="text-muted-foreground">TP1</span><br /><span className="font-medium text-green-400">{trade.take_profit_1_price ? `$${Number(trade.take_profit_1_price).toFixed(2)}` : '—'}</span></div>
        <div><span className="text-muted-foreground">Size</span><br /><span className="font-medium">${positionSizeDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><br /><span className="text-[10px] text-muted-foreground">{trade.position_size_percent}%</span></div>
      </div>

      {trade.partial_exits && trade.partial_exits.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30">
          {trade.partial_exits.map((exit: any, i: number) => (
            <p key={i} className="text-[11px] text-green-400">✓ {exit.percent}% @ ${exit.price} (+${Number(exit.pnl).toFixed(2)})</p>
          ))}
        </div>
      )}

      {/* Expandable candlestick chart */}
      {showChart && (
        <LivePositionChart
          ticker={trade.ticker}
          entryPrice={entryPrice}
          stopLoss={Number(trade.stop_loss_price)}
          tp1={trade.take_profit_1_price ? Number(trade.take_profit_1_price) : null}
          tp2={trade.take_profit_2_price ? Number(trade.take_profit_2_price) : null}
          signal={trade.signal}
        />
      )}
    </div>
  );
}

function TradeRow({ trade }: { trade: PaperTrade }) {
  const isWin = Number(trade.pnl_dollars) > 0;
  const duration = trade.exit_time && trade.entry_time
    ? Math.round((new Date(trade.exit_time).getTime() - new Date(trade.entry_time).getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className={`py-2.5 px-3 border-b border-border/30 text-xs ${isWin ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
      {/* Line 1: Ticker + Signal + P&L */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium">{trade.ticker}</span>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${trade.signal === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{trade.signal}</Badge>
        </div>
        <span className={`font-bold shrink-0 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? '+' : ''}{Number(trade.pnl_percent).toFixed(2)}%
        </span>
      </div>
      {/* Line 2: Entry / Exit / Setup / Duration metadata */}
      <div className="flex items-center gap-3 mt-1 text-muted-foreground flex-wrap">
        <span>Entry <span className="text-foreground">${Number(trade.entry_price).toFixed(2)}</span></span>
        {trade.exit_price && <span>Exit <span className="text-foreground">${Number(trade.exit_price).toFixed(2)}</span></span>}
        {trade.setup_type && <span className="truncate max-w-[120px]">{trade.setup_type}</span>}
        {duration !== null && <span>{duration}h</span>}
      </div>
    </div>
  );
}


interface ChartAnalysis {
  id: string;
  ticker: string | null;
  timeframe: string | null;
  prediction_signal: string | null;
  confidence: number | null;
  created_at: string | null;
}

interface PerformanceDashboardProps {
  onNavigateToHistory?: (analysisId: string) => void;
}

export default function PerformanceDashboard({ onNavigateToHistory }: PerformanceDashboardProps) {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [allTrades, setAllTrades] = useState<PaperTrade[]>([]);
  const [chartAnalyses, setChartAnalyses] = useState<ChartAnalysis[]>([]);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [setupPerf, setSetupPerf] = useState<SetupPerf[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Live prices from Pionex WebSocket
  const openTickers = useMemo(() => openTrades.map(t => t.ticker), [openTrades]);
  const { prices: livePrices, connected: pricesConnected } = useLivePrices(openTickers);

  const killSwitch = circuitBreakers.find(b => b.breaker_type === 'KILL_SWITCH');
  const isKillSwitchActive = killSwitch?.is_tripped === true;

  const loadData = useCallback(async () => {
    const [acctRes, openRes, closedRes, snapRes, setupRes, allTradesRes, analysesRes, breakersRes] = await Promise.all([
      supabase.from('ayn_account_state').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single(),
      supabase.from('ayn_paper_trades').select('*').in('status', ['OPEN', 'PARTIAL_CLOSE']).order('entry_time', { ascending: false }),
      supabase.from('ayn_paper_trades').select('*').in('status', ['CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT']).order('exit_time', { ascending: false }).limit(20),
      supabase.from('ayn_daily_snapshots').select('*').order('snapshot_date', { ascending: true }).limit(90),
      supabase.from('ayn_setup_performance').select('*').order('total_trades', { ascending: false }),
      supabase.from('ayn_paper_trades').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('chart_analyses').select('id, ticker, timeframe, prediction_signal, confidence, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('ayn_circuit_breakers').select('breaker_type, is_tripped, tripped_at, reason'),
    ]);

    if (acctRes.data) setAccount(acctRes.data as any);
    if (openRes.data) setOpenTrades(openRes.data as any);
    if (closedRes.data) setClosedTrades(closedRes.data as any);
    if (snapRes.data) setSnapshots(snapRes.data as any);
    if (setupRes.data) setSetupPerf(setupRes.data as any);
    if (allTradesRes.data) setAllTrades(allTradesRes.data as any);
    if (analysesRes.data) setChartAnalyses(analysesRes.data as any);
    if (breakersRes.data) setCircuitBreakers(breakersRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);

    const tradesChannel = supabase
      .channel('dashboard-trades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ayn_paper_trades' }, () => {
        loadData();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    const accountChannel = supabase
      .channel('dashboard-account-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_account_state' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(accountChannel);
    };
  }, [loadData]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];

    chartAnalyses.forEach((a) => {
      entries.push({
        id: a.id,
        type: 'analysis',
        timestamp: a.created_at || '',
        summary: `Analyzed ${a.ticker || 'chart'} ${a.timeframe || ''} — ${a.prediction_signal || 'N/A'} ${a.confidence ? `${a.confidence}%` : ''}`,
        analysisId: a.id,
        signal: a.prediction_signal || undefined,
      });
    });

    allTrades.forEach((t) => {
      const isClosed = ['CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT'].includes(t.status);
      if (isClosed && t.exit_time) {
        entries.push({
          id: `${t.id}-close`,
          type: 'trade_close',
          timestamp: t.exit_time,
          summary: `Closed ${t.ticker} ${Number(t.pnl_percent) >= 0 ? '+' : ''}${Number(t.pnl_percent).toFixed(2)}%`,
          detail: `$${Number(t.pnl_dollars) >= 0 ? '+' : ''}${Number(t.pnl_dollars).toFixed(2)} — ${t.exit_reason || t.status}`,
          positive: Number(t.pnl_dollars) > 0,
          signal: t.signal,
        });
      }
      entries.push({
        id: `${t.id}-open`,
        type: 'trade_open',
        timestamp: t.entry_time,
        summary: `Opened ${t.signal} ${t.ticker} @ $${Number(t.entry_price).toFixed(2)}`,
        detail: t.setup_type ? `Setup: ${t.setup_type}` : undefined,
        signal: t.signal,
      });
    });

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
  }, [chartAnalyses, allTrades]);

  const handleKillSwitch = async () => {
    setKillSwitchLoading(true);
    try {
      const action = isKillSwitchActive ? 'reset' : 'trip';
      const reason = isKillSwitchActive ? undefined : 'Manual emergency stop from dashboard';
      const { error } = await supabase.functions.invoke('ayn-kill-switch', {
        body: { action, reason },
      });
      if (error) throw error;
      await loadData();
      toast.success(
        isKillSwitchActive
          ? 'Kill switch deactivated. Trading resumed.'
          : 'Kill switch activated. All trading halted.',
        { duration: 5000 }
      );
    } catch (err: any) {
      console.error('Kill switch error:', err);
      toast.error(`Kill switch failed: ${err.message || 'Unknown error'}`, {
        description: 'Please try again or contact support if the issue persists.',
        duration: 10000,
      });
    } finally {
      setKillSwitchLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    setCloseError(null);
    const { error } = await supabase.functions.invoke('ayn-close-trade', {
      body: { tradeId, reason: 'MANUAL_CLOSE' },
    });
    if (error) {
      setCloseError(`Failed to close trade: ${error.message}`);
      toast.error(`Failed to close position: ${error.message}`);
      return;
    }
    await loadData();
    setCloseError(null);
    toast.success('Position closed successfully.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground text-sm">Loading performance...</p>
        </div>
      </div>
    );
  }

  const pnlPositive = account ? account.total_pnl_dollars > 0 : false;

  return (
    <div className="space-y-6 pb-6">
      {/* Kill Switch Banner */}
      {isKillSwitchActive && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">Emergency Stop Active</p>
            <p className="text-xs text-muted-foreground truncate">{killSwitch?.reason || 'No new trades will be opened.'}</p>
          </div>
        </div>
      )}

      {/* Consecutive loss streak warning banner */}
      {(account?.current_loss_streak ?? 0) >= 2 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Losing Streak Warning</p>
            <p className="text-xs text-muted-foreground">
              {account!.current_loss_streak} consecutive losses.{' '}
              {(account!.current_loss_streak ?? 0) >= 3
                ? 'Trading automatically paused — click Resume Trading to reset.'
                : 'One more loss triggers automatic trading pause.'}
            </p>
          </div>
        </div>
      )}


      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {pricesConnected && openTrades.length > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          {!pricesConnected && isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {pricesConnected && openTrades.length > 0 ? 'Live prices' : isLive ? 'Realtime' : 'Updates every 30s'}
          </span>
        </div>
        <Button
          variant={isKillSwitchActive ? 'outline' : 'destructive'}
          size="sm"
          className={`gap-1.5 text-xs font-semibold ${isKillSwitchActive ? 'border-green-500/40 text-green-500 hover:bg-green-500/10' : ''}`}
          onClick={handleKillSwitch}
          disabled={killSwitchLoading}
        >
          {killSwitchLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isKillSwitchActive ? (
            <><CheckCircle className="h-3 w-3" /> Resume Trading</>
          ) : (
            <><AlertTriangle className="h-3 w-3" /> Emergency Stop</>
          )}
        </Button>
      </div>

      {/* Close error feedback */}
      {closeError && (
        <div className="text-xs text-red-400 rounded border border-red-500/30 bg-red-500/10 px-3 py-2">
          {closeError}
        </div>
      )}

      {/* Activity Timeline */}
      <ActivityTimeline entries={timelineEntries} onAnalysisClick={onNavigateToHistory} />

      {/* Stats Grid */}
      {account && (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Account Balance"
            value={`$${Number(account.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`Started: $${Number(account.starting_balance).toLocaleString()}`}
            positive={pnlPositive}
          />
          <StatsCard
            title="Total P&L"
            value={`${pnlPositive ? '+' : ''}${Number(account.total_pnl_percent).toFixed(2)}%`}
            subtitle={`$${pnlPositive ? '+' : ''}${Number(account.total_pnl_dollars).toFixed(2)}`}
            positive={pnlPositive}
          />
          <StatsCard
            title="Win Rate"
            value={`${Number(account.win_rate).toFixed(1)}%`}
            subtitle={`${account.winning_trades}W / ${account.losing_trades}L`}
          />
          <StatsCard
            title="Total Trades"
            value={String(account.total_trades)}
            subtitle={account.total_trades > 0 ? `Avg ${(Number(account.total_pnl_percent) / account.total_trades).toFixed(2)}%/trade` : 'No trades yet'}
          />
        </div>
      )}

      {/* Advanced Metrics Grid */}
      {account && (account.sharpe_ratio !== undefined && account.sharpe_ratio !== null) ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Advanced Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const sr = account.sharpe_ratio ?? 0;
                const so = account.sortino_ratio ?? 0;
                const pf = account.profit_factor ?? 0;
                const ex = account.expectancy ?? 0;
                const rf = account.recovery_factor ?? 0;
                return (<>
                  <MetricCard title="Sharpe Ratio" value={sr.toFixed(2)} subtitle="Risk-adjusted return" status={sr >= 2 ? 'excellent' : sr >= 1 ? 'good' : sr >= 0 ? 'neutral' : 'poor'} />
                  <MetricCard title="Sortino Ratio" value={so.toFixed(2)} subtitle="Downside risk adj." status={so >= 2 ? 'excellent' : so >= 1 ? 'good' : 'neutral'} />
                  <MetricCard title="Profit Factor" value={pf.toFixed(2)} subtitle="Gross profit / loss" status={pf >= 2.5 ? 'excellent' : pf >= 1.5 ? 'good' : pf >= 1.0 ? 'neutral' : 'poor'} />
                  <MetricCard title="Expectancy" value={`$${ex.toFixed(2)}`} subtitle="Avg $ per trade" status={ex > 0 ? 'good' : 'poor'} />
                  <MetricCard title="Win Streak" value={`${account.current_win_streak ?? 0} / ${account.longest_win_streak ?? 0}`} subtitle="Current / Longest" status={(account.current_win_streak ?? 0) >= 3 ? 'excellent' : 'neutral'} />
                  <MetricCard title="Loss Streak" value={`${account.current_loss_streak ?? 0} / ${account.longest_loss_streak ?? 0}`} subtitle="Current / Longest" status={(account.current_loss_streak ?? 0) >= 3 ? 'warning' : 'neutral'} />
                  <MetricCard title="Recovery Factor" value={rf.toFixed(2)} subtitle="Profit / Max DD" status={rf >= 3 ? 'excellent' : rf >= 1.5 ? 'good' : 'neutral'} />
                  <MetricCard title="Avg Duration" value={`${Number(account.avg_trade_duration_hours ?? 0).toFixed(1)}h`} subtitle="Per trade" status="neutral" />
                </>);
              })()}
            </div>
          </CardContent>
        </Card>
      ) : account ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Advanced Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-4">
            {account.total_trades < 5 ? (
              <p className="text-xs text-muted-foreground text-center">
                📊 Metrics available after 5+ closed trades ({account.total_trades}/5 completed)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Advanced metrics calculate daily at 00:10 UTC. Check back tomorrow or trigger manually.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Equity Curve */}
      {snapshots.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Account Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={snapshots}>
                <defs>
                  <linearGradient id="dashboardBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="snapshot_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#dashboardBalanceGradient)" strokeWidth={2} dot={snapshots.length === 1} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {snapshots.length === 1
                ? 'First snapshot captured. Chart grows daily at midnight UTC.'
                : `${snapshots.length} daily snapshots · Updated at midnight UTC`}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Open Positions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Open Positions
            <Badge variant="secondary" className="text-[10px]">{openTrades.length}/3</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No open positions. Waiting for high-conviction setup...
            </p>
          ) : (
            <div className="space-y-3">
              {openTrades.map(trade => (
                <OpenPositionCard
                  key={trade.id}
                  trade={trade}
                  onClose={handleCloseTrade}
                  livePrice={livePrices[trade.ticker]?.price}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Trades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" /> Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {closedTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 px-4">
              No closed trades yet.
            </p>
          ) : (
            <>
              <div className="flex justify-between py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                <span>Trade</span><span>P&L</span>
              </div>
              {closedTrades.map(trade => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Decision Log */}
      <AIDecisionLog trades={allTrades} />

      {/* Setup Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Setup Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {setupPerf.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Setup performance will appear after the first trade closes.</p>
              <p className="text-xs text-muted-foreground/60">Win rates and profit factors are tracked per setup type automatically.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-2 py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                <div>Setup</div><div>Trades</div><div>Win Rate</div><div>Avg Win</div><div>P/F</div>
              </div>
              {setupPerf.map(s => (
                <div key={s.setup_type} className="grid grid-cols-5 gap-2 py-2 px-3 text-xs border-b border-border/30">
                  <div className="font-medium">{s.setup_type}</div>
                  <div>{s.total_trades} ({s.winning_trades}W)</div>
                  <div className={Number(s.win_rate) >= 60 ? 'text-green-500' : 'text-muted-foreground'}>{Number(s.win_rate).toFixed(0)}%</div>
                  <div className="text-green-500">+{Number(s.avg_win_percent).toFixed(1)}%</div>
                  <div>{Number(s.profit_factor).toFixed(2)}</div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center italic">
        Paper trading account starting at $10,000. All trades are automatically generated by AYN's chart analysis.
      </p>
    </div>
  );
}
