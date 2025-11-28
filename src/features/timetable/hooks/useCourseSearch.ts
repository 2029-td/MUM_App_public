// src/features/timetable/hooks/useCourseSearch.ts
import { useState, useMemo } from 'react';
import type { CourseData } from '../types';

export const useCourseSearch = (
  courses: CourseData[],
) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) {
      // 何も入力してないときは全部返す
      return courses;
    }

    const q = query.trim();

    return courses.filter(course =>
      course.科目名.includes(q) ||
      course.教員.includes(q)
    );
  }, [courses, query]);

  return { query, setQuery, results };
};
