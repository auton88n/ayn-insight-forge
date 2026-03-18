import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Globe2, AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, Zap, BarChart3, Ship, Cpu, Landmark, RefreshCw, Clock, ChevronRight, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

// ── Types ───────────────────────────────────────────────────────────────

interface MarketSnapshot {
  snapshot: Json;
  fetched_at: string;
  sources_used: string[] | null;
  fetch_errors: string[] | null;
}

interface GeopoliticalData {
  active_conflicts: Json;
  trade_tensions: Json;
  sanctions: Json;
  risk_by_region: Json;
  intelligence_brief: Json;
  fetched_at: string | null;
}

interface SupplyChainData {
  bottlenecks: Json;
  risk_alerts: Json;
  shipping_rates: Json;
  port_congestion: Json;
  intelligence_brief: Json;
  fetched_at: string | null;
}

interface BusinessNews {
  headlines: Json;
  summary: string | null;
  sentiment: string | null;
  sector: string | null;
  fetched_at: string | null;
}

interface MarketPrices {
  indices: Json;
  energy: Json;
  metals: Json;
  crypto: Json;
  currencies: Json;
  narrative: Json;
  fetched_at: string | null;
}

interface TechDisruption {
  ai_developments: Json;
  emerging_tech: Json;
  disrupted_industries: Json;
  intelligence_brief: Json;
  fetched_at: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function safeArray(val: Json | null | undefined): any[] {
  if (Array.isArray(val)) return val;
  return [];
}

function safeObj(val: Json | null | undefined): Record<string, any> {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, any>;
  return {};
}

function safeStr(val: Json | null | undefined): string {
  if (typeof val === 'string') return val;
  return '';
}

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
  } catch {
    return 'Unknown';
  }
}

// ── Sub-components ──────────────────────────────────────────────────────

function PanelCard({ title, icon: Icon, children, className, accentColor = 'amber' }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-500 border-amber-500/30',
    red: 'text-red-500 border-red-500/30',
    emerald: 'text-emerald-500 border-emerald-500/30',
    cyan: 'text-cyan-500 border-cyan-500/30',
    purple: 'text-purple-500 border-purple-500/30',
    blue: 'text-blue-500 border-blue-500/30',
  };
  const color = colorMap[accentColor] || colorMap.amber;

  return (
    <div className={cn(
      "rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden",
      "shadow-[0_2px_20px_-4px_hsl(var(--foreground)/0.08)]",
      "hover:shadow-[0_4px_30px_-6px_hsl(var(--foreground)/0.12)] transition-shadow duration-500",
      className
    )}>
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b", color.split(' ')[1])}>
        <Icon className={cn("w-4 h-4", color.split(' ')[0])} />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatChip({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-foreground">{value}</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
      </div>
    </div>
  );
}

function AlertItem({ text, urgency }: { text: string; urgency?: string }) {
  const isHigh = urgency === 'high' || urgency === 'critical';
  return (
    <div className={cn(
      "flex items-start gap-2 py-2 border-b border-border/20 last:border-0",
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", isHigh ? "bg-red-500 animate-pulse" : "bg-amber-500")} />
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

function GlobeVisualization() {
  // CSS-only animated globe with data points
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      {/* Globe base */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-card/60 via-transparent to-card/30 border border-border/30" />
      
      {/* Grid lines - horizontal */}
      {[20, 35, 50, 65, 80].map((top, i) => (
        <div key={`h-${i}`} className="absolute left-[10%] right-[10%] border-t border-border/15" style={{ top: `${top}%` }} />
      ))}
      
      {/* Grid lines - vertical (curved effect via ellipse) */}
      {[25, 40, 50, 60, 75].map((left, i) => (
        <div key={`v-${i}`} className="absolute top-[10%] bottom-[10%] border-l border-border/15" style={{ left: `${left}%` }} />
      ))}
      
      {/* Continent shapes approximated with colored zones */}
      <div className="absolute top-[22%] left-[35%] w-[30%] h-[25%] rounded-full bg-amber-500/8 blur-xl" />
      <div className="absolute top-[40%] left-[20%] w-[20%] h-[30%] rounded-full bg-amber-500/6 blur-xl" />
      <div className="absolute top-[25%] left-[55%] w-[25%] h-[35%] rounded-full bg-amber-500/8 blur-xl" />
      <div className="absolute top-[55%] left-[55%] w-[15%] h-[20%] rounded-full bg-amber-500/5 blur-xl" />
      
      {/* Animated data pulse points */}
      {[
        { top: '28%', left: '42%', color: 'bg-red-500', delay: '0s' },    // Europe
        { top: '35%', left: '65%', color: 'bg-amber-500', delay: '0.5s' }, // Middle East
        { top: '30%', left: '75%', color: 'bg-cyan-500', delay: '1s' },    // Asia
        { top: '45%', left: '30%', color: 'bg-emerald-500', delay: '1.5s' }, // Africa
        { top: '32%', left: '22%', color: 'bg-blue-500', delay: '2s' },    // Americas
        { top: '60%', left: '70%', color: 'bg-purple-500', delay: '0.8s' }, // Australia
        { top: '25%', left: '55%', color: 'bg-red-400', delay: '1.2s' },   // Central Asia
      ].map((point, i) => (
        <div key={i} className="absolute" style={{ top: point.top, left: point.left }}>
          <span className={cn("block w-2 h-2 rounded-full", point.color)} />
          <span
            className={cn("absolute inset-0 rounded-full animate-ping opacity-40", point.color)}
            style={{ animationDelay: point.delay, animationDuration: '3s' }}
          />
        </div>
      ))}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <line x1="42" y1="28" x2="65" y2="35" stroke="hsl(var(--foreground))" strokeWidth="0.15" strokeOpacity="0.2" strokeDasharray="2,2">
          <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="65" y1="35" x2="75" y2="30" stroke="hsl(var(--foreground))" strokeWidth="0.15" strokeOpacity="0.2" strokeDasharray="2,2">
          <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="5s" repeatCount="indefinite" />
        </line>
        <line x1="22" y1="32" x2="42" y2="28" stroke="hsl(var(--foreground))" strokeWidth="0.15" strokeOpacity="0.2" strokeDasharray="2,2">
          <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="3.5s" repeatCount="indefinite" />
        </line>
      </svg>
      
      {/* Glow ring */}
      <div className="absolute inset-[-2px] rounded-full border border-amber-500/10" />
      <div className="absolute inset-[-8px] rounded-full border border-amber-500/5" />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function WorldIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [geopolitical, setGeopolitical] = useState<GeopoliticalData | null>(null);
  const [supplyChain, setSupplyChain] = useState<SupplyChainData | null>(null);
  const [news, setNews] = useState<BusinessNews[]>([]);
  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [tech, setTech] = useState<TechDisruption | null>(null);

  const fetchAllData = async () => {
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
  };

  useEffect(() => {
    fetchAllData().finally(() => setLoading(false));

    // Real-time subscription on market snapshot
    const channel = supabase
      .channel('world-intel-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_snapshot' }, (payload) => {
        setSnapshot(payload.new as unknown as MarketSnapshot);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_geopolitical' }, (payload) => {
        setGeopolitical(payload.new as unknown as GeopoliticalData);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Parse snapshot intelligence brief
  const briefItems = useMemo(() => {
    if (!snapshot?.snapshot) return [];
    const snap = safeObj(snapshot.snapshot);
    return safeArray(snap.intelligence_brief);
  }, [snapshot]);

  // Parse market indices
  const indices = useMemo(() => safeArray(prices?.indices), [prices]);
  const energy = useMemo(() => safeArray(prices?.energy), [prices]);
  const metals = useMemo(() => safeArray(prices?.metals), [prices]);
  const crypto = useMemo(() => safeArray(prices?.crypto), [prices]);

  // Parse geopolitical
  const conflicts = useMemo(() => safeArray(geopolitical?.active_conflicts), [geopolitical]);
  const tensions = useMemo(() => safeArray(geopolitical?.trade_tensions), [geopolitical]);
  const riskByRegion = useMemo(() => safeObj(geopolitical?.risk_by_region), [geopolitical]);
  const geoBrief = useMemo(() => safeArray(geopolitical?.intelligence_brief), [geopolitical]);

  // Parse supply chain
  const scBottlenecks = useMemo(() => safeArray(supplyChain?.bottlenecks), [supplyChain]);
  const scAlerts = useMemo(() => safeArray(supplyChain?.risk_alerts), [supplyChain]);
  const scBrief = useMemo(() => safeArray(supplyChain?.intelligence_brief), [supplyChain]);

  // Parse tech
  const aiDev = useMemo(() => safeArray(tech?.ai_developments), [tech]);
  const emergingTech = useMemo(() => safeArray(tech?.emerging_tech), [tech]);
  const techBrief = useMemo(() => safeArray(tech?.intelligence_brief), [tech]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading world intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Globe2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground">World Intelligence</h1>
                <p className="text-[11px] text-muted-foreground">
                  Live data · Updated {timeAgo(snapshot?.fetched_at || null)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">LIVE</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl text-xs gap-1.5"
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* Top row: Globe + Intelligence Brief */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <PanelCard title="Global Overview" icon={Globe2} accentColor="amber">
                <GlobeVisualization />
                {/* Region risk summary under globe */}
                {Object.keys(riskByRegion).length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Risk by Region</p>
                    {Object.entries(riskByRegion).slice(0, 6).map(([region, risk]) => (
                      <div key={region} className="flex items-center justify-between py-1">
                        <span className="text-xs text-foreground/70">{String(region)}</span>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          String(risk) === 'high' || String(risk) === 'critical'
                            ? "bg-red-500/10 text-red-500"
                            : String(risk) === 'medium' || String(risk) === 'elevated'
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {String(risk).toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>
            </motion.div>

            {/* Intelligence Brief */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <PanelCard title="Intelligence Brief" icon={Activity} accentColor="cyan" className="h-full">
                {briefItems.length > 0 ? (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {briefItems.map((item, i) => {
                      const text = typeof item === 'string' ? item : JSON.stringify(item);
                      const isAlert = text.includes('⚠') || text.includes('🔴') || text.includes('PREDICTION');
                      const isForecast = text.includes('📊') || text.includes('FORECAST');
                      const isOpportunity = text.includes('💡') || text.includes('OPPORTUNITY');
                      
                      return (
                        <div
                          key={i}
                          className={cn(
                            "text-xs leading-relaxed py-2 px-3 rounded-lg border-l-2",
                            isAlert ? "border-l-red-500 bg-red-500/5" :
                            isForecast ? "border-l-blue-500 bg-blue-500/5" :
                            isOpportunity ? "border-l-emerald-500 bg-emerald-500/5" :
                            "border-l-border bg-muted/30"
                          )}
                        >
                          <span className="text-foreground/80">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Intelligence brief data is being gathered...
                  </p>
                )}
              </PanelCard>
            </motion.div>
          </div>

          {/* Market Prices Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Indices */}
              <PanelCard title="Market Indices" icon={BarChart3} accentColor="blue">
                {indices.length > 0 ? indices.slice(0, 6).map((idx, i) => {
                  const obj = safeObj(idx);
                  const name = String(obj.name || obj.symbol || `Index ${i + 1}`);
                  const val = obj.price || obj.value || obj.level || '—';
                  const change = obj.change || obj.change_pct || obj.percent_change;
                  const trend = change ? (Number(change) > 0 ? 'up' as const : 'down' as const) : undefined;
                  return <StatChip key={i} label={name} value={String(val)} trend={trend} />;
                }) : <p className="text-xs text-muted-foreground py-4 text-center">No data</p>}
              </PanelCard>

              {/* Energy */}
              <PanelCard title="Energy" icon={Flame} accentColor="amber">
                {energy.length > 0 ? energy.slice(0, 6).map((item, i) => {
                  const obj = safeObj(item);
                  const name = String(obj.name || obj.commodity || `Item ${i + 1}`);
                  const val = obj.price || obj.value || '—';
                  const change = obj.change || obj.change_pct;
                  const trend = change ? (Number(change) > 0 ? 'up' as const : 'down' as const) : undefined;
                  return <StatChip key={i} label={name} value={`$${val}`} trend={trend} />;
                }) : <p className="text-xs text-muted-foreground py-4 text-center">No data</p>}
              </PanelCard>

              {/* Metals */}
              <PanelCard title="Metals" icon={Target} accentColor="emerald">
                {metals.length > 0 ? metals.slice(0, 6).map((item, i) => {
                  const obj = safeObj(item);
                  const name = String(obj.name || obj.metal || `Metal ${i + 1}`);
                  const val = obj.price || obj.value || '—';
                  const change = obj.change || obj.change_pct;
                  const trend = change ? (Number(change) > 0 ? 'up' as const : 'down' as const) : undefined;
                  return <StatChip key={i} label={name} value={`$${val}`} trend={trend} />;
                }) : <p className="text-xs text-muted-foreground py-4 text-center">No data</p>}
              </PanelCard>

              {/* Crypto */}
              <PanelCard title="Crypto" icon={Zap} accentColor="purple">
                {crypto.length > 0 ? crypto.slice(0, 6).map((item, i) => {
                  const obj = safeObj(item);
                  const name = String(obj.name || obj.symbol || `Crypto ${i + 1}`);
                  const val = obj.price || obj.value || '—';
                  const change = obj.change || obj.change_pct;
                  const trend = change ? (Number(change) > 0 ? 'up' as const : 'down' as const) : undefined;
                  return <StatChip key={i} label={name} value={`$${val}`} trend={trend} />;
                }) : <p className="text-xs text-muted-foreground py-4 text-center">No data</p>}
              </PanelCard>
            </div>
          </motion.div>

          {/* Geopolitical + Supply Chain + Tech */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Geopolitical Risks */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <PanelCard title="Geopolitical Risks" icon={Shield} accentColor="red" className="h-full">
                {conflicts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Active Conflicts</p>
                    {conflicts.slice(0, 4).map((c, i) => {
                      const obj = safeObj(c);
                      const text = typeof c === 'string' ? c : (obj.description || obj.name || obj.title || JSON.stringify(c));
                      return <AlertItem key={i} text={String(text)} urgency="high" />;
                    })}
                  </div>
                )}
                {tensions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Trade Tensions</p>
                    {tensions.slice(0, 4).map((t, i) => {
                      const obj = safeObj(t);
                      const text = typeof t === 'string' ? t : (obj.description || obj.summary || JSON.stringify(t));
                      return <AlertItem key={i} text={String(text)} />;
                    })}
                  </div>
                )}
                {geoBrief.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Brief</p>
                    {geoBrief.slice(0, 3).map((b, i) => (
                      <p key={i} className="text-xs text-foreground/70 leading-relaxed mb-1.5">
                        {typeof b === 'string' ? b : JSON.stringify(b)}
                      </p>
                    ))}
                  </div>
                )}
                {conflicts.length === 0 && tensions.length === 0 && geoBrief.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No geopolitical data available</p>
                )}
              </PanelCard>
            </motion.div>

            {/* Supply Chain */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <PanelCard title="Supply Chain" icon={Ship} accentColor="amber" className="h-full">
                {scAlerts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Risk Alerts</p>
                    {scAlerts.slice(0, 4).map((a, i) => {
                      const text = typeof a === 'string' ? a : (safeObj(a).description || safeObj(a).alert || JSON.stringify(a));
                      return <AlertItem key={i} text={String(text)} urgency="high" />;
                    })}
                  </div>
                )}
                {scBottlenecks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Bottlenecks</p>
                    {scBottlenecks.slice(0, 4).map((b, i) => {
                      const text = typeof b === 'string' ? b : (safeObj(b).description || safeObj(b).location || JSON.stringify(b));
                      return <AlertItem key={i} text={String(text)} />;
                    })}
                  </div>
                )}
                {scBrief.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Brief</p>
                    {scBrief.slice(0, 3).map((b, i) => (
                      <p key={i} className="text-xs text-foreground/70 leading-relaxed mb-1.5">
                        {typeof b === 'string' ? b : JSON.stringify(b)}
                      </p>
                    ))}
                  </div>
                )}
                {scAlerts.length === 0 && scBottlenecks.length === 0 && scBrief.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No supply chain data available</p>
                )}
              </PanelCard>
            </motion.div>

            {/* Tech Disruption */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <PanelCard title="Tech & AI Disruption" icon={Cpu} accentColor="purple" className="h-full">
                {aiDev.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">AI Developments</p>
                    {aiDev.slice(0, 4).map((a, i) => {
                      const text = typeof a === 'string' ? a : (safeObj(a).description || safeObj(a).title || JSON.stringify(a));
                      return <AlertItem key={i} text={String(text)} />;
                    })}
                  </div>
                )}
                {emergingTech.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Emerging Tech</p>
                    {emergingTech.slice(0, 4).map((t, i) => {
                      const text = typeof t === 'string' ? t : (safeObj(t).description || safeObj(t).name || JSON.stringify(t));
                      return <AlertItem key={i} text={String(text)} />;
                    })}
                  </div>
                )}
                {techBrief.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Brief</p>
                    {techBrief.slice(0, 3).map((b, i) => (
                      <p key={i} className="text-xs text-foreground/70 leading-relaxed mb-1.5">
                        {typeof b === 'string' ? b : JSON.stringify(b)}
                      </p>
                    ))}
                  </div>
                )}
                {aiDev.length === 0 && emergingTech.length === 0 && techBrief.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No tech disruption data available</p>
                )}
              </PanelCard>
            </motion.div>
          </div>

          {/* Business News */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <PanelCard title="Business News & Sentiment" icon={Landmark} accentColor="blue">
              {news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map((item, i) => {
                    const headlines = safeArray(item.headlines);
                    return (
                      <div key={i} className="rounded-xl bg-muted/20 border border-border/30 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {item.sector || 'Global'}
                          </span>
                          {item.sentiment && (
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              item.sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-500" :
                              item.sentiment === 'negative' ? "bg-red-500/10 text-red-500" :
                              "bg-amber-500/10 text-amber-500"
                            )}>
                              {item.sentiment.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {item.summary && (
                          <p className="text-xs text-foreground/70 leading-relaxed">{item.summary}</p>
                        )}
                        {headlines.slice(0, 3).map((h, j) => (
                          <p key={j} className="text-[11px] text-foreground/60 pl-2 border-l border-border/40">
                            {typeof h === 'string' ? h : (safeObj(h).title || safeObj(h).headline || JSON.stringify(h))}
                          </p>
                        ))}
                        <p className="text-[10px] text-muted-foreground">{timeAgo(item.fetched_at)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No business news available</p>
              )}
            </PanelCard>
          </motion.div>

          {/* Market Narrative */}
          {prices?.narrative && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <PanelCard title="Market Narrative" icon={TrendingUp} accentColor="emerald">
                {(() => {
                  const narr = safeArray(prices.narrative);
                  if (narr.length > 0) {
                    return (
                      <div className="space-y-2">
                        {narr.map((n, i) => (
                          <p key={i} className="text-xs text-foreground/80 leading-relaxed">
                            {typeof n === 'string' ? n : JSON.stringify(n)}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  const narrObj = safeObj(prices.narrative);
                  if (Object.keys(narrObj).length > 0) {
                    return (
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {narrObj.summary || narrObj.text || JSON.stringify(narrObj)}
                      </p>
                    );
                  }
                  return typeof prices.narrative === 'string' ? (
                    <p className="text-xs text-foreground/80 leading-relaxed">{prices.narrative}</p>
                  ) : null;
                })()}
              </PanelCard>
            </motion.div>
          )}

          {/* Data Sources Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 pb-6">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Sources: {snapshot?.sources_used?.join(', ') || 'FRED, Alpha Vantage, GDELT, Firecrawl'}</span>
            </div>
            {snapshot?.fetch_errors && snapshot.fetch_errors.length > 0 && (
              <span className="text-red-400">{snapshot.fetch_errors.length} fetch error(s)</span>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
