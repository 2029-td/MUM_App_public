// src/features/timetable/components/Calendar/CalendarView.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { CalendarEvent } from '~/features/timetable/types';

interface Props {
  events: CalendarEvent[];
  theme: { backgroundColor: string; textColor: string; headerColor?: string };
}

const CalendarView: React.FC<Props> = ({ theme }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <WebView 
        source={{ uri: "https://calendar.google.com/calendar/embed?src=c_vagh6pe9q4sl38n5mh81qv0b48%40group.calendar.google.com&ctz=Asia%2FTokyo" }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 600,
    marginVertical: 10,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: 600,
  },
});

export default CalendarView;