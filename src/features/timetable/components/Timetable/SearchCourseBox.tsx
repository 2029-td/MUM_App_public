// src/features/timetable/components/Timetable/SearchCourseBox.tsx

import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { CourseData } from '../../types';
import { useStyles } from '~/styles';

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
  const { colors } = useStyles();

  // ここで件数を制限したければ slice する
  const limitedResults = results.slice(0, 20); // 例: 最大20件

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.searchBarBg,
            borderColor: colors.searchBarBorder,
            color: colors.searchBarText,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="授業名・教員名で検索"
        placeholderTextColor={colors.searchBarPlaceholder}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      {value.length > 0 && limitedResults.length > 0 && (
        <View
          style={[
            styles.suggestionContainer,
            {
              backgroundColor: colors.searchResultBg,
              borderColor: colors.searchBarBorder,
            },
          ]}
        >
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {limitedResults.map((course, index) => (
              <TouchableOpacity
                key={`${course.科目名}-${index}`}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: colors.searchResultDivider },
                ]}
                onPress={() => onSelect(course)}
                activeOpacity={0.75}
              >
                <Text style={[styles.suggestionTitle, { color: colors.searchBarText }]}>
                  {course.科目名}
                </Text>
                {!!course.教員 && (
                  <Text
                    style={[
                      styles.suggestionSub,
                      { color: colors.searchBarPlaceholder },
                    ]}
                  >
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1, // ★ ライト/ダークで輪郭が出る
  },
  suggestionContainer: {
    marginTop: 8,
    maxHeight: 220, // ★ ここで高さを制限
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  suggestionSub: {
    fontSize: 12,
    marginTop: 3,
  },
});

export default SearchCourseBox;
