// src/features/timetable/hooks/useCalendarEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { listCalendarEvents } from '../services/calendarApi';
import type { CalendarEvent } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_CACHE_KEY = 'calendar_events_cache';
const CALENDAR_CACHE_TS_KEY = 'calendar_events_cache_ts';
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * カレンダーイベントを取得し、再取得用の refetch 関数も返すフック
 */
export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // イベント取得関数
  const fetchEvents = useCallback(
    async (force: boolean = false) => {
      setLoading(true);
      try {
        let items: CalendarEvent[];
        const now = Date.now();
        if (!force) {
          const cached = await AsyncStorage.getItem(CALENDAR_CACHE_KEY);
          const ts = await AsyncStorage.getItem(CALENDAR_CACHE_TS_KEY);
          if (cached && ts && now - parseInt(ts, 10) < SIX_MONTHS_MS) {
            items = JSON.parse(cached);
            setEvents(items);
            setError(null);
            setLoading(false);
            return;
          }
        }
        // fetch fresh from API
        items = await listCalendarEvents();
        // cache results
        await AsyncStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(items));
        await AsyncStorage.setItem(CALENDAR_CACHE_TS_KEY, now.toString());
        setEvents(items);
        setError(null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // マウント時に一度だけ呼ぶ
  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  // refetch として外部から再取得できるように返却
  return { events, loading, error, refetch: () => fetchEvents(true) };
}