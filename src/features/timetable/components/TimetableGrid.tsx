// src/features/timetable/components/Timetable/TimetableGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Timetable, Theme } from '../types/';

interface Props {
  timetable: Timetable;
  theme: Theme;
  onCellPress: (day: string, period: number) => void;
}

const DAYS = ['月', '火', '水', '木', '金', '土'];
const PERIODS = [1, 2, 3, 4, 5, 6];

export const TimetableGrid: React.FC<Props> = ({ timetable, theme, onCellPress }) => {
  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.row}>
        <View style={styles.headerCell}>
          <Text style={[styles.headerText, { color: theme.textColor }]}>時限＼曜日</Text>
        </View>
        {DAYS.map((day) => (
          <View key={day} style={styles.headerCell}>
            <Text style={[styles.headerText, { color: theme.textColor }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 本体 */}
      {PERIODS.map((period) => (
        <View key={period} style={styles.row}>
          <View style={styles.headerCell}>
            <Text style={[styles.headerText, { color: theme.textColor }]}>{period}</Text>
          </View>
          {DAYS.map((day) => {
            const subject = timetable?.[day]?.[period.toString()];
            return (
              <TouchableOpacity
                key={`${day}-${period}`}
                style={[styles.cell, { backgroundColor: subject?.color || theme.cellBackgroundColor }]}
                onPress={() => onCellPress(day, period)}
              >
                <Text
                  style={[styles.cellText, { color: theme.textColor }]}
                  numberOfLines={2}
                >
                  {subject ? `${subject.name}\n${subject.room || ''}` : '+'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 6,
    borderWidth: 1,
    width: 60,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    padding: 6,
    borderWidth: 1,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
