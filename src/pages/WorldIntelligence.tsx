import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, RefreshCw, Clock, TrendingUp,
  Globe2, BarChart3, Zap, Target, Activity,
  ChevronRight, ThumbsUp, ThumbsDown, Shield,
  Building2, Radio, Flame, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { HeatMap2D, MapPoint } from '@/components/dashboard/HeatMap2D';

interface MarketSnapshot { snapshot: Json; fetched_at: string; sources_used: string[] | null; }
interface Prediction {
  id: string; asset: string; horizon: string; target_date: string;
  baseline_value: number; predicted_value: number;
  predicted_low: number; predicted_high: number;
  predicted_direction: 'up' | 'down' | 'sideways';
  predicted_pct_change: number; confidence: number; reasoning: string;
  agree_count?: number; disagree_count?: number; user_vote?: 'agree' | 'disagree' | null;
}
interface CountryIntel {
  country_code: string; country_name: string;
  intelligence_brief: string[];
  economy: {
    gdp?: { formatted: string };
    gdp_growth?: { value: number; trend: string };
    inflation?: { value: number; trend: string };
    unemployment?: { value: number; trend: string };
    income_per_person?: { formatted: string };
    foreign_investment?: { value: number; trend: string };
  };
  hot_sectors?: string[];
  opportunities?: string[];
}

function safeArr(v: any): any[] { return Array.isArray(v) ? v : []; }
function safeObj(v: any): Record<string, any> { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
function timeAgo(d: string | null): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return format(new Date(d), 'MMM d');
}

const ASSET_META: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  gold:    { label: 'Gold',        unit: '/oz',  icon: '🥇', color: 'text-amber-400' },
  silver:  { label: 'Silver',      unit: '/oz',  icon: '🥈', color: 'text-slate-300' },
  oil:     { label: 'Brent Crude', unit: '/bbl', icon: '🛢️', color: 'text-orange-400' },
  btc:     { label: 'Bitcoin',     unit: '',     icon: '₿',  color: 'text-yellow-400' },
  eth:     { label: 'Ethereum',    unit: '',     icon: 'Ξ',  color: 'text-blue-400' },
  copper:  { label: 'Copper',      unit: '/mt',  icon: '🔶', color: 'text-orange-300' },
  wheat:   { label: 'Wheat',       unit: '/mt',  icon: '🌾', color: 'text-yellow-300' },
  usd_jpy: { label: 'USD/JPY',     unit: '',     icon: '¥',  color: 'text-cyan-400' },
};

const SIC_COORDINATES: Record<string, [number, number]> = {
  'USA': [-95.7, 37.0], 'CHN': [104.1, 35.8], 'EU': [10.4, 51.1], 'GBR': [-3.4, 55.3],
  'SAU': [45.0, 23.8],  'ARE': [53.8, 23.4],  'JPN': [138.2, 36.2], 'IND': [78.9, 20.5],
  'BRA': [-51.9, -14.2],'RUS': [105.3, 61.5], 'IRQ': [43.6, 33.2], 'KOR': [127.7, 35.9],
  'ZAF': [22.9, -30.5], 'CAN': [-106.3, 56.1],'AUS': [133.7, -25.2],
};

const ISO2_TO_SIC: Record<string, string> = {
  US: 'USA', CN: 'CHN', DE: 'EU', GB: 'GBR', SA: 'SAU', AE: 'ARE',
  JP: 'JPN', IN: 'IND', BR: 'BRA', RU: 'RUS', KR: 'KOR', ZA: 'ZAF',
  CA: 'CAN', AU: 'AUS', FR: 'EU', SG: 'ARE', QA: 'ARE',
};

function PredictionCard({ pred, onVote, userId, voting }: {
  pred: Prediction;
  onVote: (id: string, vote: 'agree' | 'disagree') => void;
  userId?: string;
  voting: boolean;
}) {
  const meta = ASSET_META[pred.asset] || { label: pred.asset.toUpperCase(), unit: '', icon: '📊', color: 'text-white' };
  const isUp = pred.predicted_direction === 'up';
  const isDown = pred.predicted_direction === 'down';
  const dirColor = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-amber-400';

  const low = pred.predicted_low || pred.predicted_value * 0.95;
  const high = pred.predicted_high || pred.predicted_value * 1.05;
  const range = high - low;
  const currentPct = range > 0 ? Math.max(2, Math.min(98, ((pred.baseline_value - low) / range) * 100)) : 50;
  const targetPct  = range > 0 ? Math.max(2, Math.min(98, ((pred.predicted_value - low) / range) * 100)) : 50;

  const totalVotes = (pred.agree_count || 0) + (pred.disagree_count || 0);
  const agreePct = totalVotes > 0 ? ((pred.agree_count || 0) / totalVotes) * 100 : 50;
  const daysLeft = Math.round((new Date(pred.target_date).getTime() - Date.now()) / 86400000);

  const fmt = (v: number) => {
    if (!v && v !== 0) return '—';
    if (v >= 10000) return `$${v.toLocaleString('en', { maximumFractionDigits: 0 })}`;
    if (v >= 100)   return `$${v.toFixed(2)}`;
    return `${v.toFixed(2)}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 border border-white/8 rounded-xl overflow-hidden hover:border-white/14 transition-all">
      {/* Card header */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b border-white/5',
        isUp ? 'bg-emerald-500/5' : isDown ? 'bg-red-500/5' : 'bg-amber-500/5')}>
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{meta.icon}</span>
          <div>
            <div className={cn('text-[11px] font-mono font-bold tracking-wider', meta.color)}>{meta.label}</div>
            <div className="text-[9px] text-white/25">Target {pred.target_date} · {daysLeft}d left</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono font-bold',
            isUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                 : isDown ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                 : 'bg-amber-500/15 text-amber-400 border border-amber-500/25')}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Number(pred.predicted_pct_change) > 0 ? '+' : ''}{Number(pred.predicted_pct_change).toFixed(1)}%
          </div>
          <div className="text-[9px] font-mono text-white/25 bg-white/5 px-2 py-1 rounded-full">
            {pred.confidence}%
          </div>
        </div>
      </div>

      {/* Price gauge */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-[8px] text-white/25 font-mono mb-0.5">NOW</div>
            <div className="text-sm font-mono font-bold text-white/60">{fmt(pred.baseline_value)}{meta.unit}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-white/25 font-mono mb-0.5">AYN TARGET</div>
            <div className={cn('text-xl font-mono font-bold', dirColor)}>{fmt(pred.predicted_value)}{meta.unit}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] text-white/25 font-mono mb-0.5">RANGE</div>
            <div className="text-[9px] font-mono text-white/35">{fmt(low)}–{fmt(high)}</div>
          </div>
        </div>

        {/* Gauge track */}
        <div className="relative h-6 bg-white/4 rounded-full overflow-visible my-1">
          {/* Fill between current and target */}
          <div className={cn('absolute inset-y-2 rounded-full opacity-15',
              isUp ? 'bg-emerald-400' : isDown ? 'bg-red-400' : 'bg-amber-400')}
            style={{
              left: `${Math.min(currentPct, targetPct)}%`,
              right: `${100 - Math.max(currentPct, targetPct)}%`,
            }} />
          {/* Current dot */}
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-white/50 z-10 shadow-lg"
            style={{ left: `calc(${currentPct}% - 6px)` }} />
          {/* Target dot */}
          <div className={cn('absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 z-10 shadow-lg',
              isUp ? 'bg-emerald-400 border-emerald-200' : isDown ? 'bg-red-400 border-red-200' : 'bg-amber-400 border-amber-200')}
            style={{ left: `calc(${targetPct}% - 7px)` }} />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-white/15 pointer-events-none">LOW</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-white/15 pointer-events-none">HIGH</div>
        </div>

        <p className="text-[10px] font-mono text-white/35 leading-relaxed line-clamp-2 mt-3">{pred.reasoning}</p>
      </div>

      {/* Vote */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">Do you agree with AYN?</span>
          {totalVotes > 0 && <span className="text-[9px] font-mono text-white/15">{totalVotes} votes</span>}
        </div>
        <div className="flex gap-2">
          {(['agree', 'disagree'] as const).map(v => (
            <button key={v} onClick={() => userId && !voting && onVote(pred.id, v)} disabled={!userId || voting}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border',
                pred.user_vote === v
                  ? v === 'agree' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-white/3 border-white/8 text-white/25 hover:border-white/15 hover:text-white/50 disabled:opacity-30 disabled:cursor-not-allowed')}>
              {v === 'agree' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
              {v.toUpperCase()} {v === 'agree' && pred.agree_count ? `(${pred.agree_count})` : ''}
              {v === 'disagree' && pred.disagree_count ? `(${pred.disagree_count})` : ''}
            </button>
          ))}
        </div>
        {totalVotes > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${agreePct}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-white/15 mt-0.5">
              <span>Agree {agreePct.toFixed(0)}%</span><span>Disagree {(100-agreePct).toFixed(0)}%</span>
            </div>
          </div>
        )}
        {!userId && <p className="text-[9px] text-white/15 text-center mt-2 font-mono">Sign in to vote</p>}
      </div>
    </motion.div>
  );
}

function CountryDossier({ intel, sic, onClose }: { intel: CountryIntel; sic: any; onClose: () => void }) {
  const econ = intel.economy || {};
  return (
    <motion.div initial={{ opacity: 0, x: 440 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 440 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-[#060609]/97 backdrop-blur-2xl border-l border-cyan-500/20 z-[100] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.4)]">
      <div className="p-5 border-b border-white/8 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-[0.2em] mb-1">S.I.C. Dossier</div>
            <h2 className="text-2xl font-mono font-bold text-white">{intel.country_name}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              {econ.gdp?.formatted && <span className="text-[10px] font-mono text-white/35">GDP {econ.gdp.formatted}</span>}
              {econ.gdp_growth?.value != null && (
                <span className={cn('text-[10px] font-mono font-bold', econ.gdp_growth.trend === 'rising' ? 'text-emerald-400' : 'text-amber-400')}>
                  {econ.gdp_growth.trend === 'rising' ? '▲' : '▼'} {Math.abs(econ.gdp_growth.value).toFixed(1)}% GDP
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/6 text-white/35 hover:text-white transition-colors text-xl font-mono">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        {/* Key stats */}
        <div>
          <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mb-3">Key Indicators</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Inflation', value: econ.inflation?.value != null ? `${econ.inflation.value.toFixed(1)}%` : null, good: (econ.inflation?.value || 0) < 3, trend: econ.inflation?.trend },
              { label: 'Unemployment', value: econ.unemployment?.value != null ? `${econ.unemployment.value.toFixed(1)}%` : null, good: (econ.unemployment?.value || 0) < 5, trend: econ.unemployment?.trend },
              { label: 'FDI', value: econ.foreign_investment?.value != null ? `${Number(econ.foreign_investment.value).toFixed(1)}% GDP` : null, good: (econ.foreign_investment?.value || 0) > 0, trend: econ.foreign_investment?.trend },
              { label: 'Income/Person', value: econ.income_per_person?.formatted || null, good: true, trend: null },
            ].filter(s => s.value).map(s => (
              <div key={s.label} className="bg-white/3 border border-white/5 rounded-lg p-3">
                <div className="text-[8px] font-mono text-white/25 uppercase mb-1">{s.label}</div>
                <div className={cn('text-sm font-mono font-bold', s.good ? 'text-white/75' : 'text-amber-400')}>{s.value}</div>
                {s.trend && <div className={cn('text-[8px] font-mono', s.trend === 'rising' ? 'text-red-400/70' : 'text-emerald-400/70')}>{s.trend}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Economic snapshot */}
        {intel.intelligence_brief?.length > 1 && (
          <div>
            <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-400" /> Economic Snapshot
            </div>
            <div className="space-y-1">
              {intel.intelligence_brief.slice(1).map((line, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/4 last:border-0">
                  <span className="text-white/15 shrink-0 mt-0.5 font-mono text-[10px]">›</span>
                  <span className="text-[10px] font-mono text-white/45 leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hot sectors */}
        {intel.hot_sectors && intel.hot_sectors.filter(Boolean).length > 0 && (
          <div>
            <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Flame className="w-3 h-3 text-orange-400" /> Hot Sectors
            </div>
            <div className="flex flex-wrap gap-2">
              {intel.hot_sectors.filter(Boolean).map((s, i) => (
                <span key={i} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-orange-500/8 border border-orange-500/18 text-orange-300/70">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Live intel from pulse engine */}
        {safeArr(sic?.news).filter((n: any) => n?.title?.length > 5).length > 0 && (
          <div>
            <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="w-3 h-3 text-cyan-400" /> Live Intelligence Feed
            </div>
            <div className="space-y-2">
              {safeArr(sic.news).filter((n: any) => n?.title?.length > 5).map((item: any, i: number) => (
                <div key={i} className="bg-black/40 border border-white/5 hover:border-cyan-500/18 p-3 rounded-lg transition-colors">
                  <p className="text-[10px] font-mono text-white/60 leading-relaxed">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade trajectory */}
        {sic?.trajectory && (
          <div>
            <div className="text-[8px] font-mono text-white/25 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-3 h-3 text-purple-400" /> Trade Position
            </div>
            <div className="bg-purple-500/4 border border-purple-500/12 rounded-lg p-3">
              <p className="text-[10px] font-mono text-purple-200/50 leading-relaxed">{sic.trajectory}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function WorldIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [countryIntel, setCountryIntel] = useState<CountryIntel[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{ intel: CountryIntel; sic: any } | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [activeHorizon, setActiveHorizon] = useState<'1_week' | '1_month' | '1_year'>('1_week');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('ayn-pulse-engine', { method: 'GET' });
      if (data && Object.keys(data).length > 0) setSnapshot(data as MarketSnapshot);
    } catch {}
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const { data: preds } = await supabase
        .from('ayn_predictions')
        .select('id,asset,horizon,target_date,baseline_value,predicted_value,predicted_low,predicted_high,predicted_direction,predicted_pct_change,confidence,reasoning')
        .eq('status', 'active')
        .eq('generated_by', 'ayn_prediction_engine_v9')
        .order('confidence', { ascending: false })
        .limit(60);
      if (!preds?.length) return;

      const { data: voteCounts } = await supabase
        .from('ayn_prediction_vote_counts' as any)
        .select('prediction_id,agree_count,disagree_count');

      let userVoteMap: Record<string, 'agree' | 'disagree'> = {};
      if (userId) {
        const { data: uv } = await supabase.from('ayn_prediction_votes')
          .select('prediction_id,vote').eq('user_id', userId).in('prediction_id', preds.map(p => p.id));
        if (uv) userVoteMap = Object.fromEntries(uv.map(v => [v.prediction_id, v.vote as 'agree' | 'disagree']));
      }

      const vMap = Object.fromEntries((voteCounts || []).map((v: any) => [v.prediction_id, v]));
      setPredictions(preds.map(p => ({
        ...p,
        baseline_value: Number(p.baseline_value),
        predicted_value: Number(p.predicted_value),
        predicted_low: Number(p.predicted_low),
        predicted_high: Number(p.predicted_high),
        predicted_pct_change: Number(p.predicted_pct_change),
        agree_count: vMap[p.id]?.agree_count || 0,
        disagree_count: vMap[p.id]?.disagree_count || 0,
        user_vote: userVoteMap[p.id] || null,
      })));
    } catch (e) { console.error('predictions:', e); }
  }, [userId]);

  const fetchCountryIntel = useCallback(async () => {
    try {
      const { data } = await supabase.from('ayn_country_intelligence')
        .select('country_code,country_name,intelligence_brief,economy,hot_sectors,opportunities').limit(20);
      if (data) setCountryIntel(data as CountryIntel[]);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchSnapshot(), fetchPredictions(), fetchCountryIntel()]).finally(() => setLoading(false));
    const ch = supabase.channel('wi').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ayn_market_snapshot' }, p => setSnapshot(p.new as MarketSnapshot)).subscribe();
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { supabase.removeChannel(ch); clearInterval(tick); };
  }, [fetchSnapshot, fetchPredictions, fetchCountryIntel]);

  const handleVote = async (predId: string, vote: 'agree' | 'disagree') => {
    if (!userId || votingId) return;
    setVotingId(predId);
    try {
      const existing = predictions.find(p => p.id === predId);
      if (existing?.user_vote === vote) {
        await supabase.from('ayn_prediction_votes').delete().eq('prediction_id', predId).eq('user_id', userId);
      } else {
        await supabase.from('ayn_prediction_votes').upsert({ prediction_id: predId, user_id: userId, vote }, { onConflict: 'prediction_id,user_id' });
      }
      await fetchPredictions();
    } finally { setVotingId(null); }
  };

  const snap = useMemo(() => safeObj(snapshot?.snapshot), [snapshot]);
  const macro = useMemo(() => safeObj(snap.macro), [snap]);
  const stocks = useMemo(() => safeObj(safeObj(snap.markets)?.stocks), [snap]);
  const crypto = useMemo(() => safeObj(safeObj(snap.markets)?.crypto), [snap]);
  const cryptoPrices = useMemo(() => safeObj(crypto.crypto_prices), [crypto]);
  const sentiment = useMemo(() => safeObj(safeObj(snap.markets)?.sentiment), [snap]);
  const briefItems = useMemo(() => safeArr(snap.intelligence_brief), [snap]);
  const sicIntel = useMemo(() => safeObj(snap.sic_intel), [snap]);
  const polymarket = useMemo(() => safeArr(safeObj(snap.prediction_markets)?.prediction_markets), [snap]);

  const tickerItems = useMemo(() => {
    const items: { label: string; value: string; change?: number }[] = [];
    Object.entries(cryptoPrices).forEach(([sym, d]: [string, any]) =>
      items.push({ label: sym, value: `$${Number(d.price).toLocaleString()}`, change: parseFloat(d.change_24h_pct || '0') }));
    const fedRate = safeObj(macro.fed_funds_rate);
    const t10 = safeObj(macro.treasury_10yr);
    const yc = safeObj(macro.yield_curve);
    if (fedRate.value) items.push({ label: 'FED RATE', value: `${fedRate.value}%` });
    if (t10.value) items.push({ label: '10Y YIELD', value: `${t10.value}%` });
    if (yc.signal) items.push({ label: 'YIELD CURVE', value: yc.signal });
    if (sentiment.value) items.push({ label: 'FEAR & GREED', value: `${sentiment.value} · ${sentiment.classification || ''}` });
    return items;
  }, [cryptoPrices, macro, sentiment]);

  const filteredPreds = useMemo(() => {
    const seen = new Set<string>();
    return predictions
      .filter(p => p.horizon === activeHorizon && (assetFilter === 'all' || p.asset === assetFilter))
      .filter(p => {
        const key = `${p.asset}-${p.horizon}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [predictions, activeHorizon, assetFilter]);

  const mapPoints: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [
      { coordinates: [33.0, 48.0], label: 'UKRAINE/RUSSIA', risk: 'critical', category: 'Conflict', detail: 'Active conflict zone' },
      { coordinates: [34.5, 31.5], label: 'GAZA/ISRAEL', risk: 'critical', category: 'Conflict', detail: 'Active conflict zone' },
      { coordinates: [44.2, 15.4], label: 'YEMEN', risk: 'high', category: 'Conflict', detail: 'Houthi maritime disruption' },
      { coordinates: [-74.0, 40.7], label: 'NYSE', risk: 'stable', category: 'Markets', detail: `Fear&Greed: ${sentiment.value || '—'}` },
      { coordinates: [-77.0, 38.9], label: 'FED/DC', risk: 'alert', category: 'Policy', detail: `Rate: ${safeObj(macro.fed_funds_rate).value || '—'}%` },
      { coordinates: [32.3, 30.0], label: 'SUEZ CANAL', risk: 'alert', category: 'Supply Chain', detail: 'Critical corridor' },
      { coordinates: [101.0, 2.5], label: 'MALACCA', risk: 'alert', category: 'Supply Chain', detail: 'Key trade route' },
    ];
    Object.entries(sicIntel).forEach(([code, d]) => {
      const coords = SIC_COORDINATES[code];
      if (!coords) return;
      const data = d as any;
      const hasData = (data.economic_posture?.length > 5) || (data.news?.length > 0);
      pts.push({ id: code, coordinates: coords, label: data.name || code, risk: data.risk_level === 'CRITICAL' ? 'critical' : hasData ? 'alert' : 'stable', category: 'S.I.C.', detail: hasData ? 'Click for dossier →' : code });
    });
    return pts.filter((v, i, arr) => i === arr.findIndex(t => Math.abs(t.coordinates[0] - v.coordinates[0]) < 3 && Math.abs(t.coordinates[1] - v.coordinates[1]) < 3));
  }, [sicIntel, macro, sentiment]);

  const handleMapClick = (pt: MapPoint) => {
    if (!pt.id) return;
    const intel = countryIntel.find(c => ISO2_TO_SIC[c.country_code] === pt.id || c.country_code === pt.id);
    if (intel) setSelectedCountry({ intel, sic: sicIntel[pt.id] || {} });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Globe2 className="w-10 h-10 text-cyan-400 animate-pulse mx-auto" />
        <p className="text-cyan-400 text-[10px] font-mono tracking-[0.3em]">LOADING INTELLIGENCE</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-white/6 bg-black/80 backdrop-blur-xl z-50 h-12 flex items-center">
        <div className="flex items-center justify-between px-4 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,200,0.6)]" />
                <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-25" />
              </div>
              <span className="text-[11px] text-cyan-400 tracking-[0.18em] font-bold">AYN GLOBAL INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[9px] text-white/18 tabular-nums">{format(currentTime, 'HH:mm:ss')} UTC</span>
            {snapshot?.fetched_at && <span className="hidden md:block text-[9px] text-white/15">Updated {timeAgo(snapshot.fetched_at)}</span>}
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/8 border border-emerald-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
            </div>
            <button onClick={() => { setRefreshing(true); Promise.all([fetchSnapshot(), fetchPredictions()]).finally(() => setRefreshing(false)); }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] text-white/35 hover:text-cyan-400 hover:bg-white/4 border border-white/8 transition-all">
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} /> SWEEP
            </button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      {tickerItems.length > 0 && (
        <div className="shrink-0 overflow-hidden border-b border-white/5 bg-black/60 h-7">
          <div className="flex animate-[ticker_90s_linear_infinite] gap-10 items-center h-full px-4 whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-white/25">{item.label}</span>
                <span className="text-white/65 font-semibold">{item.value}</span>
                {item.change !== undefined && (
                  <span className={cn('font-bold', item.change > 0 ? 'text-emerald-400' : item.change < 0 ? 'text-red-400' : 'text-white/20')}>
                    {item.change > 0 ? '▲' : '▼'}{Math.abs(item.change).toFixed(2)}%
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-4 space-y-6">

          {/* ─── OVERVIEW ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
            {/* Map */}
            <div className="bg-black/50 border border-white/6 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,200,255,0.5)]" />
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.15em]">GLOBAL THREAT MAP</span>
                <span className="text-[8px] text-white/18">· click countries for intelligence dossier</span>
              </div>
              <div className="p-2"><HeatMap2D points={mapPoints} height={400} onPointClick={handleMapClick} /></div>
            </div>

            {/* Right: Brief + macro */}
            <div className="space-y-4">
              <div className="bg-black/50 border border-white/6 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-[0.15em]">INTELLIGENCE BRIEF</span>
                </div>
                <div className="p-4 space-y-1">
                  {briefItems.length > 0 ? briefItems.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className={cn('text-[10px] font-mono leading-relaxed py-2 px-3 border-l-2 rounded-r',
                        String(item).toLowerCase().includes('fear') || String(item).includes('⚠')
                          ? 'border-l-red-500/40 text-red-200/55 bg-red-500/3'
                          : 'border-l-emerald-400/25 text-white/50 bg-white/2')}>
                      {String(item)}
                    </motion.div>
                  )) : <p className="text-[10px] text-white/18 text-center py-4 font-mono">Awaiting intelligence sweep...</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 border border-white/6 rounded-xl p-4">
                  <div className="text-[8px] text-white/25 uppercase tracking-wider mb-2 font-mono">Fear & Greed</div>
                  <div className={cn('text-3xl font-mono font-bold',
                    (sentiment.value || 0) <= 25 ? 'text-red-400' : (sentiment.value || 0) <= 45 ? 'text-orange-400' : (sentiment.value || 0) <= 55 ? 'text-amber-400' : 'text-emerald-400')}>
                    {sentiment.value ?? '—'}
                  </div>
                  <div className="text-[9px] text-white/25 mt-0.5 font-mono">{sentiment.classification}</div>
                  <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all',
                      (sentiment.value || 0) <= 25 ? 'bg-red-500' : (sentiment.value || 0) <= 45 ? 'bg-orange-500' : 'bg-emerald-500')}
                      style={{ width: `${sentiment.value || 0}%` }} />
                  </div>
                </div>

                <div className="bg-black/50 border border-white/6 rounded-xl p-4">
                  <div className="text-[8px] text-white/25 uppercase tracking-wider mb-3 font-mono">US Macro</div>
                  <div className="space-y-2">
                    {[
                      { k: 'fed_funds_rate', label: 'Fed Rate', suffix: '%' },
                      { k: 'treasury_10yr', label: '10Y Yield', suffix: '%' },
                      { k: 'yield_curve', label: 'Yield Curve', field: 'signal', suffix: '' },
                    ].map(({ k, label, suffix, field }) => {
                      const d = safeObj(macro[k]);
                      const val = field ? d[field] : d.value;
                      if (!val) return null;
                      return (
                        <div key={k} className="flex justify-between text-[9px] font-mono">
                          <span className="text-white/25">{label}</span>
                          <span className="text-white/65 font-bold">{val}{suffix}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── STOCKS ─── */}
          {(safeArr(stocks.top_gainers).length > 0 || safeArr(stocks.top_losers).length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-mono text-blue-400 font-bold tracking-[0.15em] uppercase">Stock Markets</span>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'TOP GAINERS', data: safeArr(stocks.top_gainers), color: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'from-emerald-500/4' },
                  { title: 'TOP LOSERS',  data: safeArr(stocks.top_losers),  color: 'text-red-400',     border: 'border-red-500/15',     bg: 'from-red-500/4' },
                  { title: 'MOST ACTIVE', data: safeArr(stocks.most_active), color: 'text-blue-400',    border: 'border-blue-500/15',    bg: 'from-blue-500/4' },
                ].map(col => (
                  <div key={col.title} className={cn('bg-black/50 border rounded-xl overflow-hidden', col.border)}>
                    <div className={cn('px-4 py-2.5 border-b text-[9px] font-mono font-bold tracking-wider bg-gradient-to-r to-transparent', col.color, col.border, col.bg)}>{col.title}</div>
                    <div className="divide-y divide-white/4">
                      {col.data.length > 0 ? col.data.map((s: any, i: number) => {
                        const chg = parseFloat(String(s.change_percentage || '0').replace('%', ''));
                        return (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/2 transition-colors">
                            <div>
                              <div className="text-[11px] font-mono font-bold text-white/75">{s.ticker}</div>
                              <div className="text-[8px] text-white/25 truncate max-w-[100px]">{s.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-mono text-white/60">${s.price}</div>
                              <div className={cn('text-[10px] font-mono font-bold', chg > 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {chg > 0 ? '+' : ''}{isNaN(chg) ? s.change_percentage : chg.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        );
                      }) : <p className="text-[10px] text-white/15 text-center py-4">No data</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PREDICTIONS ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono text-purple-400 font-bold tracking-[0.15em] uppercase">AYN Prediction Engine</span>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
              <span className="text-[8px] text-white/18">{filteredPreds.length} active · vote to validate</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex gap-1 bg-black/40 border border-white/8 rounded-lg p-1">
                {(['1_week', '1_month', '1_year'] as const).map(h => (
                  <button key={h} onClick={() => setActiveHorizon(h)}
                    className={cn('px-3 py-1.5 rounded text-[9px] font-mono font-bold transition-all',
                      activeHorizon === h ? 'bg-purple-500/18 text-purple-400 border border-purple-500/25' : 'text-white/25 hover:text-white/50')}>
                    {h === '1_week' ? '1W' : h === '1_month' ? '1M' : '1Y'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-black/40 border border-white/8 rounded-lg p-1 flex-wrap">
                <button onClick={() => setAssetFilter('all')} className={cn('px-2.5 py-1.5 rounded text-[9px] font-mono transition-all', assetFilter === 'all' ? 'bg-white/8 text-white' : 'text-white/25 hover:text-white/50')}>ALL</button>
                {Object.entries(ASSET_META).map(([a, m]) => (
                  <button key={a} onClick={() => setAssetFilter(a)} title={m.label}
                    className={cn('px-2.5 py-1.5 rounded text-[11px] transition-all', assetFilter === a ? 'bg-white/8' : 'text-white/40 hover:text-white/70')}>
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>

            {filteredPreds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPreds.map(p => (
                  <PredictionCard key={p.id} pred={p} onVote={handleVote} userId={userId} voting={votingId === p.id} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/18 text-[11px] font-mono">No predictions for this filter. Try a different horizon or asset.</div>
            )}
          </div>

          {/* ─── POLYMARKET ─── */}
          {polymarket.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-[0.15em] uppercase">Prediction Markets · Polymarket</span>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {polymarket.map((p: any, i: number) => {
                  const prob = p.yes_probability || 0;
                  return (
                    <div key={i} className="bg-black/50 border border-white/6 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-white/60 leading-relaxed mb-3">{p.question}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', prob > 60 ? 'bg-emerald-500' : prob > 40 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(prob, 100)}%` }} />
                        </div>
                        <span className={cn('text-sm font-mono font-bold', prob > 60 ? 'text-emerald-400' : prob > 40 ? 'text-amber-400' : 'text-red-400')}>{prob.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── COUNTRY GRID ─── */}
          {countryIntel.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-[0.15em] uppercase">Country Economic Intelligence</span>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {countryIntel.map(ci => {
                  const econ = ci.economy || {};
                  const g = econ.gdp_growth?.value;
                  const infl = econ.inflation?.value;
                  const unemp = econ.unemployment?.value;
                  return (
                    <button key={ci.country_code}
                      onClick={() => {
                        const sicKey = ISO2_TO_SIC[ci.country_code] || ci.country_code;
                        setSelectedCountry({ intel: ci, sic: sicIntel[sicKey] || {} });
                      }}
                      className="text-left bg-black/50 border border-white/6 rounded-xl p-4 hover:border-cyan-500/20 hover:bg-black/65 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white/75 group-hover:text-white transition-colors">{ci.country_name}</div>
                          <div className="text-[8px] text-white/22 font-mono">{econ.gdp?.formatted || ''}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/18 group-hover:text-cyan-400 transition-colors mt-0.5" />
                      </div>
                      <div className="space-y-1.5">
                        {g != null && (
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-white/28">GDP Growth</span>
                            <span className={cn('font-bold', econ.gdp_growth?.trend === 'rising' ? 'text-emerald-400' : 'text-amber-400')}>{g > 0 ? '+' : ''}{g.toFixed(1)}%</span>
                          </div>
                        )}
                        {infl != null && (
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-white/28">Inflation</span>
                            <span className={cn('font-bold', infl > 5 ? 'text-red-400' : infl > 3 ? 'text-amber-400' : 'text-emerald-400')}>{infl.toFixed(1)}%</span>
                          </div>
                        )}
                        {unemp != null && (
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-white/28">Unemployment</span>
                            <span className="text-white/55 font-bold">{unemp.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-center pb-6 pt-2">
            <div className="text-[7px] font-mono text-white/10 uppercase tracking-wider">
              Sources: FRED · Yahoo Finance · CoinGecko · Fear&Greed · Polymarket · AYN Prediction Engine v8 · World Bank
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCountry && (
          <CountryDossier intel={selectedCountry.intel} sic={selectedCountry.sic} onClose={() => setSelectedCountry(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
      `}</style>
    </div>
  );
}
