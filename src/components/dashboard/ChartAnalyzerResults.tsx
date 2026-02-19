import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Newspaper, Target, Shield, Award, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Volume2, Brain, Crosshair, Bell, Bot, Copy, ChevronRight, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ChartAnalysisResult, ChartPattern, PatternBreakdown, PsychologyWarnings, DisciplineReminders, ConfidenceBreakdown, TradingSignal } from '@/types/chartAnalyzer.types';

interface Props {
  result: ChartAnalysisResult;
}

const signalConfig: Record<string, { icon: typeof TrendingUp; color: string; bg: string; label: string }> = {
  BULLISH: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'BULLISH' },
  BEARISH: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'BEARISH' },
  NEUTRAL: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'NEUTRAL' },
  WAIT: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'WAIT' },
  BUY: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'BUY' },
  SELL: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'SELL' },
};

const assetIcons: Record<string, string> = {
  stock: '📈', crypto: '₿', forex: '💱', commodity: '🏗️', index: '📊',
};

const confidenceColors: Record<string, string> = {
  HIGH: 'bg-green-500/15 text-green-500 border-green-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  LOW: 'bg-red-500/15 text-red-500 border-red-500/30',
};

// ─── Copy Bot Config ───
function copyBotConfig(ts: TradingSignal) {
  const trailing = ts.botConfig.trailingStop.enabled
    ? `Trailing: ${ts.botConfig.trailingStop.trailPercent}% after ${ts.botConfig.trailingStop.activateAt}`
    : 'Trailing: Off';
  const config = `SIGNAL: ${ts.action}
ENTRY: ${ts.entry.price} (${ts.entry.orderType})
STOP: ${ts.stopLoss.price} (-${ts.stopLoss.percentage}%)
TP1: ${ts.takeProfits[0]?.price} (+${ts.takeProfits[0]?.percentage}%) - Close ${ts.takeProfits[0]?.closePercent}%
TP2: ${ts.takeProfits[1]?.price} (+${ts.takeProfits[1]?.percentage}%) - Close ${ts.takeProfits[1]?.closePercent}%
BOT CONFIG:
Position: ${ts.botConfig.positionSize}%
Leverage: ${ts.botConfig.leverage}x
R:R: 1:${ts.riskReward}
${trailing}
INVALIDATION: ${ts.invalidation.price} - ${ts.invalidation.condition}`.trim();

  navigator.clipboard.writeText(config);
  toast({ title: 'Copied!', description: 'Bot configuration copied to clipboard' });
}

// ─── Collapsible Section Wrapper ───
function Section({ id, title, icon: Icon, expanded, onToggle, children, badge }: {
  id: string;
  title: string;
  icon: React.ElementType;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const isOpen = expanded[id] || false;
  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle(id)}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" />
            {title}
            {badge}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Sub-components ───

function PatternCard({ pattern }: { pattern: ChartPattern }) {
  const [open, setOpen] = useState(false);
  const confClass = confidenceColors[pattern.confidence] || confidenceColors.MEDIUM;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${confClass}`}>{pattern.confidence}</Badge>
            <span className="text-sm font-medium truncate">{pattern.name.replace(/_/g, ' ')}</span>
            <span className="text-xs text-muted-foreground shrink-0">({pattern.score})</span>
          </div>
          {(pattern.reasoning || pattern.location) && (
            open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CollapsibleTrigger>
      {(pattern.reasoning || pattern.location) && (
        <CollapsibleContent>
          <div className="px-3 py-2 text-xs space-y-1 border-l-2 border-muted ml-3 mt-1">
            {pattern.location && <p className="text-muted-foreground">📍 {pattern.location}</p>}
            {pattern.reasoning && <p className="text-muted-foreground">{pattern.reasoning}</p>}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function PatternBreakdownCard({ breakdown }: { breakdown: PatternBreakdown }) {
  const scoreColor = breakdown.finalScore >= 70
    ? 'bg-green-500/15 text-green-500'
    : breakdown.finalScore >= 55
      ? 'bg-yellow-500/15 text-yellow-500'
      : 'bg-red-500/15 text-red-500';

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-muted/20">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-sm capitalize">{breakdown.name.replace(/_/g, ' ')}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreColor}`}>{breakdown.finalScore}%</span>
      </div>
      <div className="text-xs space-y-1.5">
        <div className="text-muted-foreground">Base: {breakdown.baseScore}%</div>
        {breakdown.adjustments.length > 0 && (
          <div className="text-muted-foreground">
            <span className="font-medium">Adjustments:</span>
            <ul className="ml-3 mt-0.5 space-y-0.5">
              {breakdown.adjustments.map((adj, j) => <li key={j}>• {adj}</li>)}
            </ul>
          </div>
        )}
        <div className="pt-1.5 mt-1.5 border-t border-border/30 space-y-0.5">
          <div className="text-green-600">✓ {breakdown.historicalSuccess}</div>
          <div className="text-red-500">✗ {breakdown.failureMode}</div>
          <div className="text-amber-600">⚠ Invalid if: {breakdown.invalidation}</div>
        </div>
      </div>
    </div>
  );
}

function PsychologyCard({ warnings }: { warnings: PsychologyWarnings }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Market Stage:</span>
        <Badge variant="outline" className="text-[10px] capitalize">{warnings.marketStage}</Badge>
      </div>
      {warnings.crowdPosition && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Crowd:</span>
          <span className="text-xs capitalize">{warnings.crowdPosition}</span>
        </div>
      )}
      <div>
        <span className="text-muted-foreground text-xs font-medium">Emotional Drivers:</span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {warnings.emotionalDrivers.map(emotion => (
            <Badge key={emotion} variant="secondary" className="text-[10px]">{emotion}</Badge>
          ))}
        </div>
      </div>
      {warnings.commonMistakes.length > 0 && (
        <div>
          <span className="text-xs font-medium text-amber-600">⚠️ Common Mistakes:</span>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {warnings.commonMistakes.map((mistake, i) => <li key={i}>• {mistake}</li>)}
          </ul>
        </div>
      )}
      {warnings.contrarian_insight && (
        <div className="pt-2 border-t border-blue-500/20">
          <span className="text-xs font-medium">💡 Contrarian Insight:</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{warnings.contrarian_insight}</p>
        </div>
      )}
    </div>
  );
}

function ConfidenceBreakdownDisplay({ breakdown }: { breakdown: ConfidenceBreakdown }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">Why this confidence?</p>
      <div className="text-xs space-y-0.5">
        <div>• Technical score: <span className="font-medium">{breakdown.technicalScore}</span></div>
        <div>• News score: <span className="font-medium">{breakdown.newsScore}</span></div>
        {breakdown.conflictPenalty !== 0 && (
          <div className="text-amber-600">• ⚠️ Conflict penalty: <span className="font-medium">{breakdown.conflictPenalty}%</span></div>
        )}
        <div className="pt-1 border-t border-border/30 text-muted-foreground italic">{breakdown.calculation}</div>
      </div>
      {breakdown.explanation && (
        <p className="text-xs text-muted-foreground mt-1">{breakdown.explanation}</p>
      )}
    </div>
  );
}

function ReasoningDisplay({ text }: { text: string }) {
  const [showFull, setShowFull] = useState(false);
  const isLong = text.length > 180;

  return (
    <div className="mt-3">
      <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${!showFull && isLong ? 'line-clamp-2' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button onClick={() => setShowFull(!showFull)} className="text-xs text-primary hover:underline mt-1">
          {showFull ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function parseRiskReward(rr: string): { ratio: number | null; label: string; color: string } {
  const match = rr.match(/1[:\s]*(\d+\.?\d*)/);
  if (!match) return { ratio: null, label: '', color: '' };
  const ratio = parseFloat(match[1]);
  if (ratio >= 2) return { ratio, label: '✅ Excellent', color: 'text-green-500' };
  if (ratio >= 1.5) return { ratio, label: '✅ Good', color: 'text-green-500' };
  return { ratio, label: '⚠️ Below minimum (need 1:1.5)', color: 'text-amber-500' };
}

// ─── Bot Configuration Card ───
function BotConfigCard({ tradingSignal, disciplineReminders }: { tradingSignal: TradingSignal; disciplineReminders?: DisciplineReminders }) {
  const actionColor = tradingSignal.action === 'BUY' ? 'text-green-500 bg-green-500/10 border-green-500/30'
    : tradingSignal.action === 'SELL' ? 'text-red-500 bg-red-500/10 border-red-500/30'
    : 'text-blue-500 bg-blue-500/10 border-blue-500/30';

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Action Badge */}
        <div className="flex items-center justify-between">
          <div className={`px-4 py-2 rounded-lg border text-lg font-bold ${actionColor}`}>
            {tradingSignal.action}
          </div>
          <button
            onClick={() => copyBotConfig(tradingSignal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Bot Config
          </button>
        </div>

        {/* Entry + Order Type */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">My Entry</p>
            <p className="font-semibold">{tradingSignal.entry.price}</p>
            <p className="text-[10px] text-muted-foreground">{tradingSignal.entry.orderType} • {tradingSignal.entry.timeInForce}</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/5">
            <p className="text-muted-foreground text-xs">My Stop</p>
            <p className="font-semibold text-red-500">{tradingSignal.stopLoss.price}</p>
            <p className="text-[10px] text-red-400">-{tradingSignal.stopLoss.percentage}%</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">Risk/Reward</p>
            <p className="font-semibold">1:{tradingSignal.riskReward}</p>
          </div>
        </div>

        {/* Take Profits */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {tradingSignal.takeProfits.map((tp) => (
            <div key={tp.level} className="p-2 rounded-lg bg-green-500/5">
              <p className="text-muted-foreground text-xs">Take Profit {tp.level}</p>
              <p className="font-semibold text-green-500">{tp.price}</p>
              <p className="text-[10px] text-green-400">+{tp.percentage}% • Close {tp.closePercent}%</p>
            </div>
          ))}
        </div>

        {/* Bot Parameters */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-2 rounded-lg bg-muted/30 text-center">
            <p className="text-muted-foreground text-[10px]">Position</p>
            <p className="font-semibold text-sm">{tradingSignal.botConfig.positionSize}%</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 text-center">
            <p className="text-muted-foreground text-[10px]">Leverage</p>
            <p className="font-semibold text-sm">{tradingSignal.botConfig.leverage}x</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 text-center">
            <p className="text-muted-foreground text-[10px]">Trailing Stop</p>
            <p className="font-semibold text-sm">
              {tradingSignal.botConfig.trailingStop.enabled
                ? `${tradingSignal.botConfig.trailingStop.trailPercent}% @ ${tradingSignal.botConfig.trailingStop.activateAt}`
                : 'Off'}
            </p>
          </div>
        </div>

        {/* Invalidation */}
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-1.5 text-red-500 text-xs font-semibold mb-0.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Invalidation
          </div>
          <p className="text-xs text-red-400">
            Below {tradingSignal.invalidation.price} — {tradingSignal.invalidation.condition}
          </p>
        </div>

        {/* Discipline one-liner merged into Bot Config */}
        {disciplineReminders && (
          <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/30">
            ⚠️ {disciplineReminders.positionSizing} • {disciplineReminders.stopLoss}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NextStepsCard({ result }: Props) {
  const { prediction, technical } = result;
  const isWait = prediction.signal === 'WAIT';

  return (
    <Card className="border border-blue-500/30 bg-blue-500/5">
      <CardContent className="pt-3 pb-3">
        <div className="space-y-1.5 text-xs">
          {isWait ? (
            <div className="grid grid-cols-2 gap-2">
              {technical.resistance.length > 0 && (
                <div className="p-2 rounded-lg bg-green-500/10 text-center">
                  <p className="text-muted-foreground text-[10px]">Bullish alert</p>
                  <p className="font-semibold text-green-500">{technical.resistance[0]}</p>
                </div>
              )}
              {technical.support.length > 0 && (
                <div className="p-2 rounded-lg bg-red-500/10 text-center">
                  <p className="text-muted-foreground text-[10px]">Bearish alert</p>
                  <p className="font-semibold text-red-500">{technical.support[0]}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <p>1. My entry, stop & targets are locked in above.</p>
              <p>2. Stop loss set at {prediction.stop_loss !== 'N/A' ? prediction.stop_loss : 'my level'} — non-negotiable.</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───

export default function ChartAnalyzerResults({ result }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ botconfig: true });

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const signal = signalConfig[result.prediction.signal] || signalConfig.NEUTRAL;
  const SignalIcon = signal.icon;
  const { entryTiming, patternBreakdown, psychologyWarnings, disciplineReminders, confidenceBreakdown, tradingSignal } = result.prediction;
  const volumeAnalysis = result.technical.volumeAnalysis;
  const rrParsed = parseRiskReward(result.prediction.risk_reward || '');

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* ─── Market Context (from Pionex data) ─── */}
      {result.marketContext && (
        <Card className="border-border/50 bg-blue-500/5">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Market Context
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">24h Change</div>
                <div className={`font-bold ${
                  (result.marketContext.priceChange24h ?? 0) > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(result.marketContext.priceChange24h ?? 0) > 0 ? '+' : ''}{(result.marketContext.priceChange24h ?? 0).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">24h Volume</div>
                <div className="font-bold">
                  ${result.marketContext.volume24h ? (result.marketContext.volume24h / 1e6).toFixed(1) + 'M' : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Session</div>
                <div className="font-bold text-xs">{result.marketContext.session}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Volatility</div>
                <div className={`font-bold ${result.marketContext.volatility === 'high' ? 'text-red-500' : 'text-green-500'}`}>
                  {result.marketContext.volatility === 'high' ? 'High' : 'Normal'}
                </div>
              </div>
            </div>
            {result.marketContext.isWeekend && (
              <p className="text-xs text-amber-500 mt-2">⚠️ Weekend trading — lower liquidity</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Scam Warning ─── */}
      {result.scamWarning?.isHighRisk && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Risk Warning ({result.scamWarning.severity})</AlertTitle>
          <AlertDescription>
            {result.scamWarning.flags.map((flag, i) => (
              <div key={i} className="text-xs">{flag}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Quick View: Always Visible ─── */}
      <Card className={`border-2 ${
        result.prediction.signal === 'BUY' || result.prediction.signal === 'BULLISH' ? 'border-green-500/50 bg-green-500/5' :
        result.prediction.signal === 'SELL' || result.prediction.signal === 'BEARISH' ? 'border-red-500/50 bg-red-500/5' :
        'border-blue-500/50 bg-blue-500/5'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${signal.bg}`}>
                <SignalIcon className={`h-8 w-8 ${signal.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${signal.color}`}>
                  {result.prediction.signal === 'BUY' || result.prediction.signal === 'BULLISH'
                    ? `I'M BUYING ${result.ticker}`
                    : result.prediction.signal === 'SELL' || result.prediction.signal === 'BEARISH'
                    ? `I'M SELLING ${result.ticker}`
                    : `WAITING ON ${result.ticker}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                {assetIcons[result.assetType] || '📊'} {result.ticker}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {result.timeframe}
              </Badge>
              <Badge variant="outline">{result.assetType}</Badge>
            </div>

            <div className="text-center min-w-[100px]">
              <p className="text-sm text-muted-foreground mb-1">Conviction</p>
              <p className="text-3xl font-bold">{result.prediction.confidence}%</p>
              <Progress value={result.prediction.confidence} className="h-2 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {result.prediction.confidence >= 80 ? 'MAX SIZE (3%)' : result.prediction.confidence >= 60 ? 'HALF SIZE (1.5%)' : 'NO TRADE'}
              </p>
            </div>
          </div>

          {/* Reasoning - truncated with show more */}
          <ReasoningDisplay text={result.prediction.reasoning} />

          {/* Confidence Breakdown - collapsible */}
          {confidenceBreakdown && (
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                  <ChevronRight className="h-3 w-3" />
                  <span>Why {result.prediction.confidence}% confidence?</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ConfidenceBreakdownDisplay breakdown={confidenceBreakdown} />
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* ─── Bot Configuration (NEW) ─── */}
      {tradingSignal && (
        <Section id="botconfig" title="My Position" icon={Bot} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="outline" className={`text-[10px] ml-2 ${
            tradingSignal.action === 'BUY' ? 'text-green-500 border-green-500/30' :
            tradingSignal.action === 'SELL' ? 'text-red-500 border-red-500/30' :
            'text-blue-500 border-blue-500/30'
          }`}>{tradingSignal.action}</Badge>}
        >
          <BotConfigCard tradingSignal={tradingSignal} disciplineReminders={disciplineReminders} />
        </Section>
      )}

      {/* ─── Collapsible Sections ─── */}

      {/* Entry Timing */}
      {entryTiming && (
        <Section id="entry" title="Entry Timing" icon={entryTiming.status === 'READY' ? CheckCircle : AlertTriangle} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="outline" className={`text-[10px] ml-2 ${entryTiming.status === 'READY' ? 'text-green-500 border-green-500/30' : 'text-amber-500 border-amber-500/30'}`}>{entryTiming.status}</Badge>}
        >
          <Card className={`border ${entryTiming.status === 'READY' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground mb-3">{entryTiming.reason}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                  <p className="font-semibold text-muted-foreground mb-1">🔥 Aggressive</p>
                  <p>{entryTiming.aggressive}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                  <p className="font-semibold text-muted-foreground mb-1">🛡️ Conservative</p>
                  <p>{entryTiming.conservative}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Psychology Warnings */}
      {psychologyWarnings && (
        <Section id="psychology" title="Psychology Check" icon={Brain} expanded={expanded} onToggle={toggleSection}>
          <Card className="border border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4 pb-4">
              <PsychologyCard warnings={psychologyWarnings} />
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Trade Setup REMOVED - redundant with Bot Config */}

      {/* Pattern Breakdown */}
      {patternBreakdown && patternBreakdown.length > 0 && (
        <Section id="patterns" title="Pattern Analysis (Research-Backed)" icon={Award} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="secondary" className="text-[10px] ml-2">{patternBreakdown.length} patterns</Badge>}
        >
          <div className="space-y-2">
            {patternBreakdown.map((pb, i) => <PatternBreakdownCard key={i} breakdown={pb} />)}
          </div>
        </Section>
      )}

      {/* Technical Analysis */}
      <Section id="technical" title="Technical Analysis" icon={BarChart3} expanded={expanded} onToggle={toggleSection}>
        <Card>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Trend:</span>
              <Badge variant="secondary" className="capitalize">{result.technical.trend}</Badge>
            </div>

            {(!patternBreakdown || patternBreakdown.length === 0) && result.technical.patterns.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-muted-foreground text-xs font-medium">Patterns Detected:</span>
                <div className="space-y-1.5">
                  {result.technical.patterns.map((p, i) => {
                    if (typeof p === 'string') return <Badge key={i} variant="outline" className="text-xs mr-1">{p}</Badge>;
                    return <PatternCard key={i} pattern={p as ChartPattern} />;
                  })}
                </div>
              </div>
            )}

            {result.technical.support.length > 0 && (
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Support:</span>
                <span>{result.technical.support.join(', ')}</span>
              </div>
            )}

            {result.technical.resistance.length > 0 && (
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-red-500" />
                <span className="text-muted-foreground">Resistance:</span>
                <span>{result.technical.resistance.join(', ')}</span>
              </div>
            )}

            {volumeAnalysis && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Volume Analysis</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{volumeAnalysis.trend}</Badge>
                </div>
                {volumeAnalysis.spikes && <p className="text-xs text-muted-foreground">📊 {volumeAnalysis.spikes}</p>}
                {volumeAnalysis.significance && <p className="text-xs text-muted-foreground">✅ {volumeAnalysis.significance}</p>}
              </div>
            )}

            {result.technical.keyObservations && (
              <p className="text-muted-foreground text-xs italic mt-2">{result.technical.keyObservations}</p>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* News Sentiment */}
      {result.news.length > 0 && (
        <Section id="news" title="News Sentiment" icon={Newspaper} expanded={expanded} onToggle={toggleSection}
          badge={<Badge variant="secondary" className="text-[10px] ml-2">
            {result.prediction.overallSentiment > 0 ? '+' : ''}{result.prediction.overallSentiment?.toFixed(2)}
          </Badge>}
        >
          <div className="space-y-2">
            {result.news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                <span className={`shrink-0 mt-0.5 ${item.sentiment > 0.2 ? 'text-green-500' : item.sentiment < -0.2 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {item.sentiment > 0.2 ? '🟢' : item.sentiment < -0.2 ? '🔴' : '🟡'}
                </span>
                <span className="line-clamp-1">{item.title}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Discipline section REMOVED - merged into Bot Config */}

      {/* Next Steps */}
      <Section id="nextsteps" title="My Game Plan" icon={Bell} expanded={expanded} onToggle={toggleSection}>
        <NextStepsCard result={result} />
      </Section>

      {/* Paper Trading Link */}
      <div className="text-center space-y-1">
        <a href="/performance" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Activity className="h-3 w-3" />
          View AYN's live trading performance
        </a>
        <p className="text-[11px] text-muted-foreground italic">
          Paper trading signals — track performance over time
        </p>
      </div>
    </div>
  );
}
