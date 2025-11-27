// src/features/timetable/components/Timetable/SearchCourseBox.tsx

import React from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { CourseData } from '../../types';

interface Props {
  value: string;
  onChange: (text: string) => void;
  results: CourseData[];
  onSelect: (course: CourseData) => void;
}

const SearchCourseBox: React.FC<Props> = ({
  value,
  onChange,
  results,
  onSelect,
}) => {
  // ここで件数を制限したければ slice する
  const limitedResults = results.slice(0, 20); // 例: 最大20件

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="授業名・教員名で検索"
      />

      {value.length > 0 && limitedResults.length > 0 && (
        <View style={styles.suggestionContainer}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {limitedResults.map((course, index) => (
              <TouchableOpacity
                key={`${course.科目名}-${index}`}
                style={styles.suggestionItem}
                onPress={() => onSelect(course)}
              >
                <Text style={styles.suggestionTitle}>{course.科目名}</Text>
                {!!course.教員 && (
                  <Text style={styles.suggestionSub}>
                    {course.教員}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  suggestionContainer: {
    marginTop: 8,
    maxHeight: 220,         // ★ ここで高さを制限
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
});

export default SearchCourseBox;
