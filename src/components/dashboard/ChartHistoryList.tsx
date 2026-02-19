import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Search, History, Loader2, GitCompare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import type { ChartHistoryItem, ChartHistoryFilter, AssetType, PredictionSignal } from '@/types/chartAnalyzer.types';

const signalConfig: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  BULLISH: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  BEARISH: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
  NEUTRAL: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  WAIT: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  BUY: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  SELL: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const assetIcons: Record<string, string> = {
  stock: '📈', crypto: '₿', forex: '💱', commodity: '🏗️', index: '📊',
};

interface Props {
  items: ChartHistoryItem[];
  loading: boolean;
  hasMore: boolean;
  filter: ChartHistoryFilter;
  onFilterChange: (f: ChartHistoryFilter) => void;
  onSelect: (item: ChartHistoryItem) => void;
  onLoadMore: () => void;
  onCompare: (items: [ChartHistoryItem, ChartHistoryItem]) => void;
}

export default function ChartHistoryList({ items, loading, hasMore, filter, onFilterChange, onSelect, onLoadMore, onCompare }: Props) {
  const signals: (PredictionSignal | '')[] = ['', 'BULLISH', 'BEARISH', 'NEUTRAL', 'WAIT'];
  const assetTypes: (AssetType | '')[] = ['', 'stock', 'crypto', 'forex', 'commodity', 'index'];

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCompareMode = () => {
    setCompareMode(prev => !prev);
    setSelected([]);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length !== 2) return;
    const pair = selected.map(id => items.find(i => i.id === id)!).filter(Boolean) as [ChartHistoryItem, ChartHistoryItem];
    if (pair.length === 2) onCompare(pair);
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticker..."
            value={filter.ticker || ''}
            onChange={e => onFilterChange({ ...filter, ticker: e.target.value })}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <select
          value={filter.assetType || ''}
          onChange={e => onFilterChange({ ...filter, assetType: e.target.value as AssetType | '' })}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">All Assets</option>
          {assetTypes.filter(Boolean).map(t => (
            <option key={t} value={t}>{assetIcons[t!] || ''} {t}</option>
          ))}
        </select>
        <select
          value={filter.signal || ''}
          onChange={e => onFilterChange({ ...filter, signal: e.target.value as PredictionSignal | '' })}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">All Signals</option>
          {signals.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Button
          variant={compareMode ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          onClick={toggleCompareMode}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {compareMode ? 'Cancel' : 'Compare'}
        </Button>
      </div>

      {/* Compare Action */}
      {compareMode && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Select 2 analyses to compare ({selected.length}/2)
          </p>
          <Button size="sm" disabled={selected.length !== 2} onClick={handleCompare} className="gap-1.5">
            <GitCompare className="h-3.5 w-3.5" /> Compare Selected
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No analyses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a chart in the Analyze tab to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Cards */}
      {items.map(item => {
        const sig = signalConfig[item.prediction.signal] || signalConfig.NEUTRAL;
        const SigIcon = sig.icon;
        const isSelected = selected.includes(item.id);
        return (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/30'
            }`}
            onClick={() => compareMode ? toggleSelect(item.id) : onSelect(item)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {/* Checkbox in compare mode */}
              {compareMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(item.id)}
                  onClick={e => e.stopPropagation()}
                  disabled={!isSelected && selected.length >= 2}
                />
              )}

              {/* Thumbnail */}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt="Chart"
                  className="w-16 h-12 rounded border border-border object-cover shrink-0"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-xs gap-1">
                    {assetIcons[item.assetType] || '📊'} {item.ticker}
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-2.5 w-2.5" /> {item.timeframe}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {item.prediction.reasoning}
                </p>
              </div>

              {/* Signal + Confidence */}
              <div className="text-right shrink-0">
                <div className={`flex items-center gap-1 justify-end ${sig.color}`}>
                  <SigIcon className="h-4 w-4" />
                  <span className="text-xs font-bold">{item.prediction.signal}</span>
                </div>
                <p className="text-lg font-bold">{item.prediction.confidence}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Load More */}
      {hasMore && items.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Load More
          </Button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
