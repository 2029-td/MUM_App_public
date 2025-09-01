import type { CalendarEvent } from '../types';
import { getAccessToken } from '~/services/tokenStorage';
// 公開カレンダーを API キーで叩く場合
import Constants from 'expo-constants';

export const CALENDAR_IDS = [
  'c_vagh6pe9q4sl38n5mh81qv0b48@group.calendar.google.com', // 授業等日程（OAuth）
  'ja.japanese#holiday@group.v.calendar.google.com',        // 日本の祝日（公開・APIキー）
];

// env / app.config.js 等で設定しておく
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey as string | undefined;

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('No access token available for calendar fetch');
    return [];
  }

  // 取得期間：今〜1年後
  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const events: CalendarEvent[] = [];

  for (const calendarId of CALENDAR_IDS) {
    const encodedId = encodeURIComponent(calendarId);
    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      timeMin: now,
      timeMax: nextYear,
    });

    // 公開カレンダーは API キーで叩く
    if (
      calendarId === 'ja.japanese#holiday@group.v.calendar.google.com' &&
      GOOGLE_API_KEY
    ) {
      params.set('key', GOOGLE_API_KEY);
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(
          `❌ [${res.status} ${res.statusText}] Failed to fetch calendar ${calendarId}:`,
          body
        );
        // 401→トークン切れならリフレッシュ＆リトライもここで実装可
        continue;
      }

      const data = await res.json();
      if (!Array.isArray(data.items)) {
        console.warn(`⚠️ Unexpected response for ${calendarId}:`, data);
        continue;
      }

      for (const item of data.items) {
        events.push({
          id:      item.id,
          summary: item.summary || '',
          start:   item.start,
          end:     item.end,
          calendarId,
        });
      }
    } catch (err) {
      console.error(`🌐 Network error for calendar ${calendarId}:`, err);
    }
  }

  return events;
}