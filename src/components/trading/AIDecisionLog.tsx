import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PaperTrade {
  id: string;
  ticker: string;
  signal: string;
  entry_price: number;
  entry_time: string;
  exit_price: number | null;
  pnl_dollars: number;
  pnl_percent: number;
  status: string;
  confidence_score: number | null;
  setup_type: string | null;
  reasoning: string | null;
  market_context: any;
  position_sizing_reasoning?: string[];
  fees_paid?: number | null;
  slippage_cost?: number | null;
}

function DecisionRow({ trade }: { trade: PaperTrade }) {
  const [open, setOpen] = useState(false);
  const isClosed = ['CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT'].includes(trade.status);
  const isWin = Number(trade.pnl_dollars) > 0;
  const ctx = trade.market_context;
  const signals: string[] = ctx?.signals || [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-sm">{trade.ticker}</span>
            <Badge variant="outline" className={`text-[10px] ${trade.signal === 'BUY' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
              {trade.signal}
            </Badge>
            {trade.confidence_score && (
              <Badge variant="secondary" className="text-[10px]">
                {trade.confidence_score}%
              </Badge>
            )}
            {trade.setup_type && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {trade.setup_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isClosed && (
              <span className={`text-xs font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                {isWin ? '+' : ''}{Number(trade.pnl_percent).toFixed(2)}%
              </span>
            )}
            {!isClosed && (
              <span className="text-[10px] text-primary animate-pulse">LIVE</span>
            )}
            {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 bg-muted/20 space-y-2 text-xs border-b border-border/30">
          {trade.reasoning && (
            <div>
              <span className="text-muted-foreground font-medium">Reasoning:</span>
              <p className="mt-0.5 text-foreground leading-relaxed">{trade.reasoning}</p>
            </div>
          )}
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {signals.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-normal">{s}</Badge>
              ))}
            </div>
          )}
          {trade.position_sizing_reasoning && trade.position_sizing_reasoning.length > 0 && (
            <div className="mt-1">
              <span className="text-muted-foreground font-medium">Position Sizing:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {trade.position_sizing_reasoning.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">{r}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4 text-muted-foreground pt-1">
            <span>Entry: ${Number(trade.entry_price).toFixed(2)}</span>
            {trade.exit_price && <span>Exit: ${Number(trade.exit_price).toFixed(2)}</span>}
            {ctx?.score && <span>Score: {ctx.score}/100</span>}
            <span>{new Date(trade.entry_time).toLocaleDateString()}</span>
          </div>
          {isClosed && (trade.fees_paid != null || trade.slippage_cost != null) && (
            <div className="flex gap-3 text-muted-foreground/70 pt-1 border-t border-border/20 mt-1">
              {(trade.fees_paid ?? 0) > 0 && (
                <span className="text-[10px]" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>Fees: -${Number(trade.fees_paid).toFixed(2)}</span>
              )}
              {(trade.slippage_cost ?? 0) > 0 && (
                <span className="text-[10px]" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>Slip: -${Number(trade.slippage_cost).toFixed(2)}</span>
              )}
              <span className="text-[10px] text-muted-foreground/50">net after costs</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AIDecisionLog({ trades }: { trades: PaperTrade[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? trades : trades.slice(0, 10);

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI Decision Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No trades yet. Decisions will appear here once AYN executes trades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> AI Decision Log
          <Badge variant="secondary" className="text-[10px]">{trades.length} decisions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.map(trade => (
          <DecisionRow key={trade.id} trade={trade} />
        ))}
        {trades.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-xs text-primary hover:underline"
          >
            {showAll ? 'Show less' : `Show all ${trades.length} decisions`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
