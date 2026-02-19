import { useState } from 'react';
import { useChartHistory } from '@/hooks/useChartHistory';
import ChartHistoryStats from './ChartHistoryStats';
import ChartHistoryList from './ChartHistoryList';
import ChartHistoryDetail from './ChartHistoryDetail';
import ChartCompareView from './ChartCompareView';
import type { ChartHistoryItem, ChartHistoryFilter } from '@/types/chartAnalyzer.types';

interface ChartHistoryTabProps {
  externalHistory?: ReturnType<typeof useChartHistory>;
}

export default function ChartHistoryTab({ externalHistory }: ChartHistoryTabProps = {}) {
  const internalHistory = useChartHistory();
  const history = externalHistory ?? internalHistory;
  const [compareItems, setCompareItems] = useState<[ChartHistoryItem, ChartHistoryItem] | null>(null);

  if (compareItems) {
    return (
      <div className="py-2 space-y-4">
        <ChartCompareView items={compareItems} onBack={() => setCompareItems(null)} />
      </div>
    );
  }

  if (history.selectedItem) {
    return (
      <div className="py-2 space-y-4">
        <ChartHistoryDetail
          item={history.selectedItem}
          onBack={() => history.setSelectedItem(null)}
          onDelete={history.deleteItem}
        />
      </div>
    );
  }

  return (
    <div className="py-2 space-y-4">
      <ChartHistoryStats items={history.items} />
      <ChartHistoryList
        items={history.items}
        loading={history.loading}
        hasMore={history.hasMore}
        filter={history.filter}
        onFilterChange={history.setFilter}
        onSelect={(item) => history.setSelectedItem(item)}
        onLoadMore={history.loadMore}
        onCompare={setCompareItems}
      />
    </div>
  );
}
