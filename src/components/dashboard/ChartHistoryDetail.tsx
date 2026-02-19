import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ChartAnalyzerResults from './ChartAnalyzerResults';
import type { ChartHistoryItem } from '@/types/chartAnalyzer.types';

interface Props {
  item: ChartHistoryItem;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function ChartHistoryDetail({ item, onBack, onDelete }: Props) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive gap-1.5"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {/* Original Chart Image */}
      {item.imageUrl && (
        <Card>
          <CardContent className="pt-6">
            <img
              src={item.imageUrl}
              alt="Original chart"
              className="w-full rounded-lg border border-border max-h-80 object-contain"
            />
          </CardContent>
        </Card>
      )}

      <ChartAnalyzerResults result={item} />
    </div>
  );
}
