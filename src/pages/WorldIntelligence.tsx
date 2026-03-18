import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, Clock, AlertTriangle, TrendingUp, TrendingDown, Shield, Zap, Ship, Cpu, Globe2, BarChart3, Flame, Radio, Activity, ChevronDown, ChevronUp } from 'lucide-react';
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

// ── SVG World Map ───────────────────────────────────────────────────────

// Simplified world map paths (continents)
const WORLD_PATHS = {
  northAmerica: "M 60,85 L 75,70 L 100,65 L 120,60 L 140,55 L 155,60 L 160,70 L 155,80 L 150,95 L 135,105 L 120,115 L 105,120 L 95,130 L 80,140 L 70,135 L 65,120 L 55,110 L 50,100 L 55,90 Z",
  southAmerica: "M 130,165 L 140,155 L 150,150 L 160,155 L 165,170 L 170,185 L 175,200 L 170,220 L 165,235 L 155,250 L 145,260 L 135,255 L 130,240 L 125,225 L 120,210 L 118,195 L 120,180 L 125,170 Z",
  europe: "M 240,55 L 250,50 L 265,48 L 280,50 L 290,55 L 295,60 L 290,70 L 280,75 L 270,80 L 258,78 L 250,72 L 245,65 Z",
  africa: "M 240,100 L 255,90 L 270,85 L 285,90 L 295,100 L 300,115 L 305,130 L 300,150 L 295,170 L 285,185 L 275,195 L 260,200 L 250,190 L 245,175 L 240,155 L 235,135 L 235,115 Z",
  asia: "M 290,40 L 310,35 L 340,30 L 370,35 L 400,40 L 420,50 L 430,60 L 425,75 L 415,85 L 400,90 L 385,95 L 370,100 L 350,95 L 335,90 L 315,85 L 300,80 L 295,70 L 290,55 Z",
  oceania: "M 380,160 L 400,155 L 420,160 L 430,170 L 425,185 L 415,195 L 400,200 L 385,195 L 375,185 L 372,170 Z",
  middleEast: "M 285,80 L 300,75 L 315,78 L 320,85 L 315,95 L 305,100 L 290,95 L 285,88 Z",
};

const RISK_HOTSPOTS = [
  { x: 290, y: 65, label: 'Europe', region: 'europe' },
  { x: 305, y: 88, label: 'Middle East', region: 'middle_east' },
  { x: 370, y: 55, label: 'East Asia', region: 'east_asia' },
  { x: 260, y: 140, label: 'Africa', region: 'africa' },
  { x: 100, y: 85, label: 'N. America', region: 'north_america' },
  { x: 145, y: 200, label: 'S. America', region: 'south_america' },
  { x: 400, y: 175, label: 'Oceania', region: 'oceania' },
  { x: 345, y: 80, label: 'Central Asia', region: 'central_asia' },
];

// Connection arcs between hotspots (trade routes / tension lines)
const CONNECTIONS = [
  { from: { x: 100, y: 85 }, to: { x: 290, y: 65 } },
  { from: { x: 290, y: 65 }, to: { x: 305, y: 88 } },
  { from: { x: 305, y: 88 }, to: { x: 370, y: 55 } },
  { from: { x: 370, y: 55 }, to: { x: 400, y: 175 } },
  { from: { x: 260, y: 140 }, to: { x: 305, y: 88 } },
  { from: { x: 100, y: 85 }, to: { x: 370, y: 55 } },
];

function WorldMap({ riskByRegion, conflicts }: { riskByRegion: Record<string, any>; conflicts: any[] }) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRiskColor = (region: string): string => {
    const risk = String(riskByRegion[region] || '').toLowerCase();
    if (risk === 'critical' || risk === 'high') return '#ef4444';
    if (risk === 'elevated' || risk === 'medium') return '#f59e0b';
    return '#10b981';
  };

  const getRiskLevel = (region: string): string => {
    return String(riskByRegion[region] || 'stable').toUpperCase();
  };

  return (
    <div className="relative w-full">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.1) 2px, rgba(0,255,200,0.1) 4px)' }} />

      <svg viewBox="0 0 500 300" className="w-full h-auto" style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,200,0.05))' }}>
        {/* Grid */}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`vg-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="300" stroke="rgba(0,255,200,0.06)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`hg-${i}`} x1="0" y1={i * 40} x2="500" y2={i * 40} stroke="rgba(0,255,200,0.06)" strokeWidth="0.5" />
        ))}

        {/* Continent shapes */}
        {Object.entries(WORLD_PATHS).map(([name, path]) => (
          <path
            key={name}
            d={path}
            fill="rgba(0,255,200,0.06)"
            stroke="rgba(0,255,200,0.2)"
            strokeWidth="0.8"
            className="transition-all duration-500"
          />
        ))}

        {/* Connection arcs */}
        {CONNECTIONS.map((conn, i) => {
          const midX = (conn.from.x + conn.to.x) / 2;
          const midY = Math.min(conn.from.y, conn.to.y) - 20;
          return (
            <g key={`conn-${i}`}>
              <path
                d={`M ${conn.from.x} ${conn.from.y} Q ${midX} ${midY} ${conn.to.x} ${conn.to.y}`}
                fill="none"
                stroke="rgba(0,255,200,0.1)"
                strokeWidth="0.6"
                strokeDasharray="4,4"
              >
                <animate attributeName="stroke-dashoffset" values="8;0" dur={`${3 + i}s`} repeatCount="indefinite" />
              </path>
            </g>
          );
        })}

        {/* Hotspot markers */}
        {RISK_HOTSPOTS.map((spot, i) => {
          const color = getRiskColor(spot.region);
          const isHovered = hoveredRegion === spot.region;
          return (
            <g
              key={spot.region}
              onMouseEnter={() => setHoveredRegion(spot.region)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="cursor-pointer"
            >
              {/* Pulse ring */}
              <circle cx={spot.x} cy={spot.y} r="8" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3">
                <animate attributeName="r" values="4;12;4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              {/* Center dot */}
              <circle cx={spot.x} cy={spot.y} r="3" fill={color} opacity="0.9" />
              <circle cx={spot.x} cy={spot.y} r="1.5" fill="white" opacity="0.6" />

              {/* Label on hover */}
              {isHovered && (
                <g>
                  <rect x={spot.x - 35} y={spot.y - 28} width="70" height="22" rx="3"
                    fill="rgba(0,0,0,0.85)" stroke={color} strokeWidth="0.5" />
                  <text x={spot.x} y={spot.y - 19} textAnchor="middle" fontSize="6" fill={color} fontFamily="monospace" fontWeight="bold">
                    {spot.label}
                  </text>
                  <text x={spot.x} y={spot.y - 11} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                    {getRiskLevel(spot.region)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Conflict markers */}
        {conflicts.slice(0, 5).map((c, i) => {
          const obj = safeObj(c);
          // Position conflicts near Middle East / conflict zones
          const positions = [
            { x: 300, y: 82 }, { x: 310, y: 90 }, { x: 295, y: 75 },
            { x: 350, y: 60 }, { x: 275, y: 95 },
          ];
          const pos = positions[i % positions.length];
          return (
            <g key={`conflict-${i}`}>
              <polygon
                points={`${pos.x},${pos.y - 5} ${pos.x + 3},${pos.y + 2} ${pos.x - 3},${pos.y + 2}`}
                fill="#ef4444"
                opacity="0.8"
              >
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
              </polygon>
            </g>
          );
        })}

        {/* Timestamp overlay */}
        <text x="490" y="290" textAnchor="end" fontSize="5" fill="rgba(0,255,200,0.3)" fontFamily="monospace">
          AYN INTELLIGENCE GRID · LIVE
        </text>
      </svg>
    </div>
  );
}

// ── HUD Panel ───────────────────────────────────────────────────────────

function HudPanel({ title, icon: Icon, children, color = 'cyan', collapsible = false, defaultOpen = true }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  color?: 'cyan' | 'red' | 'amber' | 'emerald' | 'purple' | 'blue';
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
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
    <div className={cn(
      "border rounded-sm bg-black/40 backdrop-blur-sm overflow-hidden",
      c.border, c.glow, "shadow-lg"
    )}>
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b",
          c.border,
          "bg-gradient-to-r from-black/60 to-transparent",
          collapsible && "cursor-pointer select-none"
        )}
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
          <Icon className={cn("w-3.5 h-3.5", c.text)} />
          <span className={cn("text-[10px] font-mono font-bold uppercase tracking-[0.15em]", c.text)}>
            {title}
          </span>
        </div>
        {collapsible && (
          open ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Market Ticker ───────────────────────────────────────────────────────

function MarketTicker({ indices, energy, metals, crypto }: {
  indices: any[]; energy: any[]; metals: any[]; crypto: any[];
}) {
  const allItems = useMemo(() => {
    const items: { name: string; value: string; change: number }[] = [];
    const extract = (arr: any[]) => {
      arr.forEach(item => {
        const obj = safeObj(item);
        const name = String(obj.name || obj.symbol || '');
        const val = obj.price || obj.value || obj.level;
        const change = parseFloat(obj.change_pct || obj.change || obj.percent_change || '0');
        if (name && val) items.push({ name, value: String(val), change });
      });
    };
    extract(indices);
    extract(energy);
    extract(metals);
    extract(crypto);
    return items;
  }, [indices, energy, metals, crypto]);

  if (allItems.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-y border-cyan-500/10 bg-black/60">
      <div className="flex animate-[scroll_60s_linear_infinite] gap-8 py-1.5 px-4 whitespace-nowrap">
        {[...allItems, ...allItems].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[10px] font-mono">
            <span className="text-white/50">{item.name}</span>
            <span className="text-white/80 font-semibold">{item.value}</span>
            <span className={cn(
              "font-bold",
              item.change > 0 ? "text-emerald-400" : item.change < 0 ? "text-red-400" : "text-white/30"
            )}>
              {item.change > 0 ? '▲' : item.change < 0 ? '▼' : '–'}{Math.abs(item.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Data Row Components ─────────────────────────────────────────────────

function DataRow({ label, value, change, prefix = '' }: {
  label: string; value: string; change?: number; prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 group">
      <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-white/80 font-semibold">{prefix}{value}</span>
        {change !== undefined && (
          <span className={cn(
            "text-[9px] font-mono font-bold",
            change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-white/20"
          )}>
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
      <div className={cn(
        "w-1 h-1 rounded-full mt-1.5 shrink-0",
        isHigh ? "bg-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "bg-amber-400"
      )}>
        {isHigh && <div className="w-1 h-1 rounded-full bg-red-400 animate-ping" />}
      </div>
      <p className="text-[10px] font-mono text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function BriefLine({ text }: { text: string }) {
  const isAlert = text.includes('⚠') || text.includes('🔴') || text.includes('PREDICTION');
  const isForecast = text.includes('📊') || text.includes('FORECAST');
  const isOpportunity = text.includes('💡') || text.includes('OPPORTUNITY');

  return (
    <div className={cn(
      "text-[10px] font-mono leading-relaxed py-1.5 px-2 border-l-2 mb-1",
      isAlert ? "border-l-red-500/60 text-red-300/70" :
      isForecast ? "border-l-blue-400/60 text-blue-300/70" :
      isOpportunity ? "border-l-emerald-400/60 text-emerald-300/70" :
      "border-l-white/10 text-white/50"
    )}>
      {text}
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
  const [currentTime, setCurrentTime] = useState(new Date());

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

    const channel = supabase
      .channel('world-intel-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_snapshot' }, (payload) => {
        setSnapshot(payload.new as unknown as MarketSnapshot);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_geopolitical' }, (payload) => {
        setGeopolitical(payload.new as unknown as GeopoliticalData);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_prices' }, (payload) => {
        setPrices(payload.new as unknown as MarketPrices);
      })
      .subscribe();

    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockInterval);
    };
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Parsed data
  const briefItems = useMemo(() => {
    if (!snapshot?.snapshot) return [];
    return safeArray(safeObj(snapshot.snapshot).intelligence_brief);
  }, [snapshot]);

  const indices = useMemo(() => safeArray(prices?.indices), [prices]);
  const energy = useMemo(() => safeArray(prices?.energy), [prices]);
  const metals = useMemo(() => safeArray(prices?.metals), [prices]);
  const crypto = useMemo(() => safeArray(prices?.crypto), [prices]);
  const currencies = useMemo(() => safeArray(prices?.currencies), [prices]);

  const conflicts = useMemo(() => safeArray(geopolitical?.active_conflicts), [geopolitical]);
  const tensions = useMemo(() => safeArray(geopolitical?.trade_tensions), [geopolitical]);
  const riskByRegion = useMemo(() => safeObj(geopolitical?.risk_by_region), [geopolitical]);
  const geoBrief = useMemo(() => safeArray(geopolitical?.intelligence_brief), [geopolitical]);

  const scBottlenecks = useMemo(() => safeArray(supplyChain?.bottlenecks), [supplyChain]);
  const scAlerts = useMemo(() => safeArray(supplyChain?.risk_alerts), [supplyChain]);
  const scBrief = useMemo(() => safeArray(supplyChain?.intelligence_brief), [supplyChain]);

  const aiDev = useMemo(() => safeArray(tech?.ai_developments), [tech]);
  const emergingTech = useMemo(() => safeArray(tech?.emerging_tech), [tech]);
  const techBrief = useMemo(() => safeArray(tech?.intelligence_brief), [tech]);

  // Boot sequence loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-mono">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full border border-cyan-500/30 flex items-center justify-center">
            <Globe2 className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-cyan-400 text-sm tracking-[0.2em]">AYN INTELLIGENCE</p>
            <p className="text-white/30 text-xs tracking-wider">INITIALIZING WORLD GRID...</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <span className="animate-pulse">├</span>
            <span>CONNECTING TO DATA SOURCES</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono overflow-hidden flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-cyan-500/10 bg-black/80 backdrop-blur-sm z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,200,0.4)]" />
              <span className="text-xs text-cyan-400 tracking-[0.15em] font-bold">AYN WORLD INTELLIGENCE</span>
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
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] text-white/50 hover:text-cyan-400 hover:bg-white/5 border border-white/10 transition-all"
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              <span>SWEEP</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Market Ticker ───────────────────────────────────────── */}
      <MarketTicker indices={indices} energy={energy} metals={metals} crypto={crypto} />

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1800px] mx-auto p-3 sm:p-4 space-y-3">

          {/* Row 1: Map + Intelligence Brief */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
            {/* World Map */}
            <HudPanel title="Global Threat Map" icon={Globe2} color="cyan">
              <WorldMap riskByRegion={riskByRegion} conflicts={conflicts} />
              {/* Region risk legend */}
              {Object.keys(riskByRegion).length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {Object.entries(riskByRegion).slice(0, 6).map(([region, risk]) => {
                    const riskStr = String(risk).toLowerCase();
                    const color = riskStr === 'high' || riskStr === 'critical' ? 'text-red-400' :
                      riskStr === 'elevated' || riskStr === 'medium' ? 'text-amber-400' : 'text-emerald-400';
                    return (
                      <div key={region} className="flex items-center gap-1.5 py-0.5">
                        <div className={cn("w-1 h-1 rounded-full", color.replace('text-', 'bg-'))} />
                        <span className="text-[9px] text-white/40">{region}</span>
                        <span className={cn("text-[8px] font-bold ml-auto", color)}>{String(risk).toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </HudPanel>

            {/* Intelligence Brief */}
            <HudPanel title="Intelligence Brief" icon={Activity} color="cyan">
              <div className="max-h-[350px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                {briefItems.length > 0 ? briefItems.map((item, i) => {
                  const text = typeof item === 'string' ? item : JSON.stringify(item);
                  return <BriefLine key={i} text={text} />;
                }) : (
                  <p className="text-[10px] text-white/30 text-center py-8">
                    Intelligence brief gathering in progress...
                  </p>
                )}
              </div>
            </HudPanel>
          </div>

          {/* Row 2: Markets Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HudPanel title="Indices" icon={BarChart3} color="blue">
              {indices.length > 0 ? indices.slice(0, 6).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)}
                  value={String(obj.price || obj.value || obj.level || '—')}
                  change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Energy" icon={Flame} color="amber">
              {energy.length > 0 ? energy.slice(0, 6).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.commodity || `#${i + 1}`)}
                  value={String(obj.price || obj.value || '—')} prefix="$"
                  change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Metals" icon={Shield} color="emerald">
              {metals.length > 0 ? metals.slice(0, 6).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.metal || `#${i + 1}`)}
                  value={String(obj.price || obj.value || '—')} prefix="$"
                  change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>

            <HudPanel title="Crypto" icon={Zap} color="purple">
              {crypto.length > 0 ? crypto.slice(0, 6).map((item, i) => {
                const obj = safeObj(item);
                return <DataRow key={i} label={String(obj.name || obj.symbol || `#${i + 1}`)}
                  value={String(obj.price || obj.value || '—')} prefix="$"
                  change={parseFloat(obj.change_pct || obj.change || '0') || undefined} />;
              }) : <p className="text-[10px] text-white/20 text-center py-4">NO DATA</p>}
            </HudPanel>
          </div>

          {/* Row 3: Geopolitical + Supply Chain + Tech */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Geopolitical */}
            <HudPanel title="Geopolitical Risks" icon={AlertTriangle} color="red">
              {conflicts.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-red-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Active Conflicts</div>
                  {conflicts.slice(0, 4).map((c, i) => {
                    const obj = safeObj(c);
                    const text = typeof c === 'string' ? c : String(obj.description || obj.name || obj.title || JSON.stringify(c));
                    return <AlertRow key={i} text={text} severity="high" />;
                  })}
                </div>
              )}
              {tensions.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-amber-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Trade Tensions</div>
                  {tensions.slice(0, 4).map((t, i) => {
                    const obj = safeObj(t);
                    const text = typeof t === 'string' ? t : String(obj.description || obj.summary || JSON.stringify(t));
                    return <AlertRow key={i} text={text} severity="medium" />;
                  })}
                </div>
              )}
              {geoBrief.length > 0 && (
                <div>
                  <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mb-1.5 font-bold">Brief</div>
                  {geoBrief.slice(0, 3).map((b, i) => (
                    <p key={i} className="text-[10px] text-white/40 leading-relaxed mb-1">
                      {typeof b === 'string' ? b : JSON.stringify(b)}
                    </p>
                  ))}
                </div>
              )}
              {conflicts.length === 0 && tensions.length === 0 && geoBrief.length === 0 && (
                <p className="text-[10px] text-white/20 text-center py-6">NO GEOPOLITICAL DATA</p>
              )}
            </HudPanel>

            {/* Supply Chain */}
            <HudPanel title="Supply Chain" icon={Ship} color="amber">
              {scAlerts.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-red-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Risk Alerts</div>
                  {scAlerts.slice(0, 4).map((a, i) => {
                    const text = typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).alert || JSON.stringify(a));
                    return <AlertRow key={i} text={text} severity="high" />;
                  })}
                </div>
              )}
              {scBottlenecks.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-amber-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Bottlenecks</div>
                  {scBottlenecks.slice(0, 4).map((b, i) => {
                    const text = typeof b === 'string' ? b : String(safeObj(b).description || safeObj(b).location || JSON.stringify(b));
                    return <AlertRow key={i} text={text} />;
                  })}
                </div>
              )}
              {scBrief.length > 0 && (
                <div>
                  <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mb-1.5 font-bold">Brief</div>
                  {scBrief.slice(0, 3).map((b, i) => (
                    <p key={i} className="text-[10px] text-white/40 leading-relaxed mb-1">
                      {typeof b === 'string' ? b : JSON.stringify(b)}
                    </p>
                  ))}
                </div>
              )}
              {scAlerts.length === 0 && scBottlenecks.length === 0 && scBrief.length === 0 && (
                <p className="text-[10px] text-white/20 text-center py-6">NO SUPPLY CHAIN DATA</p>
              )}
            </HudPanel>

            {/* Tech Disruption */}
            <HudPanel title="Tech & AI" icon={Cpu} color="purple">
              {aiDev.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-purple-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">AI Developments</div>
                  {aiDev.slice(0, 4).map((a, i) => {
                    const text = typeof a === 'string' ? a : String(safeObj(a).description || safeObj(a).title || JSON.stringify(a));
                    return <AlertRow key={i} text={text} />;
                  })}
                </div>
              )}
              {emergingTech.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] text-cyan-400/60 uppercase tracking-[0.15em] mb-1.5 font-bold">Emerging Tech</div>
                  {emergingTech.slice(0, 4).map((t, i) => {
                    const text = typeof t === 'string' ? t : String(safeObj(t).description || safeObj(t).name || JSON.stringify(t));
                    return <AlertRow key={i} text={text} />;
                  })}
                </div>
              )}
              {techBrief.length > 0 && (
                <div>
                  <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mb-1.5 font-bold">Brief</div>
                  {techBrief.slice(0, 3).map((b, i) => (
                    <p key={i} className="text-[10px] text-white/40 leading-relaxed mb-1">
                      {typeof b === 'string' ? b : JSON.stringify(b)}
                    </p>
                  ))}
                </div>
              )}
              {aiDev.length === 0 && emergingTech.length === 0 && techBrief.length === 0 && (
                <p className="text-[10px] text-white/20 text-center py-6">NO TECH DATA</p>
              )}
            </HudPanel>
          </div>

          {/* Row 4: News Feed */}
          <HudPanel title="Business News Feed" icon={Radio} color="blue">
            {news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {news.map((item, i) => {
                  const headlines = safeArray(item.headlines);
                  const sentimentColor = item.sentiment === 'positive' ? 'text-emerald-400 border-emerald-500/30' :
                    item.sentiment === 'negative' ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30';
                  return (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-sm p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-white/30 uppercase tracking-[0.15em] font-bold">
                          {item.sector || 'GLOBAL'}
                        </span>
                        {item.sentiment && (
                          <span className={cn("text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", sentimentColor)}>
                            {item.sentiment}
                          </span>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-[10px] text-white/50 leading-relaxed">{item.summary}</p>
                      )}
                      {headlines.slice(0, 3).map((h, j) => (
                        <p key={j} className="text-[9px] text-white/35 pl-2 border-l border-white/10">
                          {typeof h === 'string' ? h : String(safeObj(h).title || safeObj(h).headline || JSON.stringify(h))}
                        </p>
                      ))}
                      <p className="text-[8px] text-white/15">{timeAgo(item.fetched_at)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-white/20 text-center py-6">NO NEWS DATA</p>
            )}
          </HudPanel>

          {/* Row 5: Market Narrative */}
          {prices?.narrative && (
            <HudPanel title="Market Narrative" icon={TrendingUp} color="emerald" collapsible defaultOpen={false}>
              {(() => {
                const narr = safeArray(prices.narrative);
                if (narr.length > 0) {
                  return narr.map((n, i) => (
                    <p key={i} className="text-[10px] text-white/50 leading-relaxed mb-1.5">
                      {typeof n === 'string' ? n : JSON.stringify(n)}
                    </p>
                  ));
                }
                const narrObj = safeObj(prices.narrative);
                if (Object.keys(narrObj).length > 0) {
                  return <p className="text-[10px] text-white/50 leading-relaxed">{narrObj.summary || narrObj.text || JSON.stringify(narrObj)}</p>;
                }
                return typeof prices.narrative === 'string' ? (
                  <p className="text-[10px] text-white/50 leading-relaxed">{prices.narrative}</p>
                ) : null;
              })()}
            </HudPanel>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[8px] text-white/15 pb-4 font-mono">
            <div className="flex items-center gap-1.5">
              <span>SOURCES: {snapshot?.sources_used?.join(' · ') || 'FRED · ALPHA VANTAGE · GDELT · FIRECRAWL'}</span>
            </div>
            <div className="flex items-center gap-3">
              {snapshot?.fetch_errors && snapshot.fetch_errors.length > 0 && (
                <span className="text-red-400/50">{snapshot.fetch_errors.length} ERROR(S)</span>
              )}
              <span>LAST SWEEP: {timeAgo(snapshot?.fetched_at || null)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for ticker animation */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
