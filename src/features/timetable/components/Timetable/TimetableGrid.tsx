// src/features/timetable/components/Timetable/TimetableGrid.tsx
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
}

const BORDER_COLOR = '#ccc'; // 常に薄いグレー

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  theme,
  onCellPress,
}) => {
  return (
    <View style={[styles.timetable, { backgroundColor: theme.cellBackgroundColor }]}>
      {/* ヘッダー行 */}
      <View style={[styles.headerRow, { backgroundColor: theme.headerColor }]}>
        <View style={styles.cornerCell} />
        {daysOfWeek.map((day, dayIndex) => (
          <View
            key={day}
            style={[
              styles.headerCell,
              {
                borderColor: BORDER_COLOR,
                // ✅ 最右列（土）の右線は消す
                borderRightWidth: dayIndex === daysOfWeek.length - 1 ? 0 : 1,
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
          {/* 時限セル（左端） */}
          <View
            style={[
              styles.periodCell,
              {
                borderColor: BORDER_COLOR,
                // ✅ 最下段（6限）の下線は消す
                borderBottomWidth: periodIndex === periods.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.periodText, { color: theme.textColor }]}>{period}</Text>
          </View>

          {/* 授業セル */}
          {daysOfWeek.map((day, dayIndex) => {
            const subject = timetable[day]?.[period.toString()];
            return (
              <TouchableOpacity
                key={`${day}-${period}`}
                style={[
                  styles.cell,
                  {
                    backgroundColor: subject ? subject.color : theme.cellBackgroundColor,
                    borderColor: BORDER_COLOR,
                    // ✅ 最右列は右線なし
                    borderRightWidth: dayIndex === daysOfWeek.length - 1 ? 0 : 1,
                    // ✅ 最下段は下線なし
                    borderBottomWidth: periodIndex === periods.length - 1 ? 0 : 1,
                  },
                ]}
                onPress={() => onCellPress(day, period)}
              >
                {subject ? (
                  <View>
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {subject.name}
                    </Text>
                    <Text style={styles.subjectInfo} numberOfLines={2}>
                      {subject.room || '教室未設定'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.addSubjectText, { color: theme.textColor }]}>
                    +
                  </Text>
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
  timetable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
  },
  cornerCell: {
    width: 40,
    padding: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
  },
  headerCell: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    // borderRightWidth は動的に付与
  },
  headerText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
  },
  periodCell: {
    width: 40,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1, // 左端の縦線は残す
    // borderBottomWidth は動的に付与
  },
  periodText: {
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    height: 80,
    padding: 5,
    // borderRightWidth / borderBottomWidth は動的に付与
  },
  subjectName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000',
  },
  subjectInfo: {
    fontSize: 10,
    color: '#333',
  },
  addSubjectText: {
    fontSize: 24,
    textAlign: 'center',
  },
});
