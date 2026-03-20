import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, RefreshCw, Clock, AlertTriangle, TrendingUp, Shield, Zap, Ship, Cpu,
  Globe2, BarChart3, Flame, Radio, Activity, ChevronDown, ChevronUp, Target,
  DollarSign, Newspaper, Eye, Crosshair, ChevronRight, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { HeatMap2D, MapPoint } from '@/components/dashboard/HeatMap2D';

/* ─── Interfaces ─── */
interface MarketSnapshot { snapshot: Json; fetched_at: string; sources_used: string[] | null; fetch_errors: string[] | null; }
interface GeopoliticalData { active_conflicts: Json; trade_tensions: Json; risk_by_region: Json; intelligence_brief: Json; }
interface SupplyChainData { bottlenecks: Json; risk_alerts: Json; intelligence_brief: Json; }
interface BusinessNews { headlines: Json; sentiment: string | null; summary: string | null; sector: string | null; fetched_at: string | null; }
interface MarketPrices { indices: Json; energy: Json; metals: Json; crypto: Json; currencies: Json; narrative: Json; }
interface TechDisruption { ai_developments: Json; emerging_tech: Json; intelligence_brief: Json; }

/* ─── Helpers ─── */
function safeArray(val: Json | null | undefined): any[] { if (Array.isArray(val)) return val; return []; }
function safeObj(val: Json | null | undefined): Record<string, any> { if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, any>; return {}; }
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
  { id: 'geopolitics', label: 'Geopolitics', icon: AlertTriangle },
  { id: 'supply', label: 'Supply Chain', icon: Ship },
  { id: 'tech', label: 'Tech & AI', icon: Cpu },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'predictions', label: 'Predictions', icon: Target },
] as const;

/* ─── Reusable UI Blocks ─── */
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

function MarketTicker({ indices, energy, metals, crypto, currencies }: { indices: any[]; energy: any[]; metals: any[]; crypto: any[]; currencies: any[] }) {
  const items = [...indices, ...energy, ...metals, ...crypto, ...currencies].slice(0, 20);
  if (items.length === 0) return null;
  return (
    <div className="relative overflow-hidden border-b border-cyan-500/10 bg-black/70 shrink-0">
      <div className="flex animate-[scroll_80s_linear_infinite] gap-8 py-2 px-4 whitespace-nowrap">
        {[...items, ...items].map((item: any, i) => {
          const v = safeObj(item);
          const change = parseFloat(v.change_pct || v.change || '0') || 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 text-[10px] font-mono">
              <span className="text-white/40">{v.name || v.symbol || v.commodity || v.metal || v.pair}</span>
              <span className="text-white/80 font-semibold">{v.price || v.value || v.rate || '—'}</span>
              <span className={cn("font-bold", change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-white/20")}>
                {change > 0 ? '▲' : change < 0 ? '▼' : '–'}{Math.abs(change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DataRow({ label, value, change, prefix = '' }: { label: string; value: string | number; change?: number; prefix?: string; }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] transition-colors px-1 rounded">
      <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors truncate max-w-[60%]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-white/80 font-semibold">{prefix}{value}</span>
        {change !== undefined && (
          <span className={cn("text-[9px] font-mono font-bold px-1 py-0.5 rounded", change > 0 ? "text-emerald-400 bg-emerald-400/10" : change < 0 ? "text-red-400 bg-red-400/10" : "text-white/20")}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

function AlertRow({ text, severity = 'medium' }: { text: string; severity?: string }) {
  const isHigh = severity === 'high' || severity === 'critical';
  return (
    <div className={cn("flex items-start gap-2.5 py-2 px-2 border-b border-white/5 last:border-0 rounded transition-colors", isHigh ? "hover:bg-red-500/5" : "hover:bg-amber-500/5")}>
      <div className="relative mt-1.5 shrink-0">
        <div className={cn("w-1.5 h-1.5 rounded-full", isHigh ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]")} />
        {isHigh && <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
      </div>
      <p className="text-[10px] font-mono text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function BriefLine({ text }: { text: string }) {
  const isAlert = text.includes('⚠') || text.includes('🔴') || text.includes('PREDICTION') || text.includes('ALERT');
  return (
    <div className={cn("text-[10px] font-mono leading-relaxed py-2 px-3 border-l-2 mb-1 rounded-r", isAlert ? "border-l-red-500/60 text-red-300/70 bg-red-500/5" : "border-l-cyan-400/30 text-cyan-100/60 bg-cyan-400/5")}>
      {text}
    </div>
  );
}

/* ─── Risk Index Bar ─── */
function RiskIndexBar({ geopolitical, prices, supplyChain, tech, snapshot }: {
  geopolitical: GeopoliticalData | null; prices: MarketPrices | null;
  supplyChain: SupplyChainData | null; tech: TechDisruption | null; snapshot: MarketSnapshot | null;
}) {
  const calcRisk = (count: number, thresholds: [number, number, number]) => {
    if (count >= thresholds[2]) return { level: 'CRITICAL', color: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/20' };
    if (count >= thresholds[1]) return { level: 'HIGH', color: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
    if (count >= thresholds[0]) return { level: 'MEDIUM', color: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/20' };
    return { level: 'LOW', color: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
  };

  const geoRisk = calcRisk(safeArray(geopolitical?.active_conflicts).length + safeArray(geopolitical?.trade_tensions).length, [2, 4, 6]);
  const scRisk = calcRisk(safeArray(supplyChain?.risk_alerts).length + safeArray(supplyChain?.bottlenecks).length, [2, 4, 6]);
  const techRisk = calcRisk(safeArray(tech?.ai_developments).length + safeArray(tech?.emerging_tech).length, [3, 5, 8]);

  // Market risk from average absolute change
  const allPrices = [...safeArray(prices?.indices), ...safeArray(prices?.energy), ...safeArray(prices?.crypto)];
  const avgChange = allPrices.length > 0 ? allPrices.reduce((sum, p) => sum + Math.abs(parseFloat(safeObj(p).change_pct || '0') || 0), 0) / allPrices.length : 0;
  const marketRisk = calcRisk(avgChange, [1, 2.5, 5]);

  const items = [
    { label: 'Geopolitical', icon: AlertTriangle, ...geoRisk },
    { label: 'Market', icon: TrendingUp, ...marketRisk },
    { label: 'Supply Chain', icon: Ship, ...scRisk },
    { label: 'Tech Disruption', icon: Cpu, ...techRisk },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className={cn("flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 shadow-lg", item.glow)}>
          <item.icon className={cn("w-4 h-4 shrink-0", item.text)} />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-0.5">{item.label}</div>
            <div className={cn("text-[11px] font-mono font-bold tracking-wider", item.text)}>{item.level}</div>
          </div>
          <div className={cn("w-2 h-2 rounded-full", item.color, "shadow-[0_0_8px_currentColor]")} />
        </div>
      ))}
    </div>
  );
}

/* ─── Sentiment Badge ─── */
function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;
  const s = sentiment.toLowerCase();
  const config = s.includes('bull') || s.includes('positive') ? { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Bullish' }
    : s.includes('bear') || s.includes('negative') ? { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'Bearish' }
    : { bg: 'bg-white/5', text: 'text-white/40', border: 'border-white/10', label: 'Neutral' };
  return <span className={cn("text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", config.bg, config.text, config.border)}>{config.label}</span>;
}

/* ─── Main Component ─── */
export default function WorldIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [geopolitical, setGeopolitical] = useState<GeopoliticalData | null>(null);
  const [supplyChain, setSupplyChain] = useState<SupplyChainData | null>(null);
  const [news, setNews] = useState<BusinessNews[]>([]);
  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [tech, setTech] = useState<TechDisruption | null>(null);

  const fetchAllData = useCallback(async () => {
    const [snapRes, geoRes, scRes, newsRes, pricesRes, techRes] = await Promise.all([
      supabase.from('ayn_market_snapshot').select('*').eq('singleton_key', 1).maybeSingle(),
      supabase.from('ayn_geopolitical').select('*').eq('singleton_key', 1).maybeSingle(),
      supabase.from('ayn_supply_chain').select('*').eq('singleton_key', 1).maybeSingle(),
      supabase.from('ayn_business_news').select('*').order('fetched_at', { ascending: false }).limit(5),
      supabase.from('ayn_market_prices').select('*').eq('singleton_key', 1).maybeSingle(),
      supabase.from('ayn_tech_disruption').select('*').eq('singleton_key', 1).maybeSingle(),
    ]);
    if (snapRes.data) setSnapshot(snapRes.data as unknown as MarketSnapshot);
    if (geoRes.data) setGeopolitical(geoRes.data as unknown as GeopoliticalData);
    if (scRes.data) setSupplyChain(scRes.data as unknown as SupplyChainData);
    if (newsRes.data) setNews(newsRes.data as unknown as BusinessNews[]);
    if (pricesRes.data) setPrices(pricesRes.data as unknown as MarketPrices);
    if (techRes.data) setTech(techRes.data as unknown as TechDisruption);
  }, []);

  useEffect(() => {
    fetchAllData().finally(() => setLoading(false));
    const channel = supabase.channel('world-intel-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_snapshot' }, (payload) => setSnapshot(payload.new as unknown as MarketSnapshot))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_geopolitical' }, (payload) => setGeopolitical(payload.new as unknown as GeopoliticalData))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_prices' }, (payload) => setPrices(payload.new as unknown as MarketPrices))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_supply_chain' }, (payload) => setSupplyChain(payload.new as unknown as SupplyChainData))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_tech_disruption' }, (payload) => setTech(payload.new as unknown as TechDisruption))
      .subscribe();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(clockInterval); };
  }, [fetchAllData]);

  const handleRefresh = async () => { setRefreshing(true); await fetchAllData(); setRefreshing(false); };

  const scrollTo = (id: string) => {
    setActiveCategory(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Data derivations
  const briefItems = useMemo(() => {
    const items: string[] = [];
    if (snapshot?.snapshot) {
      const b = safeArray(safeObj(snapshot.snapshot).intelligence_brief);
      if (b.length) items.push(...b);
    }
    if (geopolitical?.intelligence_brief) items.push(...safeArray(geopolitical.intelligence_brief).slice(0, 3));
    if (supplyChain?.intelligence_brief) items.push(...safeArray(supplyChain.intelligence_brief).slice(0, 2));
    if (tech?.intelligence_brief) items.push(...safeArray(tech.intelligence_brief).slice(0, 2));
    return items.length > 0 ? items : ["Intelligence arrays idle. Standing by."];
  }, [snapshot, geopolitical, supplyChain, tech]);

  const indices = useMemo(() => safeArray(prices?.indices), [prices]);
  const energy = useMemo(() => safeArray(prices?.energy), [prices]);
  const metals = useMemo(() => safeArray(prices?.metals), [prices]);
  const crypto = useMemo(() => safeArray(prices?.crypto), [prices]);
  const currencies = useMemo(() => safeArray(prices?.currencies), [prices]);
  const narrative = useMemo(() => safeObj(prices?.narrative), [prices]);

  const conflicts = useMemo(() => safeArray(geopolitical?.active_conflicts), [geopolitical]);
  const tensions = useMemo(() => safeArray(geopolitical?.trade_tensions), [geopolitical]);
  const riskByRegion = useMemo(() => safeObj(geopolitical?.risk_by_region), [geopolitical]);

  const scBottlenecks = useMemo(() => safeArray(supplyChain?.bottlenecks), [supplyChain]);
  const scAlerts = useMemo(() => safeArray(supplyChain?.risk_alerts), [supplyChain]);

  const aiDev = useMemo(() => safeArray(tech?.ai_developments), [tech]);
  const emergingTech = useMemo(() => safeArray(tech?.emerging_tech), [tech]);

  const predictions = useMemo(() => {
    if (!snapshot?.snapshot) return [];
    return safeArray(safeObj(safeObj(snapshot.snapshot).prediction_markets).prediction_markets);
  }, [snapshot]);

  // Build map points from ALL data sources
  const mapPoints: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];

    // Conflicts
    conflicts.forEach(c => {
      const obj = safeObj(c);
      const name = (obj.name || obj.title || obj.description || '').toLowerCase();
      if (name.includes('ukraine') || name.includes('russia')) pts.push({ coordinates: [33.0, 48.0], label: "UKRAINE/RUSSIA", risk: "critical", category: "Conflict", detail: obj.description || name });
      else if (name.includes('gaza') || name.includes('israel') || name.includes('palestine')) pts.push({ coordinates: [34.5, 31.5], label: "GAZA", risk: "critical", category: "Conflict", detail: obj.description || name });
      else if (name.includes('yemen') || name.includes('houthi')) pts.push({ coordinates: [44.2, 15.4], label: "YEMEN", risk: "high", category: "Conflict", detail: obj.description || name });
      else if (name.includes('sudan')) pts.push({ coordinates: [32.5, 15.6], label: "SUDAN", risk: "high", category: "Conflict", detail: obj.description || name });
      else if (name.includes('taiwan') || name.includes('china')) pts.push({ coordinates: [120.0, 24.0], label: "TAIWAN STRAIT", risk: "alert", category: "Military", detail: obj.description || name });
      else if (name.includes('syria')) pts.push({ coordinates: [38.0, 35.0], label: "SYRIA", risk: "high", category: "Conflict", detail: obj.description || name });
    });

    // Supply chain bottlenecks
    scBottlenecks.forEach(b => {
      const obj = safeObj(b);
      const loc = (obj.location || obj.description || '').toLowerCase();
      if (loc.includes('suez')) pts.push({ coordinates: [32.3, 30.0], label: "SUEZ CANAL", risk: "alert", category: "Supply Chain", detail: obj.description || loc });
      else if (loc.includes('panama')) pts.push({ coordinates: [-79.5, 9.0], label: "PANAMA CANAL", risk: "alert", category: "Supply Chain", detail: obj.description || loc });
      else if (loc.includes('strait') || loc.includes('malacca')) pts.push({ coordinates: [101.0, 2.5], label: "MALACCA", risk: "alert", category: "Supply Chain", detail: obj.description || loc });
      else if (loc.includes('shanghai') || loc.includes('china')) pts.push({ coordinates: [121.5, 31.2], label: "SHANGHAI PORT", risk: "stable", category: "Supply Chain", detail: obj.description || loc });
    });

    // Market centers
    if (indices.length > 0) {
      pts.push({ coordinates: [-74.0, 40.7], label: "NYSE", risk: "stable", category: "Market", detail: `${indices.length} indices tracked` });
      pts.push({ coordinates: [-0.1, 51.5], label: "LSE", risk: "stable", category: "Market", detail: "London Stock Exchange" });
      pts.push({ coordinates: [139.7, 35.7], label: "TSE", risk: "stable", category: "Market", detail: "Tokyo Stock Exchange" });
    }

    // Predictions
    predictions.forEach(p => {
      const q = (p.question || '').toLowerCase();
      if (q.includes('fed ') || q.includes('us ') || q.includes('election')) pts.push({ coordinates: [-77.0, 38.9], label: "US MACRO", detail: `${p.question} (${p.yes_probability?.toFixed(1)}%)`, risk: "alert", category: "Prediction" });
      if (q.includes('eu ') || q.includes('europe')) pts.push({ coordinates: [4.35, 50.85], label: "EU", detail: `${p.question} (${p.yes_probability?.toFixed(1)}%)`, risk: "stable", category: "Prediction" });
    });

    // Always show key monitoring points
    if (pts.length < 3) {
      pts.push({ coordinates: [35.0, 31.0], label: "MIDDLE EAST", detail: "Standing geopolitical heat monitor.", risk: "high", category: "Monitor" });
      pts.push({ coordinates: [120.0, 24.0], label: "TAIWAN STRAIT", detail: "Ongoing maritime surveillance.", risk: "alert", category: "Monitor" });
      pts.push({ coordinates: [33.0, 48.0], label: "E. EUROPE", detail: "Active conflict zone.", risk: "critical", category: "Monitor" });
    }

    // Deduplicate by approximate coordinates
    return pts.filter((value, index, self) => index === self.findIndex((t) => Math.abs(t.coordinates[0] - value.coordinates[0]) < 2 && Math.abs(t.coordinates[1] - value.coordinates[1]) < 2));
  }, [conflicts, predictions, scBottlenecks, indices]);

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
      {/* ─── HEADER ─── */}
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
            {snapshot?.fetched_at && (
              <span className="hidden md:block text-[9px] text-white/20">Last sweep: {timeAgo(snapshot.fetched_at)}</span>
            )}
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

      {/* ─── MARKET TICKER ─── */}
      <MarketTicker indices={indices} energy={energy} metals={metals} crypto={crypto} currencies={currencies} />

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-14 bg-black/60 border-r border-white/5 shrink-0 py-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollTo(cat.id)}
              title={cat.label}
              className={cn(
                "flex flex-col items-center justify-center py-3 transition-all relative group",
                activeCategory === cat.id ? "text-cyan-400" : "text-white/25 hover:text-white/50"
              )}
            >
              {activeCategory === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(0,255,200,0.5)]" />}
              <cat.icon className="w-4 h-4" />
              <span className="text-[7px] mt-1 tracking-wider uppercase">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        {/* ─── CONTENT ─── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1800px] mx-auto p-4 sm:p-5 space-y-5">

            {/* ─── SECTION: OVERVIEW ─── */}
            <section id="section-overview" className="scroll-mt-4 space-y-5">
              {/* Risk Index Bar */}
              <RiskIndexBar geopolitical={geopolitical} prices={prices} supplyChain={supplyChain} tech={tech} snapshot={snapshot} />

              {/* Map + Brief row */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
                <HudPanel title="Global Threat Map" icon={Globe2} color="cyan">
                  <HeatMap2D points={mapPoints} height={480} />
                </HudPanel>

                <div className="flex flex-col gap-5">
                  <HudPanel title="Intelligence Brief" icon={Activity} color="emerald">
                    <div className="max-h-[220px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                      {briefItems.map((item, i) => {
                        const text = typeof item === 'string' ? item : JSON.stringify(item);
                        return <BriefLine key={i} text={text} />;
                      })}
                    </div>
                  </HudPanel>

                  {/* Region Risk */}
                  {Object.keys(riskByRegion).length > 0 && (
                    <HudPanel title="Risk by Region" icon={Layers} color="red" collapsible defaultOpen={true}>
                      <div className="space-y-1">
                        {Object.entries(riskByRegion).slice(0, 8).map(([region, data]) => {
                          const obj = safeObj(data as Json);
                          const level = (obj.level || obj.risk || '').toString().toLowerCase();
                          const colorClass = level.includes('critical') || level.includes('extreme') ? 'text-red-400 bg-red-500/10' : level.includes('high') ? 'text-orange-400 bg-orange-500/10' : level.includes('medium') || level.includes('moderate') ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10';
                          return (
                            <div key={region} className="flex items-center justify-between py-1.5 px-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] rounded transition-colors">
                              <span className="text-[10px] font-mono text-white/50">{region}</span>
                              <span className={cn("text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full", colorClass)}>{level || 'N/A'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </HudPanel>
                  )}
                </div>
              </div>
            </section>

            {/* ─── SECTION: MARKETS ─── */}
            <section id="section-markets" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-mono text-blue-400 tracking-[0.15em] font-bold uppercase">Markets & Finance</span>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
              </div>

              {/* Market Narrative */}
              {(narrative.summary || narrative.outlook) && (
                <HudPanel title="Market Narrative" icon={TrendingUp} color="blue" collapsible defaultOpen={true}>
                  <div className="space-y-2">
                    {narrative.summary && <p className="text-[11px] font-mono text-white/60 leading-relaxed">{String(narrative.summary)}</p>}
                    {narrative.outlook && <p className="text-[10px] font-mono text-blue-300/50 leading-relaxed border-l-2 border-blue-400/20 pl-3">{String(narrative.outlook)}</p>}
                    {narrative.key_drivers && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {safeArray(narrative.key_drivers).map((d: any, i: number) => (
                          <span key={i} className="text-[8px] font-mono text-white/40 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">{typeof d === 'string' ? d : String(safeObj(d).driver || d)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </HudPanel>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <HudPanel title="Indices" icon={BarChart3} color="blue">
                  {indices.length > 0 ? indices.slice(0, 6).map((item, i) => {
                    const obj = safeObj(item);
                    return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)} value={String(obj.price || obj.value || obj.level || '—')} change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
                  }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
                </HudPanel>

                <HudPanel title="Energy" icon={Flame} color="amber">
                  {energy.length > 0 ? energy.slice(0, 6).map((item, i) => {
                    const obj = safeObj(item);
                    return <DataRow key={i} label={String(obj.name || obj.commodity || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
                  }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
                </HudPanel>

                <HudPanel title="Metals" icon={Shield} color="emerald">
                  {metals.length > 0 ? metals.slice(0, 6).map((item, i) => {
                    const obj = safeObj(item);
                    return <DataRow key={i} label={String(obj.name || obj.metal || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
                  }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
                </HudPanel>

                <HudPanel title="Crypto" icon={Zap} color="cyan">
                  {crypto.length > 0 ? crypto.slice(0, 6).map((item, i) => {
                    const obj = safeObj(item);
                    return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
                  }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
                </HudPanel>

                <HudPanel title="Currencies" icon={DollarSign} color="purple">
                  {currencies.length > 0 ? currencies.slice(0, 6).map((item, i) => {
                    const obj = safeObj(item);
                    return <DataRow key={i} label={String(obj.name || obj.pair || obj.symbol || `#${i + 1}`)} value={String(obj.rate || obj.price || obj.value || '—')} change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
                  }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
                </HudPanel>
              </div>
            </section>

            {/* ─── SECTION: GEOPOLITICS ─── */}
            <section id="section-geopolitics" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-[11px] font-mono text-red-400 tracking-[0.15em] font-bold uppercase">Geopolitical Intelligence</span>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <HudPanel title="Active Conflicts" icon={Crosshair} color="red" collapsible defaultOpen={true}>
                  {conflicts.length > 0 ? conflicts.map((c, i) => {
                    const obj = safeObj(c);
                    const text = typeof c === 'string' ? c : String(obj.description || obj.name || obj.title || JSON.stringify(c));
                    return <AlertRow key={i} text={text} severity="high" />;
                  }) : <p className="text-[10px] text-white/20 text-center py-6">No active conflicts reported</p>}
                </HudPanel>

                <HudPanel title="Trade Tensions" icon={TrendingUp} color="amber" collapsible defaultOpen={true}>
                  {tensions.length > 0 ? tensions.map((t, i) => {
                    const obj = safeObj(t);
                    const text = typeof t === 'string' ? t : String(obj.description || obj.summary || JSON.stringify(t));
                    return <AlertRow key={i} text={text} severity="medium" />;
                  }) : <p className="text-[10px] text-white/20 text-center py-6">No trade tensions reported</p>}
                </HudPanel>
              </div>
            </section>

            {/* ─── SECTION: SUPPLY CHAIN ─── */}
            <section id="section-supply" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Ship className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono text-amber-400 tracking-[0.15em] font-bold uppercase">Supply Chain Monitor</span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <HudPanel title="Risk Alerts" icon={AlertTriangle} color="red" collapsible defaultOpen={true}>
                  {scAlerts.length > 0 ? scAlerts.map((a, i) => <AlertRow key={i} text={typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).alert || JSON.stringify(a))} severity="high" />) : <p className="text-[10px] text-white/20 text-center py-6">No supply chain alerts</p>}
                </HudPanel>

                <HudPanel title="Bottlenecks" icon={Ship} color="amber" collapsible defaultOpen={true}>
                  {scBottlenecks.length > 0 ? scBottlenecks.map((b, i) => <AlertRow key={i} text={typeof b === 'string' ? b : String(safeObj(b).description || safeObj(b).location || JSON.stringify(b))} />) : <p className="text-[10px] text-white/20 text-center py-6">No bottlenecks detected</p>}
                </HudPanel>
              </div>
            </section>

            {/* ─── SECTION: TECH ─── */}
            <section id="section-tech" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono text-cyan-400 tracking-[0.15em] font-bold uppercase">Tech & AI Disruption</span>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <HudPanel title="AI Developments" icon={Cpu} color="cyan" collapsible defaultOpen={true}>
                  {aiDev.length > 0 ? aiDev.map((a, i) => <AlertRow key={i} text={typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).title || JSON.stringify(a))} />) : <p className="text-[10px] text-white/20 text-center py-6">No AI developments</p>}
                </HudPanel>

                <HudPanel title="Emerging Tech" icon={Zap} color="blue" collapsible defaultOpen={true}>
                  {emergingTech.length > 0 ? emergingTech.map((t, i) => <AlertRow key={i} text={typeof t === 'string' ? t : String(safeObj(t).description || safeObj(t).name || JSON.stringify(t))} />) : <p className="text-[10px] text-white/20 text-center py-6">No emerging tech signals</p>}
                </HudPanel>
              </div>
            </section>

            {/* ─── SECTION: NEWS ─── */}
            <section id="section-news" className="scroll-mt-4 space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <Newspaper className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-mono text-blue-400 tracking-[0.15em] font-bold uppercase">Business News Feed</span>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {news.length > 0 ? news.map((item, i) => {
                  const headlines = safeArray(item.headlines);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-black/40 border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-all group"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {item.sector && <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{item.sector}</span>}
                            <SentimentBadge sentiment={item.sentiment} />
                          </div>
                          {item.fetched_at && <span className="text-[8px] text-white/20 font-mono">{timeAgo(item.fetched_at)}</span>}
                        </div>
                        {item.summary && <p className="text-[11px] text-white/60 leading-relaxed mb-3 line-clamp-3">{item.summary}</p>}
                        <div className="space-y-1.5">
                          {headlines.slice(0, 3).map((h, j) => (
                            <div key={j} className="flex items-start gap-2 pl-2 border-l border-white/10">
                              <ChevronRight className="w-2.5 h-2.5 text-white/20 mt-0.5 shrink-0" />
                              <p className="text-[9px] text-white/40 leading-relaxed">
                                {typeof h === 'string' ? h : String(safeObj(h).title || safeObj(h).headline || JSON.stringify(h))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : <p className="text-[10px] text-white/20 col-span-full text-center py-8">NO NEWS DATA</p>}
              </div>
            </section>

            {/* ─── SECTION: PREDICTIONS ─── */}
            <section id="section-predictions" className="scroll-mt-4 space-y-5 pb-8">
              <div className="flex items-center gap-2 pt-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-mono text-purple-400 tracking-[0.15em] font-bold uppercase">Predictive Intelligence</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
              </div>

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
                ) : <p className="text-[10px] text-white/30 text-center py-6">Prediction engine synchronizing...</p>}
              </HudPanel>
            </section>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>
    </div>
  );
}
