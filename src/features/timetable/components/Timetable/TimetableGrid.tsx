import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { daysOfWeek, periods } from '../../constants';
import type { Subject, Theme } from '../../types';

interface TimetableGridProps {
  timetable: {
    [day: string]: {
      [period: string]: Subject;
    };
  };
  theme: Theme;
  onCellPress: (day: string, period: number) => void;

  // ✅ 追加：表示する曜日を上書きできる
  daysOfWeekOverride?: readonly string[];
}

const BORDER_COLOR = '#ccc';

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  theme,
  onCellPress,
  daysOfWeekOverride,
}) => {
  const displayDays = daysOfWeekOverride ?? daysOfWeek;

  return (
    <View style={[styles.timetable, { backgroundColor: theme.cellBackgroundColor }]}>
      {/* ヘッダー行 */}
      <View style={[styles.headerRow, { backgroundColor: theme.headerColor }]}>
        <View style={styles.cornerCell} />
        {displayDays.map((day, dayIndex) => (
          <View
            key={day}
            style={[
              styles.headerCell,
              {
                borderColor: BORDER_COLOR,
                borderRightWidth: dayIndex === displayDays.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.headerText, { color: theme.textColor }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 各時限の行 */}
      {periods.map((period, periodIndex) => (
        <View key={period} style={styles.row}>
          <View
            style={[
              styles.periodCell,
              {
                borderColor: BORDER_COLOR,
                borderBottomWidth: periodIndex === periods.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.periodText, { color: theme.textColor }]}>{period}</Text>
          </View>

          {/* 授業セル */}
          {displayDays.map((day, dayIndex) => {
            const subject = timetable[day]?.[period.toString()];
            return (
              <TouchableOpacity
                key={`${day}-${period}`}
                style={[
                  styles.cell,
                  {
                    backgroundColor: subject ? subject.color : theme.cellBackgroundColor,
                    borderColor: BORDER_COLOR,
                    borderRightWidth: dayIndex === displayDays.length - 1 ? 0 : 1,
                    borderBottomWidth: periodIndex === periods.length - 1 ? 0 : 1,
                  },
                ]}
                onPress={() => onCellPress(day, period)}
              >
                {subject ? (
                  <View>
                    <Text style={styles.subjectName} numberOfLines={4}>
                      {subject.name}
                    </Text>
                    <Text style={styles.subjectInfo} numberOfLines={2}>
                      {subject.room || '教室未設定'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.addSubjectText, { color: theme.textColor }]}>+</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  timetable: { borderRadius: 10, overflow: 'hidden', flex: 1 },
  headerRow: { flexDirection: 'row', height: 40 },
  cornerCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
  },
  headerCell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerText: { fontWeight: 'bold' },
  row: { flexDirection: 'row', flex: 1, minHeight: 80 },
  periodCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    alignSelf: 'stretch',
  },
  periodText: { fontWeight: 'bold' },
  cell: { flex: 1, padding: 5, justifyContent: 'center' },
  subjectName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000',
    textAlign: 'center',
  },
  subjectInfo: { fontSize: 10, color: '#333', textAlign: 'center' },
  addSubjectText: { fontSize: 24, textAlign: 'center' },
});
