import type { CourseData } from '../types';

export const flattenParsedClasses = (parsed: Record<string, any>): CourseData[] => {
  const result: CourseData[] = [];

  Object.entries(parsed).forEach(([dayPeriod, classes]) => {
    const day = dayPeriod[0]; // 例: '月3' → '月'
    const period = dayPeriod.slice(1); // 例: '月3' → '3'

    (classes as CourseData[]).forEach((course) => {
      result.push({
        ...course,
        曜日: day,
        時限: period,
        曜日時限: `${day}${period}`, // これは保持してもOK
      });
    });
  });

  return result;
};
