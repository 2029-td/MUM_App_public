// src/features/timetable/screen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import useGoogleAuth from '~/hooks/useGoogleAuth';
import { Chip } from 'react-native-paper';
// カレンダー月表示用
import CalendarView from './components/Calendar/CalendarView';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// カスタムフック
import { useTemplates } from './hooks/useTemplates';
import { useTheme } from './hooks/useTheme';
import { useExams } from './hooks/useExams';
import { usePullToRefreshCalendar } from './hooks/usePullToRefreshCalendar';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useCourseSearch } from './hooks/useCourseSearch';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

// コンポーネント
import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { AttendanceModal } from './components/Timetable/AttendanceModal';
import { CourseSelectionModal } from './components/Timetable/CourseSelectionModal';
import { TemplateModal } from './components/Timetable/TemplateModal';
import { ExamList, ExamModal } from './components/Exam';
import SearchCourseBox from './components/Timetable/SearchCourseBox';

// サービス
import { storageService } from './services/storage';
import { notificationService } from './services/notifications';
import { loadTimetableFromCSV } from './services/timetableCsvParser';

// 型とconstantsとutils
import type { CourseData, Subject, Exam, CalendarEvent } from './types';
import { useMemo } from 'react';

export default function TimetablePage() {
  // カスタムフックの初期化
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
    deleteSubject,
    setTemplates,
  } = useTemplates();

  const { currentThemeId, getCurrentTheme, updateTheme } = useTheme();
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

  // Google認証
  const { signIn, accessToken, loading: authLoading } = useGoogleAuth();

  // Google カレンダーイベント取得（pull-to-refresh hookに統合）
  const { events, loading: calLoading, error: calError, refetch } = useCalendarEvents();
  const { refreshing, onRefresh } = usePullToRefreshCalendar(refetch);

  // Googleログイン後にカレンダー再取得
  useEffect(() => {
    if (accessToken) {
      refetch();
    }
  }, [accessToken]);

  // 状態管理
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // 試験関連の状態
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // モーダルの状態
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState<boolean>(false);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState<boolean>(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState<boolean>(false);
  const [isExamModalVisible, setIsExamModalVisible] = useState<boolean>(false);

  // 検索機能
  const { query, setQuery, results } = useCourseSearch(courseData, selectedDay, selectedPeriod);
  
  useEffect(() => {
    setFilteredCourses(results);
  }, [results]);  

  const courseCandidatesForModal = useMemo(() => {
    return courseData.filter(
      course =>
        course.曜日 === selectedDay &&
        course.時限.split(',').map(s => s.trim()).includes(String(selectedPeriod))
    );
  }, [courseData, selectedDay, selectedPeriod]);  

  // 初期化
  useEffect(() => {
    initializeApp();
  }, []);

  // 初期化処理も更新
  const initializeApp = async () => {
    try {
      setIsDataLoading(true);
      await notificationService.requestPermissions();
      const existingTemplates = await storageService.getTemplates();
      if (!existingTemplates || existingTemplates.length === 0) {
        // ✅ 空の時間割テンプレートを作成
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
  
      // ✅ CSVから候補を読み込む（登録はしない）
      const classes = await loadTimetableFromCSV();
      setCourseData(classes);
  
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('エラー', 'アプリの初期化中にエラーが発生しました');
    } finally {
      setIsDataLoading(false);
    }
  };

  return (
    isTemplateLoading || isDataLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    ) : (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[getCurrentTheme().backgroundColor, getCurrentTheme().backgroundColor]}
          style={styles.gradientBackground}
        >
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <ScrollView
              style={styles.scrollView}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {/* ヘッダー部分 */}
              <View style={styles.header}> 
                <Text style={[styles.title, { color: getCurrentTheme().textColor }]}>
                  時間割表
                </Text>
                <View style={styles.headerButtons}>
                  <Chip
                    mode="flat"
                    compact
                    style={{
                      backgroundColor: colors.surfaceSolid,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    textStyle={{ color: theme.textColor }}
                    onPress={() => setIsTemplateModalVisible(true)}
                  >
                    <Text style={{ color: theme.textColor }}>テンプレート</Text>
                  </Chip>
                </View>
              </View>

              {/* 現在のテンプレート情報 */}
              <View style={styles.currentTemplateInfo}>
                <Text style={[styles.currentTemplateName, { color: getCurrentTheme().textColor }]}>
                  現在のテンプレート: {getCurrentTemplate()?.name || '未設定'}
                </Text>
              </View>

              {/* 検索バー */}
              <SearchCourseBox
                value={query}
                onChange={setQuery}
                results={results}
                onSelect={async (course: CourseData) => {
                  const templateId = getCurrentTemplate()?.id;
                  if (!templateId) return;
                  const periods = course.時限.split(',').map(p => p.trim());
                  const subject: Subject = {
                    id: `${course.曜日}-${periods[0]}-${course.科目名}`, // 先頭時限を使う
                    name: course.科目名,
                    professor: course.教員,
                    credits: course.単位,
                    term: course.履修期,
                    color: '',
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
                  setQuery(''); // 「登録する」ボタンを押すと検索バーをクリア
                  setIsCourseModalVisible(false);
                }}          
              />

              {/* 時間割グリッド */}
              <TimetableGrid
                timetable={getCurrentTemplate()?.timetable || {}}
                theme={getCurrentTheme()}
                onCellPress={(day, period) => {
                  setSelectedDay(day);
                  setSelectedPeriod(period);
                  const subject = getCurrentTemplate()?.timetable?.[day]?.[period] ?? null;
                  if (subject) {
                    setSelectedSubject(subject);
                    setIsAttendanceModalVisible(true); // 登録済み → 出席モーダルを表示
                  } else {
                    setIsCourseModalVisible(true); // 未登録 → 授業候補モーダルを表示
                  }
                }}
              />

              <View style={styles.examSection}>
              <ExamList
                exams={exams}
                subjects={getAllRegisteredSubjects()}
                theme={getCurrentTheme()}
                onExamPress={(exam) => {
                  setSelectedExam(exam);
                  setIsExamModalVisible(true); // 編集用モーダルを開く
                }}
                onAddPress={() => {
                  setSelectedExam(null); // 新規登録モード
                  setExamDate(new Date()); // 初期日付設定（必要なら）
                  setIsExamModalVisible(true); // ✅ モーダル表示
                }}
              />
              </View>

               {/* Google カレンダー「今後の予定」セクション */}
              <View style={styles.calendarSection}>
                <Text style={[styles.calendarTitle, { color: currentTheme.textColor }]}>今後の予定</Text>
                {calLoading && <ActivityIndicator size="small" color={currentTheme.textColor} />}
                {calError && (
                  <Text style={[styles.errorText, { color: currentTheme.textColor }]}>
                    予定の取得に失敗しました
                  </Text>
                )}
                <CalendarView events={events} theme={currentTheme} />
              </View>
            </ScrollView>
          </ScrollView>
          <CourseSelectionModal
            visible={isCourseModalVisible}
            onClose={() => setIsCourseModalVisible(false)}
            selectedDay={selectedDay}
            selectedPeriod={selectedPeriod}
            courses={courseCandidatesForModal}
            theme={getCurrentTheme()}
            onSelect={async (course: CourseData) => {
              const templateId = getCurrentTemplate()?.id;
              if (!templateId) return;
            
              const subject: Subject = {
                id: `${selectedDay}-${course.時限}-${course.科目名}`,
                name: course.科目名,
                professor: course.教員,
                credits: course.単位,
                term: course.履修期,
                color: '',
                notifications: true,
                room: course.教室 ?? '',
                attendance: 0,
                absence: 0,
                late: 0,
                totalClasses: 0,
                note: course.備考 ?? '',
              };
            
              const periods = course.時限.split(',').map(p => p.trim());
              await updateSubjectMulti(templateId, course.曜日, periods, subject);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setIsCourseModalVisible(false);
            }}            
          />

          {/* モーダル類 */}
          <AttendanceModal
            visible={isAttendanceModalVisible}
            subject={selectedSubject}
            onClose={() => setIsAttendanceModalVisible(false)}
            onUpdate={(type) => {
              if (!selectedSubject) return;
              const templateId = getCurrentTemplate()?.id;
              const day = selectedDay;
              const period = String(selectedPeriod);
              const updatedSubject = { ...selectedSubject };
              updatedSubject[type] += 1;
              updateSubject(templateId, day, period, updatedSubject)
                .then(async () => {
                  const updatedTemplates = await storageService.getTemplates();
                  await setTemplates(updatedTemplates);
                  setSelectedSubject(updatedSubject);
                });
            }}
            onDelete={async () => {
              const templateId = getCurrentTemplate()?.id;
              const day = selectedDay;
              const period = String(selectedPeriod);
              const subjectId = `${day}-${period}-${selectedSubject?.name}`;
              await deleteSubject(templateId, day, period);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setIsAttendanceModalVisible(false);
            }}
            onSubjectUpdate={async (updatedSubject) => {
              const templateId = getCurrentTemplate()?.id;
              const day = selectedDay;
              const period = String(selectedPeriod);

              await updateSubject(templateId, day, period, updatedSubject);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setSelectedSubject(updatedSubject);
            }}
          />
          <TemplateModal
            visible={isTemplateModalVisible}
            onClose={() => setIsTemplateModalVisible(false)}
            templates={templates}
            currentTemplateId={currentTemplateId}
            onTemplateSelect={async (id) => {
              await setCurrentTemplateId(id);
              await storageService.saveCurrentTemplateId(id);
              setIsTemplateModalVisible(false);
            }}
            onTemplateAdd={async (name) => {
              await addTemplate(name);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
            }}
            onTemplateDelete={async (id) => {
              await deleteTemplate(id);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
            }}
            onTemplatesUpdate={async () => {
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
            }}
          />
          <ExamModal
            visible={isExamModalVisible}
            exam={selectedExam}
            examDate={examDate}
            showDatePicker={showDatePicker}
            subjects={getAllRegisteredSubjects()}
            onClose={() => setIsExamModalVisible(false)}
            onSave={async (examData) => {
              if (examData.id) {
                await updateExam(examData as Exam);
              } else {
                await addExam(examData);
              }
              const updated = await getAllRegisteredSubjects();
              setSelectedExam(null);
              setIsExamModalVisible(false);
            }}
            onDelete={async (id) => {
              await deleteExam(id);
              setIsExamModalVisible(false);
            }}
            onDateChange={(date) => setExamDate(date)}
            onDatePickerVisibilityChange={(visible) => setShowDatePicker(visible)}
          />
        </LinearGradient>
      </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  themeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  currentTemplateInfo: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  currentTemplateName: {
    fontSize: 16,
    textAlign: 'center',
  },
  examSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Google カレンダーセクション用スタイル
  calendarSection: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventItem: {
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 14,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
});