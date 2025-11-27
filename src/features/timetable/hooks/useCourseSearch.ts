// src/features/timetable/hooks/useCourseSearch.ts
import { useState, useEffect } from 'react';
import type { CourseData } from '../types';

export const useCourseSearch = (
  allCourses: CourseData[],
  selectedDay: string,
  selectedPeriod: number,
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseData[]>([]);

  useEffect(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      setResults([]);
      return;
    }

    const filtered = allCourses.filter((course) => {
      // まず、曜日・時限で絞る（今までやっていた処理）
      if (
        selectedDay &&
        selectedPeriod &&
        course.曜日 !== selectedDay
      ) {
        return false;
      }
      if (
        selectedDay &&
        selectedPeriod &&
        !course.時限
          .split(',')
          .map((p) => p.trim())
          .includes(String(selectedPeriod))
      ) {
        return false;
      }

      // 🔍 科目名 or 教員名 でヒットしたものを残す
      const name = (course.科目名 ?? '').toLowerCase();
      const teacher = (course.教員 ?? '').toLowerCase();

      return (
        name.includes(q) ||
        teacher.includes(q)
      );
    });

    setResults(filtered);
  }, [query, allCourses, selectedDay, selectedPeriod]);

  return {
    query,
    setQuery,
    results,
  };
};
