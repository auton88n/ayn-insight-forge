import { ArrowLeft, TrendingUp, TrendingDown, Minus, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';

interface Props {
  items: [ChartHistoryItem, ChartHistoryItem];
  onBack: () => void;
}

const signalConfig: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  BULLISH: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  BEARISH: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  NEUTRAL: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  WAIT: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  BUY: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  SELL: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
};

function CompareColumn({ item }: { item: ChartHistoryItem }) {
  const sig = signalConfig[item.prediction.signal] || signalConfig.NEUTRAL;
  const SigIcon = sig.icon;

  return (
    <div className="space-y-3">
      {/* Chart Image */}
      {item.imageUrl && (
        <img src={item.imageUrl} alt="Chart" className="w-full rounded-lg border border-border max-h-48 object-contain" />
      )}

      {/* Ticker & Signal */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">{item.ticker}</Badge>
        <div className={`flex items-center gap-1 ${sig.color}`}>
          <SigIcon className="h-4 w-4" />
          <span className="text-sm font-bold">{item.prediction.signal}</span>
        </div>
      </div>

      {/* Confidence */}
      <div className="text-center">
        <p className="text-3xl font-bold">{item.prediction.confidence}%</p>
        <p className="text-xs text-muted-foreground">confidence</p>
      </div>

      {/* Trade Setup */}
      {item.prediction.entry_zone !== 'N/A' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-muted/50">
            <p className="text-muted-foreground">Entry</p>
            <p className="font-semibold">{item.prediction.entry_zone}</p>
          </div>
          <div className="p-2 rounded bg-red-500/5">
            <p className="text-muted-foreground">Stop Loss</p>
            <p className="font-semibold text-red-500">{item.prediction.stop_loss}</p>
          </div>
          <div className="p-2 rounded bg-green-500/5">
            <p className="text-muted-foreground">Take Profit</p>
            <p className="font-semibold text-green-500">{item.prediction.take_profit}</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="text-muted-foreground">R/R</p>
            <p className="font-semibold">{item.prediction.risk_reward}</p>
          </div>
        </div>
      )}

      {/* Patterns */}
      {item.technical.patterns.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.technical.patterns.map((p, i) => {
            const name = typeof p === 'string' ? p : (p as any)?.name || '';
            const conf = typeof p === 'object' ? (p as any)?.confidence : null;
            const confClass = conf === 'HIGH' ? 'border-green-500/30 text-green-600' : conf === 'LOW' ? 'border-red-500/30 text-red-500' : '';
            return (
              <Badge key={i} variant="outline" className={`text-[10px] ${confClass}`}>
                {name.replace(/_/g, ' ')}{conf ? ` (${conf})` : ''}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Trend */}
      <Badge variant="secondary" className="capitalize text-xs">{item.technical.trend}</Badge>
    </div>
  );
}

export default function ChartCompareView({ items, onBack }: Props) {
  const confDelta = Math.abs(items[0].prediction.confidence - items[1].prediction.confidence);
  const sameSignal = items[0].prediction.signal === items[1].prediction.signal;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {sameSignal ? (
            <Badge variant="secondary">Same Signal</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">Different Signals</Badge>
          )}
          <Badge variant="outline">Δ {confDelta}% confidence</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Analysis A</CardTitle>
          </CardHeader>
          <CardContent>
            <CompareColumn item={items[0]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Analysis B</CardTitle>
          </CardHeader>
          <CardContent>
            <CompareColumn item={items[1]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
