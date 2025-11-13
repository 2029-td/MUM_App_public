// src/features/timetable/screen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useGoogleAuth from '~/hooks/useGoogleAuth';
import { Chip } from 'react-native-paper';
import CalendarView from './components/Calendar/CalendarView';
import { View, Text, ScrollView, SafeAreaView, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTemplates } from './hooks/useTemplates';
import { useTheme } from './hooks/useTheme';
import { useExams } from './hooks/useExams';
import { usePullToRefreshCalendar } from './hooks/usePullToRefreshCalendar';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useCourseSearch } from './hooks/useCourseSearch';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { AttendanceModal } from './components/Timetable/AttendanceModal';
import { CourseSelectionModal } from './components/Timetable/CourseSelectionModal';
import { TemplateModal } from './components/Timetable/TemplateModal';
import { ExamList, ExamModal } from './components/Exam';
import SearchCourseBox from './components/Timetable/SearchCourseBox';
import { colorPalette } from './constants'; 

import { storageService } from './services/storage';
import { notificationService } from './services/notifications';
import { loadTimetableFromCSV } from './services/timetableCsvParser';

import type { CourseData, Subject, Exam, ActiveTerm } from './types';

export default function Page() {
  const findExistingColor = (timetable: any, day: string, name?: string, professor?: string): string | undefined => {
    const rows = timetable?.[day] || {};
    for (const p of Object.keys(rows)) {
      const s = rows[p];
      if (!s) continue;
      if (s.name === name && (s.professor || '') === (professor || '') && s.color) {
        return s.color;
      }
    }
    return undefined;
  };

  const pickColorBySeed = (seed: string): string => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % colorPalette.length;
    return colorPalette[idx];
  };

  const {
    templates,
    currentTemplateId,
    isLoading: isTemplateLoading,
    getCurrentTemplate,
    setCurrentTemplateId,
    addTemplate,
    deleteTemplate,
    updateSubject,
    updateSubjectMulti,
    setTemplates,
  } = useTemplates();

  const { getCurrentTheme } = useTheme();
  const currentTheme = getCurrentTheme();
  const { theme } = useAppTheme();
  const { colors } = useStyles();

  const {
    exams,
    addExam,
    updateExam,
    deleteExam,
    getAllRegisteredSubjects,
  } = useExams({ currentTemplateId, getCurrentTemplate });

  const { accessToken } = useGoogleAuth();
  const { events, loading: calLoading, error: calError, refetch } = useCalendarEvents();
  const { refreshing, onRefresh } = usePullToRefreshCalendar(refetch);

  useEffect(() => { if (accessToken) refetch(); }, [accessToken]);

  // === 学期（前期/後期のみ） ===
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>('前期');

  // === 状態 ===
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const [examDate, setExamDate] = useState<Date>(new Date());
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState<boolean>(false);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState<boolean>(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState<boolean>(false);
  const [isExamModalVisible, setIsExamModalVisible] = useState<boolean>(false);

  // 初期化
  useEffect(() => { initializeApp(); }, []);

  const initializeApp = async () => {
    try {
      setIsDataLoading(true);
      await notificationService.requestPermissions();

      const existingTemplates = await storageService.getTemplates();
      if (!existingTemplates || existingTemplates.length === 0) {
        const emptyTimetable = {};
        await addTemplate('デフォルト時間割', emptyTimetable);
        const updatedTemplates = await storageService.getTemplates();
        await setTemplates(updatedTemplates);
        const firstId = updatedTemplates[0]?.id;
        if (firstId) {
          await setCurrentTemplateId(firstId);
          await storageService.saveCurrentTemplateId(firstId);
        }
      } else {
        await setTemplates(existingTemplates);
        const currentId = await storageService.getCurrentTemplateId();
        await setCurrentTemplateId(currentId);
      }

      // 学期の復元（前期/後期のみ）
      const savedTerm = await storageService.getActiveTerm();
      setActiveTerm(savedTerm);

      // CSVから候補を読み込み
      const classes = await loadTimetableFromCSV();
      setCourseData(classes);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('エラー', 'アプリの初期化中にエラーが発生しました');
    } finally {
      setIsDataLoading(false);
    }
  };

  // === 学期フィルタ：前期→(前期/通年), 後期→(後期/通年) を表示 ===
  const coursesByActiveTerm = useMemo(() => {
    return courseData.filter(c => {
      if (activeTerm === '前期') return c.履修期 === '前期' || c.履修期 === '通年';
      // '後期'
      return c.履修期 === '後期' || c.履修期 === '通年';
    });
  }, [courseData, activeTerm]);

  // 検索（学期で絞って渡す）
  const { query, setQuery, results } = useCourseSearch(
    coursesByActiveTerm,
    selectedDay,
    selectedPeriod
  );

  // コマ候補も学期で絞る
  const courseCandidatesForModal = useMemo(() => {
    return coursesByActiveTerm.filter(
      course =>
        course.曜日 === selectedDay &&
        course.時限.split(',').map(s => s.trim()).includes(String(selectedPeriod))
    );
  }, [coursesByActiveTerm, selectedDay, selectedPeriod]);

  const handleAttendanceUpdate = useCallback(
    async (type: 'attendance' | 'absence' | 'late') => {
      const template = getCurrentTemplate();
      if (!template) return;

      const day = selectedDay;
      const period = String(selectedPeriod);

      const templates = await storageService.getTemplates();
      const fresh = templates.find(t => t.id === template.id);
      const current: Subject | undefined = fresh?.timetable?.[day]?.[period];
      if (!current) return;

      const cap = current.totalClasses && current.totalClasses > 0 ? current.totalClasses : 15;
      const total = (current.attendance ?? 0) + (current.absence ?? 0) + (current.late ?? 0);
      if (total >= cap) return;

      const next: Subject = { ...current, [type]: (current[type] ?? 0) + 1 };

      await updateSubject(template.id, day, period, next);
      const updatedTemplates = await storageService.getTemplates();
      await setTemplates(updatedTemplates);
      setSelectedSubject(next);
    },
    [getCurrentTemplate, selectedDay, selectedPeriod, updateSubject, setTemplates]
  );

  return (
    isTemplateLoading || isDataLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    ) : (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[currentTheme.backgroundColor, currentTheme.backgroundColor]} style={styles.gradientBackground}>
          <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
              {/* ヘッダー */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: currentTheme.textColor }]}>時間割表</Text>
                <View style={styles.headerButtons}>
                <Chip
                  mode="flat"
                  compact
                  style={{
                    backgroundColor: getCurrentTheme().cellBackgroundColor, // ← 曜日ヘッダーと同じ背景
                    borderWidth: 0,                                  // ← 枠なしで統一
                  }}
                  textStyle={{
                    color: getCurrentTheme().textColor,              // ← 文字色もテーマの textColor
                    fontWeight: '600',
                  }}
                  onPress={() => setIsTemplateModalVisible(true)}
                >
                  テンプレート
                </Chip>
                </View>
              </View>

              {/* 検索バー（学期で絞り込み済みの results） */}
              <SearchCourseBox
                value={query}
                onChange={setQuery}
                results={results}
                onSelect={async (course: CourseData) => {
                  const templateId = getCurrentTemplate()?.id;
                  if (!templateId) return;

                  const periods = course.時限.split(',').map(p => p.trim());
                  const timetable = getCurrentTemplate()?.timetable || {};
                  const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
                  const decidedColor =
                    findExistingColor(timetable, course.曜日, course.科目名, course.教員)
                    ?? pickColorBySeed(seed);

                  const subject: Subject = {
                    id: `${course.曜日}-${periods[0]}-${course.科目名}`,
                    name: course.科目名,
                    professor: course.教員,
                    credits: course.単位,
                    term: course.履修期,
                    color: decidedColor,
                    notifications: true,
                    room: course.教室 ?? '',
                    attendance: 0,
                    absence: 0,
                    late: 0,
                    totalClasses: 0,
                    note: course.備考 ?? '',
                  };

                  await updateSubjectMulti(templateId, course.曜日, periods, subject);
                  const updatedTemplates = await storageService.getTemplates();
                  await setTemplates(updatedTemplates);
                }}
              />

              {/* 時間割グリッド */}
              <TimetableGrid
                timetable={getCurrentTemplate()?.timetable || {}}
                theme={currentTheme}
                onCellPress={(day, period) => {
                  setSelectedDay(day);
                  setSelectedPeriod(period);
                  const subject = getCurrentTemplate()?.timetable?.[day]?.[period] ?? null;
                  if (subject) {
                    setSelectedSubject(subject);
                    setIsAttendanceModalVisible(true);
                  } else {
                    setIsCourseModalVisible(true);
                  }
                }}
              />

              <View style={styles.examSection}>
                <ExamList
                  exams={exams}
                  subjects={getAllRegisteredSubjects()}
                  theme={currentTheme}
                  onExamPress={(exam) => { setSelectedExam(exam); setIsExamModalVisible(true); }}
                  onAddPress={() => { setSelectedExam(null); setExamDate(new Date()); setIsExamModalVisible(true); }}
                />
              </View>

              {/* Google カレンダー「今後の予定」 */}
              <View style={styles.calendarSection}>
                <Text style={[styles.calendarTitle, { color: currentTheme.textColor }]}>今後の予定</Text>
                {calLoading && <ActivityIndicator size="small" color={currentTheme.textColor} />}
                {calError && <Text style={[styles.errorText, { color: currentTheme.textColor }]}>予定の取得に失敗しました</Text>}
                <CalendarView events={events} theme={currentTheme} />
              </View>
            </ScrollView>
          </ScrollView>

          {/* コマ候補（学期で絞る） */}
          <CourseSelectionModal
            visible={isCourseModalVisible}
            onClose={() => setIsCourseModalVisible(false)}
            selectedDay={selectedDay}
            selectedPeriod={selectedPeriod}
            courses={courseCandidatesForModal}
            theme={currentTheme}
            onSelect={async (course: CourseData) => {
              const templateId = getCurrentTemplate()?.id;
              if (!templateId) return;

              const periods = course.時限.split(',').map(p => p.trim());
              const timetable = getCurrentTemplate()?.timetable || {};
              const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
              const decidedColor =
                findExistingColor(timetable, course.曜日, course.科目名, course.教員)
                ?? pickColorBySeed(seed);

              const subject: Subject = {
                id: `${selectedDay}-${periods[0]}-${course.科目名}`,
                name: course.科目名,
                professor: course.教員,
                credits: course.単位,
                term: course.履修期,
                color: decidedColor,
                notifications: true,
                room: course.教室 ?? '',
                attendance: 0,
                absence: 0,
                late: 0,
                totalClasses: 0,
                note: course.備考 ?? '',
              };

              await updateSubjectMulti(templateId, course.曜日, periods, subject);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setIsCourseModalVisible(false);
            }}
          />

          {/* 出席モーダル */}
          <AttendanceModal
            visible={isAttendanceModalVisible}
            subject={selectedSubject}
            onClose={() => setIsAttendanceModalVisible(false)}
            onUpdate={handleAttendanceUpdate}
            onDelete={async () => {
              const template = getCurrentTemplate();
              const templateId = template?.id;
              if (!templateId) return;

              const templates = await storageService.getTemplates();
              const idx = templates.findIndex(t => t.id === templateId);
              if (idx < 0) return;

              const day = selectedDay;
              const period = String(selectedPeriod);

              const tt = { ...(templates[idx].timetable || {}) };
              tt[day] = { ...(tt[day] || {}) };

              const target = tt[day]?.[period];
              if (!target) return;

              const keysToDelete = new Set<string>([period]);

              if (target.linkGroupId) {
                for (const d of Object.keys(tt)) {
                  for (const p of Object.keys(tt[d] || {})) {
                    if (tt[d][p]?.linkGroupId === target.linkGroupId) keysToDelete.add(p);
                  }
                }
              } else if (Array.isArray(target.linkedPeriods) && target.linkedPeriods.length) {
                for (const p of target.linkedPeriods) keysToDelete.add(String(p));
              } else {
                const same = Object.keys(tt[day] || {}).filter(p => {
                  if (p === period) return true;
                  const s = tt[day][p];
                  return s?.name === target.name && (s?.professor || '') === (target.professor || '');
                });
                same.forEach(p => keysToDelete.add(p));
              }

              for (const k of keysToDelete) {
                if (tt[day]?.[k]) delete tt[day][k];
              }
              if (tt[day] && Object.keys(tt[day]).length === 0) delete tt[day];

              templates[idx] = { ...templates[idx], timetable: tt };
              await storageService.saveTemplates(templates);
              const refreshed = await storageService.getTemplates();
              await setTemplates(refreshed);

              setSelectedSubject(null);
              setIsAttendanceModalVisible(false);
            }}
            onSubjectUpdate={async (updated) => {
              const templateId = getCurrentTemplate()?.id;
              if (!templateId) return;
              const day = selectedDay;
              const period = String(selectedPeriod);
              await updateSubject(templateId, day, period, updated);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setSelectedSubject(updated);
            }}
          />

          {/* 試験モーダル */}
          <ExamModal
            visible={isExamModalVisible}
            exam={selectedExam}
            examDate={examDate}
            showDatePicker={showDatePicker}
            subjects={getAllRegisteredSubjects()}
            onClose={() => setIsExamModalVisible(false)}
            onSave={async (examData) => {
              if (examData.id) await updateExam(examData as Exam);
              else await addExam(examData);
              setSelectedExam(null);
              setIsExamModalVisible(false);
            }}
            onDelete={async (id) => { await deleteExam(id); setIsExamModalVisible(false); }}
            onDateChange={(date) => setExamDate(date)}
            onDatePickerVisibilityChange={(visible) => setShowDatePicker(visible)}
          />

          {/* テンプレート & 学期モーダル（前期/後期のみ） */}
          <TemplateModal
            visible={isTemplateModalVisible}
            templates={templates}
            currentTemplateId={currentTemplateId}
            onClose={() => setIsTemplateModalVisible(false)}
            onTemplateSelect={async (id) => {
              await setCurrentTemplateId(id);
              await storageService.saveCurrentTemplateId(id);
              const updated = await storageService.getTemplates();
              await setTemplates(updated);
            }}
            onTemplateAdd={async (name) => {
              await addTemplate(name, {});
              const updated = await storageService.getTemplates();
              await setTemplates(updated);
            }}
            onTemplateDelete={async (id) => {
              await deleteTemplate(id);
              const updated = await storageService.getTemplates();
              await setTemplates(updated);
            }}
            onTemplatesUpdate={async () => {
              const updated = await storageService.getTemplates();
              await setTemplates(updated);
            }}
            activeTerm={activeTerm}
            onChangeTerm={async (t) => {
              setActiveTerm(t);
              await storageService.saveActiveTerm(t);
            }}
          />
        </LinearGradient>
      </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  scrollView: { flex: 1 },
  gradientBackground: { flex: 1, padding: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  currentTemplateInfo: { padding: 10, borderRadius: 5, marginBottom: 10 },
  currentTemplateName: { fontSize: 16, textAlign: 'center' },
  examSection: { marginTop: 20, marginBottom: 20 },
  calendarSection: { marginVertical: 20, paddingHorizontal: 10 },
  calendarTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  errorText: { fontSize: 14, marginVertical: 4 },
});
