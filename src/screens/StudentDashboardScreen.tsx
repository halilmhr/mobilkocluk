import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    Platform,
    TextInput
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { GlassCard } from '../components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { DailyCheckinCard } from '../components/DailyCheckinCard';
import { StudyTimeCard } from '../components/StudyTimeCard';
import { ExamTrendCard } from '../components/ExamTrendCard';
import { StreakCalendar } from '../components/StreakCalendar';
import { HomeworkListCard } from '../components/HomeworkListCard';
import { SubjectProgressCard } from '../components/SubjectProgressCard';
import { DailyQuestionsCard } from '../components/DailyQuestionsCard';
import { useStudentBehavior } from '../hooks/useStudentBehavior';
import { getLocalDateString, SUBJECTS_DATA, EXAM_TYPES, getYouTubeSearchUrl, TYT_SUBJECTS, getSubjectsForTrialExam, getSubjectsDataKey } from '../constants';
import type { SubjectResult, Assignment } from '../types';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'StudentDashboard'>;
};

type MainTab = 'assignments' | 'subjects' | 'dashboard';
type ReportTab = 'deneme' | 'soru' | 'konu' | 'odev';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1115',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
    },
    dashboardContainer: {
        flex: 1,
        backgroundColor: '#0F1115',
    },
    bentoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 24,
    },
    headerTextContainer: {
        flex: 1,
    },
    welcomeLine1: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '500',
    },
    studentNameHeader: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1A1D23',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#00FFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bentoContent: {
        paddingHorizontal: 20,
    },
    streakCard: {
        marginBottom: 20,
        padding: 0,
        minHeight: 280,
    },
    streakCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    streakTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    streakSubtitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '500',
    },
    streakLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
    },
    calendarGrid: {
        padding: 20,
        paddingTop: 0,
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calendarHeaderCell: {
        width: '13%',
        alignItems: 'center',
    },
    calendarHeaderCellText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontWeight: '700',
    },
    calendarDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    calendarDayBox: {
        width: '13%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    calendarDayCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarDayText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '600',
    },
    calendarTodayCircle: {
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.3)',
    },
    calendarDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
    },
    nextTaskCard: {
        marginTop: 12,
        marginBottom: 30,
        minHeight: 140,
        overflow: 'hidden',
    },
    nextTaskContent: {
        zIndex: 1,
        padding: 20,
    },
    nextTaskLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    nextTaskTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 8,
    },
    nextTaskFormulaBg: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 0.1,
    },
    formulaText: {
        color: '#FFFFFF',
        fontSize: 60,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    assignmentInfo: {
        flex: 1,
    },
    assignmentTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    assignmentDesc: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        marginTop: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    assignmentExpContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 12,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderTopWidth: 0,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(0, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    checkboxCompleted: {
        backgroundColor: '#00FFFF',
        borderColor: '#00FFFF',
    },
    checkmark: {
        color: '#000000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noAssignments: {
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    subjectsTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subjectSection: {
        marginBottom: 24,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    subjectProgress: {
        color: 'rgba(0, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#00FFFF',
        borderRadius: 3,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    topicLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    topicCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicCheckboxCompleted: {
        backgroundColor: '#34D399',
        borderColor: '#34D399',
    },
    topicName: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    youtubeButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    youtubeText: {
        color: '#FF4D4D',
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalContent: {
        paddingTop: 16,
    },
    modalContentInner: {
        paddingBottom: 20,
    },
    logInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    logInputLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        flex: 1,
    },
    logInput: {
        width: 80,
    },
    saveButton: {
        marginTop: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    examTypeSelector: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 16,
    },
    examTypeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    examTypeButtonActive: {
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: '#00FFFF',
    },
    examTypeButtonText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 'bold',
    },
    examTypeButtonTextActive: {
        color: '#00FFFF',
    },
    examResultsHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8,
    },
    examResultsHeaderText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    examResultRowNew: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    examResultSubjectNew: {
        flex: 2,
        color: '#FFFFFF',
        fontSize: 13,
    },
    examResultInputContainer: {
        flex: 1,
        marginHorizontal: 4,
    },
    examResultInputSmall: {
        height: 36,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    examResultNet: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 13,
    },
    netPositive: {
        color: '#34D399',
    },
    netNegative: {
        color: '#F87171',
    },
    totalNetContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.3)',
    },
    totalNetLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalNetValue: {
        color: '#00FFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    mainTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeMainTab: {
        borderBottomColor: '#00FFFF',
    },
    mainTabText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    activeMainTabText: {
        color: '#00FFFF',
    },
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        flex: 1,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        marginTop: 4,
    },
    assignmentTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expandArrow: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
    },
});

export const StudentDashboardScreen: React.FC<Props> = ({ navigation }) => {
    const {
        currentUser,
        students,
        logout,
        addDailyLog,
        toggleAssignmentCompletion,
        toggleTopicCompletion,
        addTrialExam,
        addBook,
        deleteBook
    } = useApp();

    const studentData = useMemo(
        () => students.find(s => s.id === currentUser?.id),
        [students, currentUser]
    );

    const {
        hasCheckedInToday,
        hasLoggedStudyTimeToday,
        submitDailyCheckin,
        logStudyTime,
        addExamResult,
        updateTopicStatus,
        logHomeworkCompletion,
        productiveDays,
        currentStreak,
        todayStudyDuration,
        todayTotalQuestions,
        exams: behaviorExams,
        subjectProgress: behaviorProgress,
        logDailyQuestions,
    } = useStudentBehavior(studentData?.id || null);

    // Main navigation state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

    // Old states (preserved to avoid breaking sub-views/handlers)
    const [dailyLogs, setDailyLogs] = useState<Record<string, string>>({});
    const [trialExamType, setTrialExamType] = useState<'TYT' | 'AYT' | 'HEPSİ'>('TYT');
    const [isDailyLogOpen, setDailyLogOpen] = useState(false);
    const [isExamModalOpen, setExamModalOpen] = useState(false);
    const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [isSubjectModalOpen, setSubjectModalOpen] = useState(false);
    const [isBookModalOpen, setBookModalOpen] = useState(false);
    const [examName, setExamName] = useState('');
    const [examResults, setExamResults] = useState<SubjectResult[]>([]);
    const [bookName, setBookName] = useState('');
    const [activeTab, setActiveTab] = useState<MainTab>('dashboard');

    const handleSaveExam = async () => {
        if (!studentData || !examName) {
            Alert.alert('Hata', 'Lütfen deneme adını girin.');
            return;
        }

        const totalCorrect = examResults.reduce((sum, r) => sum + r.correct, 0);
        const totalIncorrect = examResults.reduce((sum, r) => sum + r.incorrect, 0);
        const totalBlank = examResults.reduce((sum, r) => sum + (r.blank || 0), 0);

        try {
            await addTrialExam(studentData.id, {
                name: examName,
                type: trialExamType as any,
                totalCorrect,
                totalIncorrect,
                totalBlank,
                subjectResults: examResults.map(r => ({
                    subject: r.subject,
                    correct: r.correct,
                    incorrect: r.incorrect,
                    blank: r.blank || 0
                }))
            });
            setExamModalOpen(false);
            setExamName('');
            Alert.alert('Başarılı', 'Deneme sonucu kaydedildi.');
        } catch (error) {
            Alert.alert('Hata', 'Deneme kaydedilirken bir hata oluştu.');
        }
    };
    const assignmentsByDate = useMemo(() => {
        if (!studentData) return {};
        const result: Record<string, any[]> = {};
        studentData.assignments.forEach(a => {
            if (!result[a.dueDate]) result[a.dueDate] = [];
            result[a.dueDate].push(a);
        });
        return result;
    }, [studentData?.assignments]);

    const assignmentsForSelectedDay = useMemo(() => {
        const dateString = getLocalDateString(selectedDate);
        return assignmentsByDate[dateString] || [];
    }, [selectedDate, assignmentsByDate]);

    const subjectsForTrialExam = useMemo(() => {
        if (!studentData) return [];
        const defaultSubjects = getSubjectsForTrialExam(studentData.examType, (trialExamType === 'HEPSİ' ? 'TYT' : trialExamType) as any);
        if (!studentData.subjects || studentData.subjects.length === 0) return defaultSubjects;
        if (trialExamType === 'HEPSİ') return studentData.subjects;
        if (studentData.examType !== EXAM_TYPES.TYT_AYT) return studentData.subjects;

        const tytSubjectKeys = Object.keys(TYT_SUBJECTS);
        const aytSubjectKeys = ['Matematik (AYT)', 'Geometri', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)', 'Türk Dili ve Edebiyatı', 'Tarih (AYT)', 'Coğrafya (AYT)', 'Felsefe Grubu'];
        const relevantSubjects = trialExamType === 'TYT' ? tytSubjectKeys : aytSubjectKeys;
        const normalize = (s: string) => s.trim().toLocaleLowerCase('tr-TR');
        const normalizedRelevant = relevantSubjects.map(normalize);

        const filtered = studentData.subjects.filter(s => normalizedRelevant.includes(normalize(s)));
        return filtered.length > 0 ? filtered : studentData.subjects;
    }, [studentData, trialExamType]);

    // Handlers
    const handleLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const handleDailyLogChange = (subject: string, value: string) => {
        setDailyLogs(prev => ({ ...prev, [subject]: value }));
    };

    const renderAssignmentCalendarModal = () => {
        if (!studentData) return null;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayString = getLocalDateString();
        const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
        const calendarDays = [];

        dayNames.forEach(day => {
            calendarDays.push(
                <View key={`header-${day}`} style={styles.calendarHeaderCell}>
                    <Text style={styles.calendarHeaderCellText}>{day}</Text>
                </View>
            );
        });

        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startOffset; i++) {
            calendarDays.push(<View key={`empty-modal-${i}`} style={styles.calendarDayBox} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = getLocalDateString(date);
            const isToday = todayString === dateString;
            const isSelected = getLocalDateString(selectedDate) === dateString;
            const dailyMissions = assignmentsByDate[dateString] || [];

            let dotColor = null;
            if (dailyMissions.length > 0) {
                const allDone = dailyMissions.every(a => a.isCompleted);
                const hasOverdue = dailyMissions.some(a => !a.isCompleted && a.dueDate < todayString);
                dotColor = hasOverdue ? '#EF4444' : allDone ? '#34D399' : '#F59E0B';
            }

            calendarDays.push(
                <TouchableOpacity
                    key={`day-modal-${day}`}
                    style={[
                        styles.calendarDayBox,
                        isSelected && { backgroundColor: '#00FFFF', borderRadius: 14 },
                        isToday && !isSelected && styles.calendarTodayCircle,
                    ]}
                    onPress={() => setSelectedDate(date)}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isSelected && { color: '#000', fontWeight: 'bold' },
                        isToday && !isSelected && { color: '#00FFFF' }
                    ]}>
                        {day}
                    </Text>
                    {dotColor && <View style={[styles.calendarDot, { backgroundColor: dotColor }]} />}
                </TouchableOpacity>
            );
        }

        return <View style={styles.calendarDaysGrid}>{calendarDays}</View>;
    };

    const handleDailyLogSubmit = () => {
        if (!studentData) return;
        const logsData = Object.entries(dailyLogs)
            .map(([subject, questionsSolved]) => ({
                subject,
                questionsSolved: parseInt(String(questionsSolved)) || 0,
            }))
            .filter(log => log.questionsSolved > 0);

        if (logsData.length > 0) {
            addDailyLog(studentData.id, logsData);
            setDailyLogOpen(false);
            setDailyLogs({});
            Alert.alert('Başarılı', 'Günlük soru sayısı kaydedildi!');
        }
    };

    const handleExamResultChange = (index: number, field: 'correct' | 'incorrect' | 'blank', value: number) => {
        setExamResults(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };

    const handleExamSubmit = () => {
        if (!studentData || !examName.trim()) {
            Alert.alert('Hata', 'Lütfen sınav adı girin.');
            return;
        }

        const totalCorrect = examResults.reduce((sum, r) => sum + r.correct, 0);
        const totalIncorrect = examResults.reduce((sum, r) => sum + r.incorrect, 0);
        const totalBlank = examResults.reduce((sum, r) => sum + (r.blank || 0), 0);

        addTrialExam(studentData.id, {
            name: examName,
            type: studentData.examType === EXAM_TYPES.TYT_AYT ? trialExamType : undefined,
            totalCorrect,
            totalIncorrect,
            totalBlank,
            subjectResults: examResults,
        });

        setExamModalOpen(false);
        setExamName('');
        setExamResults([]);
        Alert.alert('Başarılı', 'Deneme sınavı kaydedildi!');
    };

    const handleAddBook = () => {
        if (!studentData || !bookName.trim()) {
            Alert.alert('Hata', 'Lütfen kitap adı girin.');
            return;
        }
        addBook(studentData.id, bookName);
        setBookName('');
        setBookModalOpen(false);
        Alert.alert('Başarılı', 'Kitap eklendi!');
    };

    // Update examResults when modal opens or trialExamType changes
    useEffect(() => {
        if (isExamModalOpen) {
            setExamResults(subjectsForTrialExam.map(subject => ({
                subject,
                correct: 0,
                incorrect: 0,
                blank: 0
            })));
        }
    }, [isExamModalOpen, subjectsForTrialExam]);

    if (!studentData) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    // Sub-renders
    const renderStreakCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayShift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const days: React.ReactNode[] = [];
        const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

        for (let i = 0; i < firstDayShift; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayBox} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = getLocalDateString(date);
            const isToday = getLocalDateString() === dateStr;

            const dayAssignments = assignmentsByDate[dateStr] || [];
            const hasActivity = dayAssignments.length > 0;
            const isCompleted = hasActivity && dayAssignments.every(a => a.isCompleted);
            const isMissed = hasActivity && !isCompleted && new Date(dateStr) < new Date(getLocalDateString());

            days.push(
                <TouchableOpacity
                    key={d}
                    style={styles.calendarDayBox}
                    onPress={() => {
                        setSelectedDate(date);
                        setAssignmentModalOpen(true);
                    }}
                >
                    <View style={[
                        styles.calendarDayCircle,
                        isToday && styles.calendarTodayCircle,
                        isCompleted && { backgroundColor: 'rgba(52, 211, 153, 0.2)' },
                        isMissed && { backgroundColor: 'rgba(248, 113, 113, 0.2)' }
                    ]}>
                        <Text style={[
                            styles.calendarDayText,
                            isToday && { color: '#00FFFF' },
                            isCompleted && { color: '#34D399' },
                            isMissed && { color: '#F87171' }
                        ]}>{d}</Text>
                        {(isCompleted || isMissed) && (
                            <View style={[
                                styles.calendarDot,
                                { backgroundColor: isCompleted ? '#34D399' : '#F87171' }
                            ]} />
                        )}
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.calendarGrid}>
                <View style={styles.calendarHeaderRow}>
                    {dayNames.map(day => (
                        <View key={day} style={styles.calendarHeaderCell}>
                            <Text style={styles.calendarHeaderCellText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.calendarDaysGrid}>{days}</View>
            </View>
        );
    };

    const renderDashboard = () => {
        if (!studentData) return null;

        // Group behavior progress by subject
        const groupedSubjects = behaviorProgress.reduce((acc: any[], curr) => {
            const existingSubject = acc.find(s => s.name === curr.subject);
            if (existingSubject) {
                existingSubject.topics.push({ id: curr.id, name: curr.topic, status: curr.status });
            } else {
                acc.push({
                    name: curr.subject,
                    topics: [{ id: curr.id, name: curr.topic, status: curr.status }]
                });
            }
            return acc;
        }, []);

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Header */}
                <View style={[styles.bentoHeader, { marginBottom: 20 }]}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.welcomeLine1}>Hoş Geldin,</Text>
                        <Text style={styles.studentNameHeader}>{studentData.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{studentData.name.charAt(0)}</Text>
                    </TouchableOpacity>
                </View>

                {/* 1. Daily Check-in */}
                <DailyCheckinCard
                    hasCheckedInToday={hasCheckedInToday}
                    onSubmit={submitDailyCheckin}
                />

                <StudyTimeCard
                    hasLoggedToday={hasLoggedStudyTimeToday}
                    selectedDuration={todayStudyDuration as any}
                    onSelect={logStudyTime}
                />

                {/* 5. Daily Questions */}
                <DailyQuestionsCard
                    subjects={studentData.subjects}
                    onSave={logDailyQuestions}
                />

                {/* 2. Homework Interaction */}
                <HomeworkListCard
                    assignments={studentData.assignments}
                    onComplete={(id, difficulty) => {
                        const assignment = studentData.assignments.find(a => a.id === id);
                        if (assignment) {
                            logHomeworkCompletion(id, assignment.title, assignment.dueDate, difficulty);
                            toggleAssignmentCompletion(studentData.id, id);
                        }
                    }}
                />

                {/* 4. Exam Trend */}
                <ExamTrendCard
                    exams={behaviorExams}
                    onAddPress={() => {
                        const typeForSubjects = trialExamType === 'HEPSİ' ? 'TYT' : trialExamType;
                        const subjects = getSubjectsForTrialExam(studentData.examType || 'TYT', typeForSubjects as any);
                        setExamResults(subjects.map(s => ({ subject: s, correct: 0, incorrect: 0, blank: 0 })));
                        setExamModalOpen(true);
                    }}
                />

                {/* 6. Streak & Consistency */}
                <StreakCalendar
                    productiveDays={productiveDays}
                    currentStreak={currentStreak}
                />

                {/* 3. Subject & Topic Progress */}
                {groupedSubjects.length > 0 && (
                    <SubjectProgressCard
                        subjects={groupedSubjects}
                        onTopicStatusChange={(subject, topicId, status) => {
                            const topic = behaviorProgress.find(p => p.id === topicId);
                            if (topic) {
                                updateTopicStatus(subject, topic.topic, status);
                            }
                        }}
                    />
                )}
            </ScrollView>
        );
    };

    const renderAssignmentsView = () => (
        <View style={{ paddingBottom: 20 }}>
            <View style={styles.calendarHeaderRow}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 10 }}>
                    <Text style={{ color: '#00FFFF', fontSize: 18 }}>◀</Text>
                </TouchableOpacity>
                <Text style={[styles.streakTitle, { fontSize: 16 }]}>
                    {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 10 }}>
                    <Text style={{ color: '#00FFFF', fontSize: 18 }}>▶</Text>
                </TouchableOpacity>
            </View>

            {renderAssignmentCalendarModal()}

            <View style={{ marginTop: 24 }}>
                <Text style={[styles.streakTitle, { fontSize: 14, marginBottom: 12 }]}>
                    {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>

                <View>
                    {assignmentsForSelectedDay.length > 0 ? (
                        assignmentsForSelectedDay.map((a, index) => (
                            <View key={`assignment-container-${a.id || index}`}>
                                <View style={styles.assignmentItem}>
                                    <TouchableOpacity
                                        onPress={() => setExpandedAssignmentId(expandedAssignmentId === a.id ? null : a.id)}
                                        style={styles.assignmentInfo}
                                    >
                                        <View style={styles.assignmentTitleRow}>
                                            <Text style={[styles.assignmentTitle, a.isCompleted && styles.completedText]}>
                                                {a.title}
                                            </Text>
                                            <Text style={styles.expandArrow}>{expandedAssignmentId === a.id ? '▲' : '▼'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.checkbox, a.isCompleted && styles.checkboxCompleted]}
                                        onPress={() => toggleAssignmentCompletion(studentData.id, a.id)}
                                    >
                                        {a.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                </View>
                                {expandedAssignmentId === a.id && (
                                    <View style={styles.assignmentExpContent}>
                                        <Text style={styles.assignmentDesc}>{a.description || 'Açıklama belirtilmemiş'}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noAssignments}>Bu Tarihte Ödev Bulunmuyor</Text>
                    )}
                </View>
            </View>
        </View>
    );

    const renderSubjectsView = () => (
        <View style={{ paddingBottom: 20 }}>
            <GlassCard style={{ padding: 20 }}>
                <Text style={styles.subjectsTitle}>📚 Konu Takibi</Text>
                {studentData.subjects.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginVertical: 20, color: '#666' }}>Henüz takip edilecek konu bulunamadı.</Text>
                ) : (
                    studentData.subjects.map(subject => {
                        const dataKey = getSubjectsDataKey(studentData.examType, studentData.grade);
                        const topics = SUBJECTS_DATA[dataKey]?.[subject] || [];
                        const completedCount = topics.filter((t: string) => studentData.completedTopics.includes(`${subject}-${t}`)).length;
                        const totalCount = topics.length;
                        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                        return (
                            <View key={subject} style={styles.subjectSection}>
                                <View style={styles.subjectHeader}>
                                    <Text style={styles.subjectName}>{subject}</Text>
                                    <Text style={styles.subjectProgress}>{completedCount}/{totalCount} ({percentage}%)</Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                                </View>
                                {topics.map((topic: string) => {
                                    const topicKey = `${subject}-${topic}`;
                                    const isCompleted = studentData.completedTopics.includes(topicKey);
                                    return (
                                        <View key={topicKey} style={styles.topicRow}>
                                            <TouchableOpacity
                                                style={styles.topicLeft}
                                                onPress={() => toggleTopicCompletion(studentData.id, topicKey)}
                                            >
                                                <View style={[styles.topicCheckbox, isCompleted && styles.topicCheckboxCompleted]}>
                                                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                                                </View>
                                                <Text style={[styles.topicName, isCompleted && styles.completedText]}>{topic}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => Linking.openURL(getYouTubeSearchUrl(subject, topic))} style={styles.youtubeButton}>
                                                <Text style={styles.youtubeText}>▶ Video İzle</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })
                )}
            </GlassCard>
        </View>
    );

    return (
        <View style={styles.dashboardContainer}>
            <SafeAreaView style={{ flex: 1 }}>
                {renderDashboard()}
            </SafeAreaView>

            {/* Trial Exam Modal */}
            <Modal
                isOpen={isExamModalOpen}
                title={`${trialExamType} Deneme Sonucu`}
                onClose={() => setExamModalOpen(false)}
            >
                <View style={{ paddingBottom: 20 }}>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                        {['TYT', 'AYT'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={{
                                    flex: 1,
                                    backgroundColor: trialExamType === type ? '#A855F7' : 'rgba(255, 255, 255, 0.05)',
                                    padding: 12,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: trialExamType === type ? '#A855F7' : 'rgba(255, 255, 255, 0.1)'
                                }}
                                onPress={() => {
                                    setTrialExamType(type as any);
                                    const subjects = getSubjectsForTrialExam(studentData?.examType || 'TYT', type as any);
                                    setExamResults(subjects.map(s => ({ subject: s, correct: 0, incorrect: 0, blank: 0 })));
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 8 }}>Deneme Adı</Text>
                            <TextInput
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 12,
                                    padding: 14,
                                    color: '#fff',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.1)'
                                }}
                                value={examName}
                                onChangeText={setExamName}
                                placeholder="Örn: Limit TYT-1"
                                placeholderTextColor="#64748b"
                            />
                        </View>

                        {examResults.map((result, index) => (
                            <View key={result.subject} style={{
                                marginBottom: 16,
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                padding: 12,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.05)'
                            }}>
                                <Text style={{ color: '#E2E8F0', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>{result.subject}</Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Doğru</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                                borderRadius: 8,
                                                padding: 10,
                                                color: '#10B981',
                                                textAlign: 'center',
                                                fontWeight: '700'
                                            }}
                                            value={result.correct.toString()}
                                            onChangeText={(val: string) => {
                                                const newResults = [...examResults];
                                                newResults[index].correct = parseInt(val) || 0;
                                                setExamResults(newResults);
                                            }}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Yanlış</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                                borderRadius: 8,
                                                padding: 10,
                                                color: '#EF4444',
                                                textAlign: 'center',
                                                fontWeight: '700'
                                            }}
                                            value={result.incorrect.toString()}
                                            onChangeText={(val: string) => {
                                                const newResults = [...examResults];
                                                newResults[index].incorrect = parseInt(val) || 0;
                                                setExamResults(newResults);
                                            }}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Boş</Text>
                                        <TextInput
                                            style={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                                borderRadius: 8,
                                                padding: 10,
                                                color: '#F59E0B',
                                                textAlign: 'center',
                                                fontWeight: '700'
                                            }}
                                            value={(result.blank || 0).toString()}
                                            onChangeText={(val: string) => {
                                                const newResults = [...examResults];
                                                newResults[index].blank = parseInt(val) || 0;
                                                setExamResults(newResults);
                                            }}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleSaveExam}
                            style={{
                                backgroundColor: '#A855F7',
                                padding: 16,
                                borderRadius: 14,
                                alignItems: 'center',
                                marginTop: 10,
                                marginBottom: 10
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sonucu Kaydet</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};
