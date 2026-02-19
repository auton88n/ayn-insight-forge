import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown, Minus, Hash, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';

interface Props {
  items: ChartHistoryItem[];
}

export default function ChartHistoryStats({ items }: Props) {
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    if (items.length === 0) return null;

    let bullish = 0, bearish = 0, neutral = 0, wait = 0, confSum = 0;
    const tickerMap: Record<string, number> = {};
    const patternMap: Record<string, number> = {};

    for (const item of items) {
      if (item.prediction.signal === 'BULLISH') bullish++;
      else if (item.prediction.signal === 'BEARISH') bearish++;
      else if (item.prediction.signal === 'WAIT') wait++;
      else neutral++;

      confSum += item.prediction.confidence || 0;

      const t = item.ticker || 'N/A';
      tickerMap[t] = (tickerMap[t] || 0) + 1;

      for (const p of item.technical.patterns || []) {
        const name = typeof p === 'string' ? p : (p as any)?.name || String(p);
        patternMap[name] = (patternMap[name] || 0) + 1;
      }
    }

    const total = items.length;
    const topTicker = Object.entries(tickerMap).sort((a, b) => b[1] - a[1])[0];
    const topPattern = Object.entries(patternMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      bullish, bearish, neutral, wait,
      avgConfidence: Math.round(confSum / total),
      topTicker: topTicker ? topTicker[0] : null,
      topPattern: topPattern ? topPattern[0] : null,
    };
  }, [items]);

  if (!stats) return null;

  const pctB = Math.round((stats.bullish / stats.total) * 100);
  const pctBear = Math.round((stats.bearish / stats.total) * 100);
  const pctW = Math.round((stats.wait / stats.total) * 100);
  const pctN = 100 - pctB - pctBear - pctW;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between px-4 py-3 h-auto">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" /> Performance Insights
              <Badge variant="secondary" className="text-xs">{stats.total} analyses</Badge>
            </span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {/* Signal Distribution Bar */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Signal Distribution</p>
              <div className="flex h-3 rounded-full overflow-hidden">
                {pctB > 0 && <div className="bg-green-500" style={{ width: `${pctB}%` }} />}
                {pctW > 0 && <div className="bg-blue-500" style={{ width: `${pctW}%` }} />}
                {pctN > 0 && <div className="bg-yellow-500" style={{ width: `${pctN}%` }} />}
                {pctBear > 0 && <div className="bg-red-500" style={{ width: `${pctBear}%` }} />}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground flex-wrap gap-1">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> {pctB}%</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> {pctW}%</span>
                <span className="flex items-center gap-1"><Minus className="h-3 w-3 text-yellow-500" /> {pctN}%</span>
                <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> {pctBear}%</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
                <p className="text-lg font-bold">{stats.avgConfidence}%</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Hash className="h-3 w-3" /> Top Ticker</p>
                <p className="text-lg font-bold">{stats.topTicker || '—'}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Target className="h-3 w-3" /> Top Pattern</p>
                <p className="text-sm font-bold truncate">{stats.topPattern || '—'}</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">Based on {stats.total} loaded analyses</p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
