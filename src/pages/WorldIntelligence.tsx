import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, RefreshCw, Clock, AlertTriangle, TrendingUp, Shield, Zap, Ship, Cpu,
  Globe2, BarChart3, Flame, Radio, Activity, ChevronDown, ChevronUp, Target,
  DollarSign, Newspaper, Eye, Crosshair, ChevronRight, Layers, Users, Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { HeatMap2D, MapPoint } from '@/components/dashboard/HeatMap2D';

/* ─── Types ─── */
interface MarketSnapshot { snapshot: Json; fetched_at: string; sources_used: string[] | null; fetch_errors: string[] | null; }

const SIC_COORDINATES: Record<string, [number, number]> = {
  'USA': [-95.7, 37.0], 'CHN': [104.1, 35.8], 'EU': [10.4, 51.1], 'GBR': [-3.4, 55.3],
  'SAU': [45.0, 23.8], 'ARE': [53.8, 23.4], 'JPN': [138.2, 36.2], 'IND': [78.9, 20.5],
  'BRA': [-51.9, -14.2], 'RUS': [105.3, 61.5], 'IRQ': [43.6, 33.2], 'KOR': [127.7, 35.9],
  'ZAF': [22.9, -30.5], 'CAN': [-106.3, 56.1], 'AUS': [133.7, -25.2]
};

/* ─── Helpers ─── */
function safeArray(val: any): any[] { if (Array.isArray(val)) return val; return []; }
function safeObj(val: any): Record<string, any> { if (val && typeof val === 'object' && !Array.isArray(val)) return val; return {}; }
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return format(d, 'MMM d, HH:mm');
  } catch { return ''; }
}

/* ─── Category Sidebar ─── */
const categories = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'markets', label: 'Markets', icon: BarChart3 },
  { id: 'crypto', label: 'Crypto', icon: Zap },
  { id: 'macro', label: 'Macro', icon: TrendingUp },
  { id: 'demographics', label: 'Demographics', icon: Users },
  { id: 'tourism', label: 'Tourism', icon: Plane },
  { id: 'predictions', label: 'Predictions', icon: Target },
] as const;

/* ─── Reusable UI ─── */
function HudPanel({ title, icon: Icon, children, color = 'cyan', collapsible = false, defaultOpen = true, id }: {
  title: string; icon: any; children: React.ReactNode; color?: 'cyan' | 'red' | 'amber' | 'emerald' | 'purple' | 'blue';
  collapsible?: boolean; defaultOpen?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    cyan: { border: 'border-cyan-500/20', text: 'text-cyan-400', bg: 'from-cyan-500/5', dot: 'bg-cyan-400' },
    red: { border: 'border-red-500/20', text: 'text-red-400', bg: 'from-red-500/5', dot: 'bg-red-400' },
    amber: { border: 'border-amber-500/20', text: 'text-amber-400', bg: 'from-amber-500/5', dot: 'bg-amber-400' },
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'from-emerald-500/5', dot: 'bg-emerald-400' },
    purple: { border: 'border-purple-500/20', text: 'text-purple-400', bg: 'from-purple-500/5', dot: 'bg-purple-400' },
    blue: { border: 'border-blue-500/20', text: 'text-blue-400', bg: 'from-blue-500/5', dot: 'bg-blue-400' },
  };
  const c = colorMap[color];
  return (
    <div id={id} className={cn("border rounded-lg bg-black/50 backdrop-blur-sm overflow-hidden", c.border, "shadow-lg")}>
      <div
        className={cn("flex items-center justify-between px-4 py-2.5 border-b shrink-0", c.border, `bg-gradient-to-r ${c.bg} to-transparent`, collapsible && "cursor-pointer select-none hover:bg-white/[0.02] transition-colors")}
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]", c.dot)} />
          <Icon className={cn("w-3.5 h-3.5", c.text)} />
          <span className={cn("text-[10px] font-mono font-bold uppercase tracking-[0.15em]", c.text)}>{title}</span>
        </div>
        {collapsible && (open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />)}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={collapsible ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} exit={collapsible ? { height: 0, opacity: 0 } : undefined} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataRow({ label, value, change, prefix = '', suffix = '' }: { label: string; value: string | number; change?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] transition-colors px-1 rounded">
      <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors truncate max-w-[60%]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-white/80 font-semibold">{prefix}{value}{suffix}</span>
        {change !== undefined && change !== null && !isNaN(change) && (
          <span className={cn("text-[9px] font-mono font-bold px-1 py-0.5 rounded", change > 0 ? "text-emerald-400 bg-emerald-400/10" : change < 0 ? "text-red-400 bg-red-400/10" : "text-white/20")}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

function BriefLine({ text }: { text: string }) {
  const isAlert = text.includes('⚠') || text.includes('🔴') || text.includes('PREDICTION') || text.includes('ALERT') || text.includes('FEAR') || text.includes('INVERTED');
  return (
    <div className={cn("text-[10px] font-mono leading-relaxed py-2 px-3 border-l-2 mb-1 rounded-r", isAlert ? "border-l-red-500/60 text-red-300/70 bg-red-500/5" : "border-l-cyan-400/30 text-cyan-100/60 bg-cyan-400/5")}>
      {text}
    </div>
  );
}

function MacroIndicator({ name, value, trend, change, signal }: { name: string; value: any; trend?: string; change?: any; signal?: string }) {
  const trendColor = trend === 'rising' ? 'text-red-400' : trend === 'falling' ? 'text-emerald-400' : 'text-white/30';
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
      <div className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-1">{name}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-mono font-bold text-white/90">{typeof value === 'number' ? value.toFixed(2) : value}</span>
        {trend && <span className={cn("text-[9px] font-mono font-bold uppercase", trendColor)}>{trend}</span>}
      </div>
      {change !== null && change !== undefined && <div className="text-[8px] font-mono text-white/20 mt-0.5">Δ {typeof change === 'number' ? change.toFixed(4) : change}</div>}
      {signal && <div className="text-[8px] font-mono text-cyan-400/50 mt-1 leading-relaxed">{signal}</div>}
    </div>
  );
}

/* ─── Market Ticker (from snapshot data) ─── */
function MarketTicker({ cryptoPrices, macro }: { cryptoPrices: Record<string, any>; macro: Record<string, any> }) {
  const items: { name: string; value: string; change: number }[] = [];

  // Add crypto
  Object.entries(cryptoPrices).forEach(([sym, data]) => {
    const d = safeObj(data);
    items.push({ name: sym, value: `$${parseFloat(d.price || 0).toLocaleString()}`, change: parseFloat(d.change_24h_pct || 0) });
  });

  // Add key macro
  const macroKeys = ['fed_funds_rate', 'inflation_cpi', 'unemployment_rate', 'treasury_10yr', 'treasury_2yr'];
  macroKeys.forEach(k => {
    const d = safeObj(macro[k]);
    if (d.value) items.push({ name: d.name || k, value: `${d.value}`, change: d.change || 0 });
  });

  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-cyan-500/10 bg-black/70 shrink-0">
      <div className="flex animate-[scroll_80s_linear_infinite] gap-8 py-2 px-4 whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[10px] font-mono">
            <span className="text-white/40">{item.name}</span>
            <span className="text-white/80 font-semibold">{item.value}</span>
            <span className={cn("font-bold", item.change > 0 ? "text-emerald-400" : item.change < 0 ? "text-red-400" : "text-white/20")}>
              {item.change > 0 ? '▲' : item.change < 0 ? '▼' : '–'}{Math.abs(item.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Risk Index from snapshot data ─── */
function RiskIndexBar({ fearGreed, macro, cryptoSignal }: { fearGreed: Record<string, any>; macro: Record<string, any>; cryptoSignal: string }) {
  const fgValue = fearGreed.value as number || 50;
  const yieldCurve = safeObj(macro.yield_curve);

  const items = [
    {
      label: 'Sentiment',
      icon: Activity,
      level: fgValue <= 25 ? 'EXTREME FEAR' : fgValue <= 45 ? 'FEAR' : fgValue <= 55 ? 'NEUTRAL' : fgValue <= 75 ? 'GREED' : 'EXTREME GREED',
      color: fgValue <= 25 ? 'text-red-400 bg-red-500/10 shadow-red-500/20' : fgValue <= 45 ? 'text-orange-400 bg-orange-500/10 shadow-orange-500/20' : fgValue <= 55 ? 'text-amber-400 bg-amber-500/10 shadow-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 shadow-emerald-500/20',
      value: `${fgValue}`,
    },
    {
      label: 'Yield Curve',
      icon: TrendingUp,
      level: yieldCurve.inverted ? 'INVERTED' : parseFloat(yieldCurve.spread || '1') < 0.5 ? 'FLAT' : 'NORMAL',
      color: yieldCurve.inverted ? 'text-red-400 bg-red-500/10 shadow-red-500/20' : parseFloat(yieldCurve.spread || '1') < 0.5 ? 'text-amber-400 bg-amber-500/10 shadow-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 shadow-emerald-500/20',
      value: `${yieldCurve.spread || '—'}`,
    },
    {
      label: 'Crypto',
      icon: Zap,
      level: cryptoSignal.includes('HIGH') ? 'RISK-OFF' : cryptoSignal.includes('LOW') ? 'RISK-ON' : 'MODERATE',
      color: cryptoSignal.includes('HIGH') ? 'text-amber-400 bg-amber-500/10 shadow-amber-500/20' : cryptoSignal.includes('LOW') ? 'text-emerald-400 bg-emerald-500/10 shadow-emerald-500/20' : 'text-blue-400 bg-blue-500/10 shadow-blue-500/20',
      value: '',
    },
    {
      label: 'Fed Rate',
      icon: DollarSign,
      level: `${safeObj(macro.fed_funds_rate).value || '—'}%`,
      color: 'text-purple-400 bg-purple-500/10 shadow-purple-500/20',
      value: safeObj(macro.fed_funds_rate).trend || '',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className={cn("flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 shadow-lg")}>
          <item.icon className={cn("w-4 h-4 shrink-0", item.color.split(' ')[0])} />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-0.5">{item.label}</div>
            <div className={cn("text-[11px] font-mono font-bold tracking-wider", item.color.split(' ')[0])}>{item.level}</div>
            {item.value && <div className="text-[8px] font-mono text-white/20">{item.value}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function WorldIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState('overview');
  const [selectedDossier, setSelectedDossier] = useState<{ id: string; name: string; news: any[]; economic_posture: string; trajectory: string } | null>(null);

  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ayn-pulse-engine', { method: 'GET' });
      if (error) throw error;
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setSnapshot(data as unknown as MarketSnapshot);
      }
    } catch (e) {
      console.error('Failed to fetch snapshot from edge function:', e);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const channel = supabase.channel('world-intel-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_snapshot' }, (payload) => setSnapshot(payload.new as unknown as MarketSnapshot))
      .subscribe();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(clockInterval); };
  }, [fetchData]);

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };
  const scrollTo = (id: string) => { setActiveCategory(id); document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  /* ─── Extract data from snapshot blob ─── */
  const snap = useMemo(() => safeObj(snapshot?.snapshot), [snapshot]);

  // Macro data (FRED)
  const macro = useMemo(() => safeObj(snap.macro), [snap]);

  // Market data
  const stocks = useMemo(() => safeObj(safeObj(snap.markets).stocks), [snap]);
  const topGainers = useMemo(() => safeArray(stocks.top_gainers), [stocks]);
  const topLosers = useMemo(() => safeArray(stocks.top_losers), [stocks]);
  const mostActive = useMemo(() => safeArray(stocks.most_active), [stocks]);
  const goldData = useMemo(() => safeObj(stocks.gold), [stocks]);

  // Crypto data
  const cryptoSection = useMemo(() => safeObj(safeObj(snap.markets).crypto), [snap]);
  const cryptoPrices = useMemo(() => safeObj(cryptoSection.crypto_prices), [cryptoSection]);
  const btcDominance = useMemo(() => cryptoSection.btc_dominance_proxy || '—', [cryptoSection]);
  const cryptoSignal = useMemo(() => (cryptoSection.crypto_signal || '') as string, [cryptoSection]);
  const marketBreadth = useMemo(() => safeObj(cryptoSection.market_breadth), [cryptoSection]);

  // Sentiment
  const fearGreed = useMemo(() => safeObj(safeObj(snap.markets).sentiment), [snap]);

  // Predictions
  const predictions = useMemo(() => safeArray(safeObj(snap.prediction_markets).prediction_markets), [snap]);

  // Geopolitical
  const geopolitical = useMemo(() => safeObj(snap.geopolitical), [snap]);

  // Institutional
  const institutional = useMemo(() => safeObj(snap.institutional_signals), [snap]);
  const institutionalNews = useMemo(() => safeArray(institutional.institutional_news), [institutional]);

  // Demographics
  const demographics = useMemo(() => safeObj(snap.demographics), [snap]);
  const demoInsights = useMemo(() => safeArray(demographics.insights), [demographics]);

  // Tourism
  const tourism = useMemo(() => safeObj(snap.tourism_market), [snap]);

  // Regional intel (S.I.C)
  const regionalIntel = useMemo(() => safeObj(snap.sic_intel || snap.regional_intel), [snap]);

  // AYN AI Predictions (1W, 1M, 1Y)
  const aynPredictions = useMemo(() => safeObj(snap.ayn_predictions), [snap]);

  // Intelligence brief
  const briefItems = useMemo(() => {
    const items = safeArray(snap.intelligence_brief);
    return items.length > 0 ? items : ["Waiting for intelligence data. Trigger ayn-pulse-engine to populate."];
  }, [snap]);

  // Sources used
  const sourcesUsed = useMemo(() => snapshot?.sources_used || [], [snapshot]);

  /* ─── Map Points ─── */
  const mapPoints: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];

    // Key geopolitical hotspots
    pts.push({ coordinates: [33.0, 48.0], label: "UKRAINE/RUSSIA", risk: "critical", category: "Conflict", detail: "Active conflict zone" });
    pts.push({ coordinates: [34.5, 31.5], label: "GAZA/ISRAEL", risk: "critical", category: "Conflict", detail: "Active conflict zone" });
    pts.push({ coordinates: [44.2, 15.4], label: "YEMEN", risk: "high", category: "Conflict", detail: "Houthi maritime disruption" });

    // Economic centers tracked by data
    if (Object.keys(cryptoPrices).length > 0) {
      pts.push({ coordinates: [-74.0, 40.7], label: "NYSE/WALL ST", risk: "stable", category: "Market", detail: `Fear & Greed: ${fearGreed.value || '—'}` });
    }
    if (Object.keys(macro).length > 0) {
      pts.push({ coordinates: [-77.0, 38.9], label: "FED/DC", risk: "alert", category: "Policy", detail: `Fed Rate: ${safeObj(macro.fed_funds_rate).value || '—'}%` });
    }

    // GCC focus (demographics/tourism data)
    if (Object.keys(demographics).length > 0) {
      pts.push({ coordinates: [46.7, 24.7], label: "RIYADH", risk: "stable", category: "Demographics", detail: `Saudi pop: ${safeObj(demographics.population)?.value ? (safeObj(demographics.population).value / 1e6).toFixed(1) + 'M' : 'N/A'}` });
      pts.push({ coordinates: [55.3, 25.2], label: "DUBAI/UAE", risk: "stable", category: "Market", detail: "GCC financial hub" });
    }

    // Predictions-derived
    predictions.forEach(p => {
      const q = (p.question || '').toLowerCase();
      if (q.includes('eu') || q.includes('europe')) pts.push({ coordinates: [4.35, 50.85], label: "EU", detail: `${p.question} (${p.yes_probability?.toFixed(1)}%)`, risk: "stable", category: "Prediction" });
    });

    // S.I.C Deep Intel Map Points
    Object.entries(regionalIntel).forEach(([code, data]) => {
      const coords = SIC_COORDINATES[code];
      if (coords) {
        pts.push({
          id: code,
          coordinates: coords,
          label: (data as any).name || code,
          risk: 'alert',
          category: 'S.I.C Intel',
          detail: 'CLICK TO DIVE: View deep AYN intelligence dossier'
        });
      }
    });

    // Supply chain choke points
    pts.push({ coordinates: [32.3, 30.0], label: "SUEZ CANAL", risk: "alert", category: "Supply Chain", detail: "Key shipping corridor" });
    pts.push({ coordinates: [101.0, 2.5], label: "MALACCA STRAIT", risk: "alert", category: "Supply Chain", detail: "Critical trade route" });

    return pts.filter((value, index, self) => index === self.findIndex((t) => Math.abs(t.coordinates[0] - value.coordinates[0]) < 3 && Math.abs(t.coordinates[1] - value.coordinates[1]) < 3));
  }, [cryptoPrices, macro, demographics, predictions, fearGreed, regionalIntel]);

  /* ─── Handlers ─── */
  const handleMapClick = (pt: MapPoint) => {
    if (pt.id && regionalIntel[pt.id]) {
      const intel = regionalIntel[pt.id] as any;
      setSelectedDossier({
        id: pt.id,
        name: intel.name || pt.label,
        news: safeArray(intel.news),
        economic_posture: intel.economic_posture || '',
        trajectory: intel.trajectory || ''
      });
    }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center font-mono">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative">
            <Globe2 className="w-10 h-10 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-ping" />
          </div>
          <p className="text-cyan-400 text-sm tracking-[0.25em] font-bold">AYN INTELLIGENCE</p>
          <p className="text-white/20 text-[10px] tracking-widest">AGGREGATING GLOBAL DATA FEEDS</p>
        </motion.div>
      </div>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-[#050508] text-white font-mono overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="shrink-0 border-b border-cyan-500/10 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,255,200,0.5)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-30" />
              </div>
              <span className="text-xs text-cyan-400 tracking-[0.18em] font-bold">AYN GLOBAL INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/30">
              <Clock className="w-3 h-3" />
              <span className="tabular-nums">{format(currentTime, 'HH:mm:ss')} UTC</span>
            </div>
            {snapshot?.fetched_at && <span className="hidden md:block text-[9px] text-white/20">Sweep: {timeAgo(snapshot.fetched_at)}</span>}
            {sourcesUsed.length > 0 && <span className="hidden lg:block text-[8px] text-white/15">{sourcesUsed.length} sources</span>}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-wider">LIVE</span>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white/50 hover:text-cyan-400 hover:bg-white/5 border border-white/10 transition-all">
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              <span>SWEEP</span>
            </button>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <MarketTicker cryptoPrices={cryptoPrices} macro={macro} />

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-14 bg-black/60 border-r border-white/5 shrink-0 py-3">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => scrollTo(cat.id)} title={cat.label}
              className={cn("flex flex-col items-center justify-center py-3 transition-all relative group", activeCategory === cat.id ? "text-cyan-400" : "text-white/25 hover:text-white/50")}
            >
              {activeCategory === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(0,255,200,0.5)]" />}
              <cat.icon className="w-4 h-4" />
              <span className="text-[7px] mt-1 tracking-wider uppercase">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1800px] mx-auto p-4 sm:p-5 space-y-5">

            {/* ═══ OVERVIEW ═══ */}
            <section id="section-overview" className="scroll-mt-4 space-y-5">
              <RiskIndexBar fearGreed={fearGreed} macro={macro} cryptoSignal={cryptoSignal} />

              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
                <HudPanel title="Global Threat Map (Click S.I.C regions for dossier)" icon={Globe2} color="cyan">
                  <HeatMap2D points={mapPoints} height={480} onPointClick={handleMapClick} />
                </HudPanel>
                <div className="flex flex-col gap-5">
                  <HudPanel title="Intelligence Brief" icon={Activity} color="emerald">
                    <div className="max-h-[260px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                      {briefItems.map((item, i) => <BriefLine key={i} text={typeof item === 'string' ? item : JSON.stringify(item)} />)}
                    </div>
                  </HudPanel>

                  {/* Fear & Greed Gauge */}
                  {fearGreed.value !== undefined && (
                    <HudPanel title="Fear & Greed Index" icon={Activity} color={fearGreed.value <= 45 ? 'red' : fearGreed.value <= 55 ? 'amber' : 'emerald'}>
                      <div className="text-center py-2">
                        <div className="text-4xl font-bold font-mono text-white/90 mb-1">{fearGreed.value}</div>
                        <div className={cn("text-sm font-mono font-bold uppercase tracking-wider", fearGreed.value <= 25 ? 'text-red-400' : fearGreed.value <= 45 ? 'text-orange-400' : fearGreed.value <= 55 ? 'text-amber-400' : fearGreed.value <= 75 ? 'text-emerald-400' : 'text-green-400')}>
                          {fearGreed.classification || ''}
                        </div>
                        {fearGreed.trend && <div className="text-[9px] text-white/30 mt-1">Trend: {fearGreed.trend} {fearGreed.previous_value ? `(prev: ${fearGreed.previous_value})` : ''}</div>}
                        {fearGreed.signal && <p className="text-[9px] font-mono text-white/40 mt-2 leading-relaxed max-w-sm mx-auto">{fearGreed.signal}</p>}
                        <div className="w-full h-2 bg-white/5 rounded-full mt-3 overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", fearGreed.value <= 25 ? 'bg-red-500' : fearGreed.value <= 45 ? 'bg-orange-500' : fearGreed.value <= 55 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${fearGreed.value}%` }} />
                        </div>
                        <div className="flex justify-between text-[7px] text-white/20 mt-1">
                          <span>EXTREME FEAR</span><span>NEUTRAL</span><span>EXTREME GREED</span>
                        </div>
                      </div>
                    </HudPanel>
                  )}
                </div>
              </div>
            </section>

            {/* ═══ MARKETS ═══ */}
            <section id="section-markets" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-mono text-blue-400 tracking-[0.15em] font-bold uppercase">Stock Markets</span>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HudPanel title="Top Gainers" icon={TrendingUp} color="emerald">
                  {topGainers.length > 0 ? topGainers.map((s, i) => (
                    <DataRow key={i} label={s.ticker || `#${i+1}`} value={`$${s.price || '—'}`} change={parseFloat(String(s.change_percent || '0').replace('%', '')) || undefined} />
                  )) : <p className="text-[10px] text-white/20 text-center py-4">No market data yet</p>}
                </HudPanel>

                <HudPanel title="Top Losers" icon={TrendingUp} color="red">
                  {topLosers.length > 0 ? topLosers.map((s, i) => (
                    <DataRow key={i} label={s.ticker || `#${i+1}`} value={`$${s.price || '—'}`} change={parseFloat(String(s.change_percent || '0').replace('%', '')) || undefined} />
                  )) : <p className="text-[10px] text-white/20 text-center py-4">No market data yet</p>}
                </HudPanel>

                <HudPanel title="Most Active" icon={BarChart3} color="blue">
                  {mostActive.length > 0 ? mostActive.map((s, i) => (
                    <DataRow key={i} label={s.ticker || `#${i+1}`} value={`$${s.price || '—'}`} change={parseFloat(String(s.change_percent || '0').replace('%', '')) || undefined} />
                  )) : <p className="text-[10px] text-white/20 text-center py-4">No market data yet</p>}
                </HudPanel>
              </div>

              {/* Gold */}
              {goldData.price && (
                <HudPanel title="Gold (Safe Haven Signal)" icon={Shield} color="amber" collapsible defaultOpen={true}>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[8px] text-white/30 uppercase">Price</div>
                      <div className="text-xl font-mono font-bold text-amber-400">${typeof goldData.price === 'number' ? goldData.price.toLocaleString() : goldData.price}</div>
                    </div>
                    {goldData.monthly_change_pct && <div>
                      <div className="text-[8px] text-white/30 uppercase">Monthly Change</div>
                      <div className={cn("text-lg font-mono font-bold", parseFloat(goldData.monthly_change_pct) > 0 ? 'text-emerald-400' : 'text-red-400')}>{goldData.monthly_change_pct}%</div>
                    </div>}
                    {goldData.signal && <div className="flex-1">
                      <div className="text-[8px] text-white/30 uppercase mb-1">Signal</div>
                      <div className="text-[10px] font-mono text-amber-300/60">{goldData.signal}</div>
                    </div>}
                  </div>
                </HudPanel>
              )}
            </section>

            {/* ═══ CRYPTO ═══ */}
            <section id="section-crypto" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono text-cyan-400 tracking-[0.15em] font-bold uppercase">Crypto Markets</span>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(cryptoPrices).map(([sym, data]) => {
                  const d = safeObj(data);
                  const change = parseFloat(d.change_24h_pct || '0');
                  return (
                    <div key={sym} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-cyan-500/20 transition-colors">
                      <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">{sym}</div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-xl font-mono font-bold text-white/90">${parseFloat(d.price || 0).toLocaleString()}</span>
                        <span className={cn("text-sm font-mono font-bold", change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-white/30')}>
                          {change > 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </div>
                      {d.volume_24h && <div className="text-[8px] text-white/20 mt-1">Vol: ${parseFloat(d.volume_24h).toLocaleString()}</div>}
                    </div>
                  );
                })}
              </div>

              {(cryptoSignal || marketBreadth.signal) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cryptoSignal && (
                    <HudPanel title="BTC Dominance" icon={Zap} color="cyan">
                      <div className="text-center py-2">
                        <div className="text-2xl font-mono font-bold text-cyan-400">{btcDominance}%</div>
                        <p className="text-[9px] font-mono text-white/40 mt-2 leading-relaxed">{cryptoSignal}</p>
                      </div>
                    </HudPanel>
                  )}
                  {marketBreadth.signal && (
                    <HudPanel title="Market Breadth" icon={BarChart3} color="blue">
                      <div className="space-y-2 py-2">
                        <DataRow label="Gainers (>3%)" value={marketBreadth.gainers_above_3pct || 0} />
                        <DataRow label="Losers (>3%)" value={marketBreadth.losers_above_3pct || 0} />
                        <div className={cn("text-[10px] font-mono font-bold text-center mt-2 py-1 rounded", marketBreadth.signal?.includes('BULL') ? 'text-emerald-400 bg-emerald-500/10' : marketBreadth.signal?.includes('BEAR') ? 'text-red-400 bg-red-500/10' : 'text-white/40 bg-white/5')}>
                          {marketBreadth.signal}
                        </div>
                      </div>
                    </HudPanel>
                  )}
                  {fearGreed.value !== undefined && (
                    <HudPanel title="Crypto Sentiment" icon={Activity} color={fearGreed.value <= 45 ? 'red' : 'emerald'}>
                      <div className="text-center py-2">
                        <div className="text-2xl font-mono font-bold text-white/90">{fearGreed.value}</div>
                        <div className="text-[10px] font-mono text-white/40 mt-1">{fearGreed.classification}</div>
                      </div>
                    </HudPanel>
                  )}
                </div>
              )}
            </section>

            {/* ═══ MACRO ═══ */}
            <section id="section-macro" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-mono text-purple-400 tracking-[0.15em] font-bold uppercase">Macro Economics (FRED)</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {['fed_funds_rate', 'inflation_cpi', 'unemployment_rate', 'treasury_10yr', 'treasury_2yr', 'usd_eur', 'm2_money_supply'].map(key => {
                  const d = safeObj(macro[key]);
                  if (!d.value) return null;
                  return <MacroIndicator key={key} name={d.name || key} value={d.value} trend={d.trend} change={d.change} />;
                })}
                {/* Yield Curve */}
                {safeObj(macro.yield_curve).spread && (
                  <div className={cn("bg-white/[0.02] border rounded-lg p-3", safeObj(macro.yield_curve).inverted ? 'border-red-500/20' : 'border-white/5')}>
                    <div className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-1">Yield Curve</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-mono font-bold text-white/90">{safeObj(macro.yield_curve).spread}%</span>
                      <span className={cn("text-[9px] font-mono font-bold uppercase", safeObj(macro.yield_curve).inverted ? 'text-red-400' : 'text-emerald-400')}>
                        {safeObj(macro.yield_curve).inverted ? 'INVERTED' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="text-[8px] font-mono text-cyan-400/50 mt-1 leading-relaxed">{safeObj(macro.yield_curve).signal}</div>
                  </div>
                )}
              </div>
            </section>

            {/* ═══ DEMOGRAPHICS ═══ */}
            <section id="section-demographics" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-400 tracking-[0.15em] font-bold uppercase">Demographics & Population</span>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
              </div>

              {demoInsights.length > 0 ? (
                <HudPanel title="Saudi Arabia Demographics" icon={Users} color="emerald" collapsible defaultOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      {demoInsights.map((insight, i) => (
                        <BriefLine key={i} text={typeof insight === 'string' ? insight : JSON.stringify(insight)} />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {['population', 'youth_pct', 'working_age_pct', 'female_pct', 'urban_pct', 'gni_per_capita', 'pop_growth'].map(key => {
                        const d = safeObj(demographics[key]);
                        if (!d.value) return null;
                        return <DataRow key={key} label={d.name || key} value={typeof d.value === 'number' && d.value > 100000 ? (d.value / 1e6).toFixed(1) + 'M' : d.value} suffix={key.includes('pct') || key === 'pop_growth' ? '%' : key === 'gni_per_capita' ? '' : ''} prefix={key === 'gni_per_capita' ? '$' : ''} />;
                      })}
                    </div>
                  </div>
                </HudPanel>
              ) : <p className="text-[10px] text-white/20 text-center py-4">No demographics data — trigger ayn-pulse-engine</p>}

              {/* GCC Populations */}
              {Object.keys(safeObj(demographics.gcc_populations)).length > 0 && (
                <HudPanel title="GCC Population Overview" icon={Globe2} color="blue" collapsible defaultOpen={true}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(safeObj(demographics.gcc_populations)).map(([code, data]) => {
                      const d = safeObj(data as any);
                      return (
                        <div key={code} className="bg-white/[0.02] border border-white/5 rounded p-3">
                          <div className="text-[8px] text-white/30 uppercase">{d.name || code}</div>
                          <div className="text-sm font-mono font-bold text-white/80">{d.population}</div>
                        </div>
                      );
                    })}
                  </div>
                </HudPanel>
              )}
            </section>

            {/* ═══ TOURISM ═══ */}
            <section id="section-tourism" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Plane className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono text-amber-400 tracking-[0.15em] font-bold uppercase">Tourism & Regional Intel</span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.keys(tourism).length > 0 && (
                  <HudPanel title="Saudi Tourism Data" icon={Plane} color="amber" collapsible defaultOpen={true}>
                    <div className="space-y-2">
                      {['international_arrivals', 'tourism_receipts', 'tourism_expenditure'].map(key => {
                        const d = safeObj(tourism[key]);
                        if (!d.latest) return null;
                        const val = safeObj(d.latest).value;
                        return (
                          <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/5">
                            <span className="text-[10px] font-mono text-white/40">{d.name || key}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-white/80 font-semibold">
                                {val > 1e9 ? `$${(val / 1e9).toFixed(1)}B` : val > 1e6 ? `${(val / 1e6).toFixed(1)}M` : val?.toLocaleString() || '—'}
                              </span>
                              {d.trend && <span className={cn("text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", d.trend === 'growing' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>{d.trend}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </HudPanel>
                )}

                {institutionalNews.length > 0 && (
                  <HudPanel title="Institutional Signals" icon={Newspaper} color="blue" collapsible defaultOpen={true}>
                    <div className="space-y-2">
                      {institutionalNews.map((item, i) => (
                        <div key={i} className="py-2 border-b border-white/5 last:border-0">
                          <div className="text-[10px] font-mono text-white/60 leading-relaxed">{item.title}</div>
                          {item.description && <p className="text-[9px] text-white/30 mt-1">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  </HudPanel>
                )}
              </div>

              {/* Legacy Regional Intel mapping (removed in favor of map click-to-dive) */}
            </section>

            {/* ═══ PREDICTIONS ═══ */}
            <section id="section-predictions" className="scroll-mt-4 space-y-5 pb-8">
              <div className="flex items-center gap-2 pt-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-mono text-purple-400 tracking-[0.15em] font-bold uppercase">Predictive Intelligence</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
              </div>

              {Object.keys(aynPredictions).length > 0 && (
                <HudPanel title="AYN AI PREDICTIONS (Global Macro Trajectory)" icon={Cpu} color="cyan">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(aynPredictions).map(([timeframe, prediction]) => (
                      <div key={timeframe} className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <Clock className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest">AYN FORECAST</div>
                            <div className="text-xl font-bold font-mono text-white shadow-black drop-shadow-md">{timeframe}</div>
                          </div>
                        </div>
                        <p className="text-[11px] leading-relaxed text-cyan-100/80 font-mono pr-2">
                          {prediction as string}
                        </p>
                      </div>
                    ))}
                  </div>
                </HudPanel>
              )}

              <HudPanel title="Polymarket Probabilities" icon={Target} color="purple">
                {predictions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                    {predictions.map((p, i) => {
                      const prob = p.yes_probability || 0;
                      const barColor = prob > 70 ? 'bg-emerald-500' : prob > 40 ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <div key={i} className="py-2.5 border-b border-white/5 last:border-0">
                          <div className="flex justify-between items-start gap-3 mb-1.5">
                            <span className="text-[10px] font-mono text-white/60 leading-relaxed">{p.question}</span>
                            <span className="text-[12px] font-mono font-bold text-purple-400 shrink-0">{prob.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(prob, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-[10px] text-white/30 text-center py-6">No prediction data — trigger ayn-pulse-engine</p>}
              </HudPanel>
            </section>

            {/* Source attribution */}
            {sourcesUsed.length > 0 && (
              <div className="text-center pb-6">
                <div className="text-[8px] font-mono text-white/15 uppercase tracking-wider">
                  Data Sources: {sourcesUsed.join(' · ')}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ═══ DEEP DIVE DOSSIER OVERLAY ═══ */}
      <AnimatePresence>
        {selectedDossier && (
          <motion.div 
            initial={{ opacity: 0, x: 400 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-black/95 backdrop-blur-2xl border-l border-cyan-500/30 z-[100] shadow-[0_0_80px_rgba(0,255,200,0.15)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 shrink-0 bg-gradient-to-b from-cyan-900/20 to-transparent flex justify-between items-start">
              <div>
                <div className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> S.I.C. INTELLIGENCE DOSSIER
                </div>
                <h2 className="text-3xl font-mono font-bold text-white tracking-tight">{selectedDossier.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedDossier(null)} 
                className="p-2 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center font-mono text-xl leading-none">&times;</div>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth scrollbar-thin">
              
              {/* Economic Posture */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold text-emerald-400 tracking-widest uppercase">Economic Posture</h3>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg">
                  <p className="text-[11px] font-mono leading-relaxed text-emerald-100/80 break-words">{selectedDossier.economic_posture}</p>
                </div>
              </div>

              {/* Trajectory */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-mono font-bold text-purple-400 tracking-widest uppercase">Forward Trajectory</h3>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-lg">
                  <p className="text-[11px] font-mono leading-relaxed text-purple-100/80 break-words">{selectedDossier.trajectory}</p>
                </div>
              </div>

              {/* Breaking News */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-mono font-bold text-cyan-400 tracking-widest uppercase">Live Intelligence Feed</h3>
                </div>
                <div className="space-y-3">
                  {selectedDossier.news.length > 0 ? selectedDossier.news.map((item, idx) => (
                    <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-black/40 border border-white/5 hover:border-cyan-500/30 p-4 rounded-lg group transition-colors">
                      <h4 className="text-[12px] font-bold text-white/90 group-hover:text-cyan-400 transition-colors leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-[10px] text-white/40 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                    </a>
                  )) : (
                    <p className="text-[11px] text-white/30 font-mono italic">No recent intel gathered.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>
    </div>
  );
}
