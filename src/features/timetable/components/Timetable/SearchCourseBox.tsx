import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { CourseData } from '../../types';

interface SearchCourseBoxProps {
  value: string;
  onChange: (query: string) => void;
  results: CourseData[];
  onSelect: (course: CourseData) => void;
}

const SearchCourseBox: React.FC<SearchCourseBoxProps> = ({ value, onChange, results, onSelect }) => {
  const [selectedCourse, setSelectedCourse] = React.useState<CourseData | null>(null);

  return (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        placeholder="授業名を検索"
        value={value}
        onChangeText={(text) => {
          setSelectedCourse(null);
          onChange(text);
        }}
        style={styles.input}
      />
      {selectedCourse ? (
  <View style={styles.detailBox}>
    <Text style={styles.detailText}>科目名：{selectedCourse.科目名}</Text>
    <Text style={styles.detailText}>教員：{selectedCourse.教員}</Text>
    <Text style={styles.detailText}>曜日：{selectedCourse.曜日 ?? '不明'}曜日</Text>
    <Text style={styles.detailText}>時限：{selectedCourse.時限 ?? '不明'}限</Text>
    <Text style={styles.detailText}>教室：{selectedCourse.教室 ?? '未設定'}</Text>

    <TouchableOpacity
      style={styles.registerButton}
      onPress={() => {
        onSelect(selectedCourse);
        setSelectedCourse(null);
        onChange(''); // 検索欄をクリア
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>登録する</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.backButton}
      onPress={() => setSelectedCourse(null)}
    >
      <Text style={{ color: '#000' }}>戻る</Text>
    </TouchableOpacity>
  </View>
) : (
  results.length > 0 && (
    <View style={{ marginTop: 10 }}>
      {results.map((course, index) => (
        <TouchableOpacity
          key={`${course.科目名}-${course.教員}-${index}`} // 🔑 index でユニークにする
          onPress={() => setSelectedCourse(course)}
          style={styles.resultItem}
        >
          <Text>{course.科目名}（{course.教員}）</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
)}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  resultItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  detailBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default SearchCourseBox;