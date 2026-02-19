import { Camera, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface TimelineEntry {
  id: string;
  type: 'analysis' | 'trade_open' | 'trade_close';
  timestamp: string;
  summary: string;
  detail?: string;
  signal?: string;
  positive?: boolean;
  analysisId?: string;
}

interface ActivityTimelineProps {
  entries: TimelineEntry[];
  onAnalysisClick?: (analysisId: string) => void;
}

function getIcon(type: TimelineEntry['type'], signal?: string, positive?: boolean) {
  switch (type) {
    case 'analysis':
      return <Camera className="h-3.5 w-3.5 text-blue-400" />;
    case 'trade_open':
      return signal === 'SELL'
        ? <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
        : <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />;
    case 'trade_close':
      return positive
        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        : <XCircle className="h-3.5 w-3.5 text-red-500" />;
  }
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ActivityTimeline({ entries, onAnalysisClick }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet. Analyze a chart or start paper trading to see events here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Activity Timeline
          <Badge variant="secondary" className="text-[10px]">{entries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[280px]">
          <div className="divide-y divide-border/30">
            {entries.map((entry) => (
              <button
                key={`${entry.type}-${entry.id}`}
                onClick={() => {
                  if (entry.type === 'analysis' && entry.analysisId && onAnalysisClick) {
                    onAnalysisClick(entry.analysisId);
                  }
                }}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                  entry.type === 'analysis' && onAnalysisClick ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(entry.type, entry.signal, entry.positive)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{entry.summary}</p>
                  {entry.detail && (
                    <p className="text-[11px] text-muted-foreground truncate">{entry.detail}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {formatTime(entry.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
