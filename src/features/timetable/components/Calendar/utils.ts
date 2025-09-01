// src/features/timetable/components/Calendar/utils.ts

import type { CalendarEvent } from '~/features/timetable/types';
import { CALENDAR_IDS } from '~/features/timetable/services/calendarApi'; // 祝日カレンダーID取得
import { CalendarColors } from '~/features/timetable/constants'; 
// → constants/index.ts に色を定義しておく

export function getEventColor(summary: string): string {
  if (summary.includes('休校日'))            return CalendarColors.holiday;
  if (summary.includes('休日授業実施日'))  return CalendarColors.classHoliday;
  if (['前期授業開始','前期授業終了','後期授業開始','後期授業終了']
        .some(k => summary.includes(k)))  return CalendarColors.term;
  if (summary.includes('祝日'))              return CalendarColors.japaneseHoliday;
  return CalendarColors.default;
}

export function formatEventTime(event: CalendarEvent): string {
  const s = event.start.dateTime ?? event.start.date;
  const e = event.end.dateTime   ?? event.end.date;
  const t1 = s.includes('T') ? s.split('T')[1].slice(0,5) : '';
  const t2 = e.includes('T') ? e.split('T')[1].slice(0,5) : '';
  return t1 && t2 ? `${t1} - ${t2}` : '';
}

export function convertEventsToMarkedDates(events: CalendarEvent[]) {
  const holidayCalendarId = CALENDAR_IDS[1]; // index 1 = 日本の祝日
  return events.reduce<Record<string, { dots: { key: string; color: string }[] }>>((acc, ev) => {
    const date = (ev.start.dateTime?.split('T')[0] ?? ev.start.date)!;
    const color =
      ev.calendarId === holidayCalendarId
        ? CalendarColors.japaneseHoliday
        : getEventColor(ev.summary);
    if (!acc[date]) {
      acc[date] = { dots: [] };
    }
    acc[date].dots.push({ key: ev.id, color });
    return acc;
  }, {});
}