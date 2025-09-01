// src/features/timetable/hooks/useCourseSearch.ts

import { useState, useEffect, useCallback } from 'react';
import type { CourseData } from '../types';

export const useCourseSearch = (
  allCourses: CourseData[],
  selectedDay: string,
  selectedPeriod: number
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseData[]>([]);

  const search = useCallback(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();

    const filtered = allCourses.filter(course => {
      const matchKeyword =
        course.科目名.toLowerCase().includes(lowerQuery) ||
        course.教員.toLowerCase().includes(lowerQuery);

      const matchDay = course.曜日 === selectedDay;
      const matchPeriod = course.時限.split(',').map(s => s.trim()).includes(String(selectedPeriod));

      return matchKeyword && matchDay && matchPeriod;
    });

    setResults(filtered);
  }, [query, allCourses, selectedDay, selectedPeriod]);

  useEffect(() => {
    search();
  }, [query, allCourses, selectedDay, selectedPeriod]);

  return { query, setQuery, results, };
};
