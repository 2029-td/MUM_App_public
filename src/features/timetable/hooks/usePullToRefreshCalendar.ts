// src/features/timetable/hooks/usePullToRefreshCalendar.ts
import { useState, useCallback } from 'react';

/**
 * 下にプルすると与えられた refetch() を呼ぶフック
 */
export function usePullToRefreshCalendar(
  refetch: () => Promise<void>
) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}