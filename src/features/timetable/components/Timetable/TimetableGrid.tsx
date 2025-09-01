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

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  timetable,
  theme,
  onCellPress,
}) => {
  return (
    <View style={[styles.timetable, { backgroundColor: theme.cellBackgroundColor }]}>
      <View style={[styles.headerRow, { backgroundColor: theme.headerColor }]}>
        <View style={styles.cornerCell} />
        {daysOfWeek.map(day => (
          <View key={day} style={styles.headerCell}>
            <Text style={[styles.headerText, { color: theme.textColor }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {periods.map(period => (
        <View key={period} style={styles.row}>
          <View style={styles.periodCell}>
            <Text style={[styles.periodText, { color: theme.textColor }]}>
              {period}
            </Text>
          </View>
          {daysOfWeek.map(day => {
            const subject = timetable[day]?.[period.toString()];
            return (
              <TouchableOpacity
                key={`${day}-${period}`}
                style={[
                  styles.cell,
                  {
                    backgroundColor: subject 
                      ? subject.color 
                      : theme.cellBackgroundColor
                  }
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCell: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  periodText: {
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    height: 80,
    padding: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subjectName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  subjectInfo: {
    fontSize: 10,
    color: '#333333',
  },
  creditText: {
    fontSize: 10,
    color: '#333333',
  },  
  attendanceText: {
    fontSize: 10,
    color: '#333333',
  },
  addSubjectText: {
    fontSize: 24,
    textAlign: 'center',
  },
});