import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, Clock, AlertTriangle, TrendingUp, Shield, Zap, Ship, Cpu, Globe2, BarChart3, Flame, Radio, Activity, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { HeatMap2D, MapPoint } from '@/components/dashboard/HeatMap2D';

// Interfaces matching the original structure
interface MarketSnapshot { snapshot: Json; fetched_at: string; sources_used: string[] | null; fetch_errors: string[] | null; }
interface GeopoliticalData { active_conflicts: Json; trade_tensions: Json; risk_by_region: Json; intelligence_brief: Json; }
interface SupplyChainData { bottlenecks: Json; risk_alerts: Json; intelligence_brief: Json; }
interface BusinessNews { headlines: Json; sentiment: string | null; summary: string | null; sector: string | null; fetched_at: string | null; }
interface MarketPrices { indices: Json; energy: Json; metals: Json; crypto: Json; currencies: Json; narrative: Json; }
interface TechDisruption { ai_developments: Json; emerging_tech: Json; intelligence_brief: Json; }

function safeArray(val: Json | null | undefined): any[] { if (Array.isArray(val)) return val; return []; }
function safeObj(val: Json | null | undefined): Record<string, any> { if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, any>; return {}; }
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return format(d, 'MMM d, HH:mm');
  } catch { return 'Unknown'; }
}

function HudPanel({ title, icon: Icon, children, color = 'cyan', collapsible = false, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; color?: 'cyan' | 'red' | 'amber' | 'emerald' | 'purple' | 'blue'; collapsible?: boolean; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/5', dot: 'bg-cyan-400' },
    red: { border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/5', dot: 'bg-red-400' },
    amber: { border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/5', dot: 'bg-amber-400' },
    emerald: { border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/5', dot: 'bg-emerald-400' },
    purple: { border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/5', dot: 'bg-purple-400' },
    blue: { border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/5', dot: 'bg-blue-400' },
  };
  const c = colorMap[color];
  return (
    <div className={cn("border rounded-sm bg-black/40 backdrop-blur-sm overflow-hidden", c.border, c.glow, "shadow-lg flex flex-col min-h-[100px]")}>
      <div className={cn("flex items-center justify-between px-3 py-2 border-b shrink-0", c.border, "bg-gradient-to-r from-black/60 to-transparent", collapsible && "cursor-pointer select-none")} onClick={() => collapsible && setOpen(!open)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
          <Icon className={cn("w-3.5 h-3.5", c.text)} />
          <span className={cn("text-[10px] font-mono font-bold uppercase tracking-[0.15em]", c.text)}>{title}</span>
        </div>
        {collapsible && (open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />)}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={collapsible ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} exit={collapsible ? { height: 0, opacity: 0 } : undefined} transition={{ duration: 0.2 }} className="flex-1 overflow-hidden">
            <div className="p-3 h-full">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarketTicker({ indices, energy, metals, crypto }: { indices: any[], energy: any[], metals: any[], crypto: any[] }) {
  const items = [...indices, ...energy, ...metals, ...crypto].slice(0, 15);
  if (items.length === 0) return null;
  return (
    <div className="relative overflow-hidden border-y border-cyan-500/10 bg-black/60 shrink-0">
      <div className="flex animate-[scroll_60s_linear_infinite] gap-8 py-1.5 px-4 whitespace-nowrap">
        {[...items, ...items].map((item: any, i) => {
          const v = safeObj(item);
          const change = parseFloat(v.change_pct || v.change || '0') || 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 text-[10px] font-mono">
              <span className="text-white/50">{v.name || v.symbol || v.commodity || v.metal}</span>
              <span className="text-white/80 font-semibold">${v.price || v.value || '—'}</span>
              <span className={cn("font-bold", change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-white/30")}>
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
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 group">
      <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors truncate max-w-[60%]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-white/80 font-semibold">{prefix}{value}</span>
        {change !== undefined && (
          <span className={cn("text-[9px] font-mono font-bold", change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-white/20")}>
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
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <div className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", isHigh ? "bg-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "bg-amber-400")}>
        {isHigh && <div className="w-1 h-1 rounded-full bg-red-400 animate-ping" />}
      </div>
      <p className="text-[10px] font-mono text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function BriefLine({ text }: { text: string }) {
  const isAlert = text.includes('⚠') || text.includes('🔴') || text.includes('PREDICTION') || text.includes('ALERT');
  return (
    <div className={cn("text-[10px] font-mono leading-relaxed py-1.5 px-2 border-l-2 mb-1", isAlert ? "border-l-red-500/60 text-red-300/70 bg-red-500/5" : "border-l-cyan-400/30 text-cyan-100/60 bg-cyan-400/5")}>
      {text}
    </div>
  );
}

export default function WorldIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Restore the 6 original state buckets to power all cards + snapshot for Predictions
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

  // Combine Briefs
  const briefItems = useMemo(() => {
    const items = [];
    if (snapshot?.snapshot) {
      const b = safeArray(safeObj(snapshot.snapshot).intelligence_brief);
      if (b.length) items.push(...b);
    }
    if (geopolitical?.intelligence_brief) items.push(...safeArray(geopolitical.intelligence_brief).slice(0, 2));
    if (supplyChain?.intelligence_brief) items.push(...safeArray(supplyChain.intelligence_brief).slice(0, 2));
    return items.length > 0 ? items : ["Intelligence arrays idle. Standing by."];
  }, [snapshot, geopolitical, supplyChain]);

  // Pricing arrays from original prices table
  const indices = useMemo(() => safeArray(prices?.indices), [prices]);
  const energy = useMemo(() => safeArray(prices?.energy), [prices]);
  const metals = useMemo(() => safeArray(prices?.metals), [prices]);
  const crypto = useMemo(() => safeArray(prices?.crypto), [prices]);

  const conflicts = useMemo(() => safeArray(geopolitical?.active_conflicts), [geopolitical]);
  const tensions = useMemo(() => safeArray(geopolitical?.trade_tensions), [geopolitical]);
  
  const scBottlenecks = useMemo(() => safeArray(supplyChain?.bottlenecks), [supplyChain]);
  const scAlerts = useMemo(() => safeArray(supplyChain?.risk_alerts), [supplyChain]);
  
  const aiDev = useMemo(() => safeArray(tech?.ai_developments), [tech]);
  const emergingTech = useMemo(() => safeArray(tech?.emerging_tech), [tech]);

  // Pull new polymarket predictions from snapshot!
  const predictions = useMemo(() => {
    if (!snapshot?.snapshot) return [];
    return safeArray(safeObj(safeObj(snapshot.snapshot).prediction_markets).prediction_markets);
  }, [snapshot]);

  const mapPoints: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];

    // Map conflicts dynamically
    conflicts.forEach(c => {
      const obj = safeObj(c);
      const name = (obj.name || obj.title || obj.description || '').toLowerCase();
      if (name.includes('ukraine') || name.includes('russia')) pts.push({ coordinates: [33.0, 48.0], label: "UKRAINE/RUSSIA", risk: "critical", detail: obj.description || name });
      if (name.includes('gaza') || name.includes('israel') || name.includes('yemen')) pts.push({ coordinates: [35.0, 31.0], label: "MIDDLE EAST", risk: "high", detail: obj.description || name });
      if (name.includes('taiwan') || name.includes('china')) pts.push({ coordinates: [120.0, 24.0], label: "SOUTH CHINA SEA", risk: "alert", detail: obj.description || name });
    });

    predictions.forEach(p => {
      const q = (p.question || '').toLowerCase();
      if (q.includes('fed ') || q.includes('us ') || q.includes('election')) pts.push({ coordinates: [-77.0, 38.9], label: "US FED/MACRO", detail: `Polymarket Output: ${p.question} (${p.yes_probability?.toFixed(1)}%)`, risk: "alert" });
      if (q.includes('eu ') || q.includes('europe')) pts.push({ coordinates: [2.3, 48.8], label: "EU PARLIAMENT", detail: `Polymarket Output: ${p.question} (${p.yes_probability?.toFixed(1)}%)`, risk: "stable" });
    });

    // Default static fallbacks to guarantee the map isn't completely empty
    if (pts.length === 0) {
      pts.push({ coordinates: [35.0, 31.0], label: "MIDDLE EAST TENSION", detail: "Standing geopolitical heat monitor.", risk: "high" });
      pts.push({ coordinates: [120.0, 24.0], label: "TAIWAN STRAIT", detail: "Ongoing maritime surveillance.", risk: "alert" });
      pts.push({ coordinates: [33.0, 48.0], label: "EASTERN EUROPE", detail: "Kinetic conflict zone.", risk: "critical" });
    }

    return pts.filter((value, index, self) => index === self.findIndex((t) => (t.coordinates[0] === value.coordinates[0] && t.coordinates[1] === value.coordinates[1])));
  }, [conflicts, predictions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border border-cyan-500/30 flex items-center justify-center">
            <Globe2 className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-cyan-400 text-sm tracking-[0.2em]">AYN INTELLIGENCE</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono overflow-hidden flex flex-col">
      <header className="shrink-0 border-b border-cyan-500/10 bg-black/80 backdrop-blur-sm z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,200,0.4)]" />
              <span className="text-xs text-cyan-400 tracking-[0.15em] font-bold">AYN GLOBAL DASHBOARD</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/30">
              <Clock className="w-3 h-3" />
              <span>{format(currentTime, 'HH:mm:ss')} UTC</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-wider">LIVE</span>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] text-white/50 hover:text-cyan-400 hover:bg-white/5 border border-white/10 transition-all">
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              <span>SWEEP</span>
            </button>
          </div>
        </div>
      </header>

      <MarketTicker indices={indices} energy={energy} metals={metals} crypto={crypto} />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-[1800px] mx-auto p-3 sm:p-4 space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 min-h-[400px]">
            <HudPanel title="Global Threat Map (2D)" icon={Globe2} color="cyan">
              <HeatMap2D points={mapPoints} />
            </HudPanel>
            
            <div className="flex flex-col gap-4 h-full">
              <HudPanel title="Intelligence Brief" icon={Activity} color="emerald">
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                  {briefItems.length > 0 ? briefItems.map((item, i) => {
                    const text = typeof item === 'string' ? item : JSON.stringify(item);
                    return <BriefLine key={i} text={text} />;
                  }) : <p className="text-[10px] text-white/30 text-center py-8">Intelligence brief gathering in progress...</p>}
                </div>
              </HudPanel>

              {/* Keep the new predictions view, driving off snapshot! */}
              <HudPanel title="Predictive Intelligence" icon={Target} color="purple">
                <div className="mb-3 max-h-[160px] overflow-y-auto scrollbar-thin">
                  <div className="text-[8px] text-purple-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold sticky top-0 bg-black/90 pb-1">Polymarket Probabilities</div>
                  {predictions.length > 0 ? predictions.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 group">
                      <span className="text-[10px] font-mono text-white/60 pr-2">{p.question}</span>
                      <span className="text-[11px] font-mono font-bold text-purple-400 shrink-0">{p.yes_probability?.toFixed(1)}%</span>
                    </div>
                  )) : <p className="text-[10px] text-white/30">Prediction engine synchronizing...</p>}
                </div>
              </HudPanel>
            </div>
          </div>

          {/* ROW 2: Markets Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HudPanel title="Indices" icon={BarChart3} color="blue">
              {indices.length > 0 ? indices.slice(0, 5).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)} value={String(obj.price || obj.value || obj.level || '—')} change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Energy" icon={Flame} color="amber">
              {energy.length > 0 ? energy.slice(0, 5).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.commodity || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Metals" icon={Shield} color="emerald">
              {metals.length > 0 ? metals.slice(0, 5).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.metal || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Crypto" icon={Zap} color="cyan">
              {crypto.length > 0 ? crypto.slice(0, 5).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)} value={String(obj.price || obj.value || '—')} prefix="$" change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>
          </div>

          {/* ROW 3: Deep Intel Geopolitics + Supply Chain + Tech */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <HudPanel title="Geopolitical Risks" icon={AlertTriangle} color="red">
              {conflicts.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-red-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Active Conflicts</div>
                  {conflicts.slice(0, 3).map((c, i) => {
                    const obj = safeObj(c);
                    const text = typeof c === 'string' ? c : String(obj.description || obj.name || obj.title || JSON.stringify(c));
                    return <AlertRow key={i} text={text} severity="high" />;
                  })}
                </div>
              )}
              {tensions.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-amber-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Trade Tensions</div>
                  {tensions.slice(0, 3).map((t, i) => {
                    const obj = safeObj(t);
                    const text = typeof t === 'string' ? t : String(obj.description || obj.summary || JSON.stringify(t));
                    return <AlertRow key={i} text={text} severity="medium" />;
                  })}
                </div>
              )}
              {conflicts.length === 0 && tensions.length === 0 && <p className="text-[10px] text-white/20 text-center py-6">NO GEOPOLITICAL DATA</p>}
            </HudPanel>

            <HudPanel title="Supply Chain" icon={Ship} color="amber">
              {scAlerts.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-red-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Risk Alerts</div>
                  {scAlerts.slice(0, 3).map((a, i) => <AlertRow key={i} text={typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).alert || JSON.stringify(a))} severity="high" />)}
                </div>
              )}
              {scBottlenecks.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-amber-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Bottlenecks</div>
                  {scBottlenecks.slice(0, 3).map((b, i) => <AlertRow key={i} text={typeof b === 'string' ? b : String(safeObj(b).description || safeObj(b).location || JSON.stringify(b))} />)}
                </div>
              )}
              {scAlerts.length === 0 && scBottlenecks.length === 0 && <p className="text-[10px] text-white/20 text-center py-6">NO SUPPLY CHAIN DATA</p>}
            </HudPanel>

            <HudPanel title="Tech & AI" icon={Cpu} color="cyan">
              {aiDev.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-cyan-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">AI Developments</div>
                  {aiDev.slice(0, 3).map((a, i) => <AlertRow key={i} text={typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).title || JSON.stringify(a))} />)}
                </div>
              )}
              {emergingTech.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-blue-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Emerging Tech</div>
                  {emergingTech.slice(0, 3).map((t, i) => <AlertRow key={i} text={typeof t === 'string' ? t : String(safeObj(t).description || safeObj(t).name || JSON.stringify(t))} />)}
                </div>
              )}
              {aiDev.length === 0 && emergingTech.length === 0 && <p className="text-[10px] text-white/20 text-center py-6">NO TECH DATA</p>}
            </HudPanel>
          </div>

          <HudPanel title="Recent Business News" icon={Radio} color="blue">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {news.length > 0 ? news.map((item, i) => {
                const headlines = safeArray(item.headlines);
                return (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded p-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-[8px] text-blue-400/80 uppercase tracking-[0.15em] font-bold mb-2">{item.sector || 'GLOBAL'}</div>
                      {item.summary && <p className="text-[10px] text-white/60 leading-relaxed line-clamp-3 mb-2">{item.summary}</p>}
                    </div>
                    <div>
                      {headlines.slice(0, 2).map((h, j) => (
                        <p key={j} className="text-[9px] text-white/40 pl-2 border-l border-white/10 mb-1 truncate">
                          {typeof h === 'string' ? h : String(safeObj(h).title || safeObj(h).headline || JSON.stringify(h))}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }) : <p className="text-[10px] text-white/20 col-span-full">NO NEWS DATA</p>}
             </div>
          </HudPanel>

        </div>
      </div>
      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
