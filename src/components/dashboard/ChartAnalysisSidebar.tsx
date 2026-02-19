import { useState, useMemo } from 'react';
import { X, History, TrendingUp, TrendingDown, Minus, Search, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';

interface ChartAnalysisSidebarProps {
  items: ChartHistoryItem[];
  loading: boolean;
  selectedItem?: ChartHistoryItem | null;
  onSelect: (item: ChartHistoryItem) => void;
  onViewAll: () => void;
  onClose: () => void;
  // Mobile sheet variant
  open?: boolean;
  mobileMode?: boolean;
}

function SignalBadge({ signal }: { signal: string }) {
  const s = signal?.toUpperCase() || 'NEUTRAL';
  const isBull = s === 'BUY' || s === 'BULLISH' || s === 'LONG';
  const isBear = s === 'SELL' || s === 'BEARISH' || s === 'SHORT';
  return (
    <span className={cn(
      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
      isBull && "bg-emerald-500/15 text-emerald-500",
      isBear && "bg-red-500/15 text-red-500",
      !isBull && !isBear && "bg-muted text-muted-foreground"
    )}>
      {isBull ? '↑' : isBear ? '↓' : '–'} {s}
    </span>
  );
}

function SidebarItem({
  item,
  isActive,
  onClick,
}: {
  item: ChartHistoryItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  }, [item.created_at]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group",
        "hover:bg-muted/70",
        isActive && "bg-amber-500/10 border border-amber-500/20"
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-sm font-semibold truncate flex-1">{item.ticker || 'Unknown'}</span>
        <SignalBadge signal={item.prediction?.signal || 'NEUTRAL'} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {item.timeframe} · {timeAgo}
        </span>
        {item.prediction?.confidence != null && (
          <span className={cn(
            "text-[11px] font-medium",
            item.prediction.confidence >= 70 ? "text-emerald-500" :
            item.prediction.confidence >= 50 ? "text-amber-500" : "text-muted-foreground"
          )}>
            {item.prediction.confidence}%
          </span>
        )}
      </div>
    </button>
  );
}

function SidebarContent({
  items,
  loading,
  selectedItem,
  onSelect,
  onViewAll,
  onClose,
  showClose = true,
}: ChartAnalysisSidebarProps & { showClose?: boolean }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(i => i.ticker?.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">Past Analyses</span>
          {items.length > 0 && (
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-medium">
              {items.length}
            </span>
          )}
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by ticker..."
            className="text-xs bg-transparent outline-none placeholder:text-muted-foreground/60 flex-1 min-w-0"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {search ? 'No matching analyses' : 'No analyses yet'}
          </div>
        ) : (
          filtered.map(item => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={selectedItem?.id === item.id}
              onClick={() => onSelect(item)}
            />
          ))
        )}
      </div>

      {/* View All footer */}
      {items.length > 0 && (
        <div className="shrink-0 px-3 py-2 border-t border-border/50">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 transition-colors py-1"
          >
            View all in History
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChartAnalysisSidebar(props: ChartAnalysisSidebarProps) {
  if (props.mobileMode) {
    return (
      <Sheet open={props.open} onOpenChange={open => { if (!open) props.onClose(); }}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Past Analyses</SheetTitle>
          </SheetHeader>
          <SidebarContent {...props} showClose={false} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-[260px] shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-sm flex flex-col h-full">
      <SidebarContent {...props} />
    </div>
  );
}
