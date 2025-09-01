// src/features/timetable/components/Calendar/CalendarEventList.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CalendarEvent } from '~/features/timetable/types';
import { getEventColor, formatEventTime } from './utils';

interface Props {
  events: CalendarEvent[];
  theme: { backgroundColor: string; textColor: string };
}

const CalendarEventList: React.FC<Props> = ({ events, theme }) => (
  <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
    {events.length === 0 ? (
      <Text style={[styles.noEvents, { color: theme.textColor }]}>
        予定はありません
      </Text>
    ) : events.map(ev => (
      <View key={ev.id} style={[styles.item, { borderLeftColor: getEventColor(ev.summary) }]}>
        <Text style={[styles.summary, { color: theme.textColor }]}>
          {ev.summary}
        </Text>
        <Text style={[styles.time, { color: theme.textColor }]}>
          {formatEventTime(ev)}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  noEvents: { textAlign: 'center', padding: 16, fontSize: 16 },
  item: { borderLeftWidth: 4, paddingHorizontal: 8, paddingVertical: 6, marginVertical: 2 },
  summary: { fontSize: 14, fontWeight: 'bold' },
  time: { fontSize: 12, marginTop: 2 },
});

export default CalendarEventList;