import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    StatusBar,
    FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActionCard } from '../components/ActionCard';
import { BentoGrid, BentoItem } from '../components/BentoGrid';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select, SelectItem } from '../components/Select';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { DailyPressureZone } from '../components/DailyPressureZone';
import { FeatureComparisonCard } from '../components/FeatureComparisonCard';
import { AICoachAssistant } from '../components/AICoachAssistant';
import { PremiumStudentCard } from '../components/PremiumStudentCard';
import { DailyCheckinCard } from '../components/DailyCheckinCard';
import { StudyTimeCard } from '../components/StudyTimeCard';
import { ExamTrendCard } from '../components/ExamTrendCard';
import { StreakCalendar } from '../components/StreakCalendar';
import { DailyQuestionsCard } from '../components/DailyQuestionsCard';
import { SubjectProgressCard } from '../components/SubjectProgressCard';
import { useStudentBehavior } from '../hooks/useStudentBehavior';
import { SubscriptionCTABar } from '../components/SubscriptionCTABar';
import { UpgradeModal } from '../components/UpgradeModal';
import { EXAM_TYPES, AYT_FIELDS, getSubjectsForStudent, getLocalDateString, SUBJECTS_DATA, getSubjectsDataKey, PLAN_DURATIONS, DAILY_STUDY_HOURS } from '../constants';
import type { Student, Assignment, TrialExam, Book, BookChapter } from '../types';
import { generateStudyPlan, extractTopicsFromImage } from '../lib/aiService';
import * as ImagePicker from 'expo-image-picker';

// Elite Control Center Components
import { EliteHeroSection } from '../components/EliteHeroSection';
import { InterventionList, StudentWithRisk } from '../components/InterventionList';
import { AISummaryPanel } from '../components/AISummaryPanel';
import { CompactStudentList } from '../components/CompactStudentList';
import { PerformanceChart } from '../components/PerformanceChart';
import { DailyCoachingStatus } from '../components/DailyCoachingStatus';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { PREMIUM_COLORS } from '../styles/premiumStyles';
import {
    getTodayRiskStudentsCount,
    getCriticalStudentsCount,
    calculatePassiveDays,
    calculateOverdueCount,
    calculateWeeklyChange,
    calculateWeeklyCompletionRate,
    calculateLast7DaysActivity,
    getStudentRiskInfo,
    sortStudentsByRisk,
    getMostActiveStudent,
    getTotalOverdueCount,
} from '../lib/riskCalculator';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CoachDashboard'>;
};

export const CoachDashboardScreen: React.FC<Props> = ({ navigation }) => {
    const {
        currentUser,
        students,
        logout,
        addStudent,
        updateStudent,
        addAssignment,
        deleteStudent,
        addBook,
        deleteBook,
        refreshData,
    } = useApp();

    const myStudents = useMemo(
        () => students.filter(s => s.coachId === currentUser?.id),
        [students, currentUser]
    );

    const handleDeleteBook = (bookId: string, bookName: string) => {
        if (!selectedStudent) return;
        Alert.alert(
            'Kitabı Sil',
            `"${bookName}" kitabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBook(selectedStudent.id, bookId);
                            Alert.alert('Başarılı', 'Kitap silindi.');
                        } catch (error) {
                            Alert.alert('Hata', 'Kitap silinirken bir hata oluştu.');
                        }
                    }
                }
            ]
        );
    };

    // V3: Last analysis timestamp for real-time feel
    const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

    // Update lastAnalysis when data changes
    useEffect(() => {
        setLastAnalysis(new Date());
    }, [myStudents]);

    // Dashboard Stats
    const stats = useMemo(() => {
        const total = myStudents.length;
        const active = myStudents.filter(s => s.dailyLogs.some(log => {
            const logDate = new Date(log.date);
            const today = new Date();
            return logDate.toDateString() === today.toDateString();
        })).length;
        const totalAssignments = myStudents.reduce((acc, s) => acc + s.assignments.length, 0);
        const completedAssignments = myStudents.reduce((acc, s) => acc + s.assignments.filter(a => a.isCompleted).length, 0);

        return { total, active, totalAssignments, completedAssignments };
    }, [myStudents]);

    // Premium Dashboard Stats - Risk & KPI calculations
    const premiumStats = useMemo(() => {
        if (myStudents.length === 0) {
            return {
                riskStudentsCount: 0,
                totalStudents: 0,
                activeStudents: 0,
                weeklyCompletionRate: 0,
                passiveStudentsCount: 0,
                passiveStudents: [] as any[],
                overdueTasksCount: 0,
                overdueTasks: [] as any[],
                decliningStudentsCount: 0,
                decliningStudents: [] as any[],
                weeklyChange: 0,
                chartData: [] as any[],
            };
        }

        // Calculate risk info for all students
        const studentsWithRisk = myStudents.map(s => ({
            ...s,
            riskInfo: getStudentRiskInfo(s),
        }));

        // Today's risky students (score >= 6)
        const riskStudentsCount = getTodayRiskStudentsCount(myStudents);

        // Active students in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeStudents = myStudents.filter((s: any) => {
            if (!s.lastActive) return false;
            return new Date(s.lastActive) >= sevenDaysAgo;
        }).length;

        // Weekly completion rate
        const totalWeeklyCompletionRate = studentsWithRisk.reduce((sum, s) =>
            sum + s.riskInfo.weeklyCompletionRate, 0
        );
        const weeklyCompletionRate = studentsWithRisk.length > 0
            ? Math.round(totalWeeklyCompletionRate / studentsWithRisk.length)
            : 0;

        // Passive students (3+ days passive)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const passiveStudents = myStudents.filter((s: any) => {
            if (!s.lastActive) return true;
            return new Date(s.lastActive) < threeDaysAgo;
        }).map((s: any) => ({
            name: s.name,
            lastActive: s.lastActive || 'Hiç giriş yapmadı',
            passiveDays: calculatePassiveDays(s.lastActive),
        }));

        // Overdue tasks
        const now = new Date();
        const overdueTasks = myStudents.flatMap((s: any) =>
            s.assignments
                .filter((a: any) => !a.isCompleted && new Date(a.dueDate) < now)
                .map((a: any) => ({
                    studentName: s.name,
                    title: a.title,
                    dueDate: a.dueDate,
                    daysOverdue: Math.ceil((now.getTime() - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
                }))
        );

        // Declining students (negative weekly change)
        const decliningStudents = studentsWithRisk
            .filter(s => s.riskInfo.weeklyChange < -10)
            .map(s => ({
                name: s.name,
                weeklyChange: s.riskInfo.weeklyChange,
                previousWeek: 100, // Would need more data for accurate calculation
                currentWeek: 100 + s.riskInfo.weeklyChange,
            }));

        // Weekly change (avg across all students)
        const avgWeeklyChange = studentsWithRisk.length > 0
            ? Math.round(studentsWithRisk.reduce((sum, s) => sum + s.riskInfo.weeklyChange, 0) / studentsWithRisk.length)
            : 0;

        // Chart data for last 7 days
        const chartData = Array(7).fill(null).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const questionsSolved = myStudents.reduce((sum, s) => {
                // Sum all questions solved on this day (across all subjects)
                const dayLogs = s.dailyLogs.filter(log => log.date === dateStr);
                return sum + dayLogs.reduce((logSum, log) => logSum + log.questionsSolved, 0);
            }, 0);
            const studentsActiveOnDay = myStudents.filter(s =>
                s.dailyLogs.some(log => log.date === dateStr)
            ).length;
            return {
                date: dateStr,
                questionsSolved,
                studentsActive: studentsActiveOnDay,
            };
        });

        return {
            riskStudentsCount,
            totalStudents: myStudents.length,
            activeStudents,
            weeklyCompletionRate,
            passiveStudentsCount: passiveStudents.length,
            passiveStudents,
            overdueTasksCount: overdueTasks.length,
            overdueTasks,
            decliningStudentsCount: decliningStudents.length,
            decliningStudents,
            weeklyChange: avgWeeklyChange,
            chartData,
        };
    }, [myStudents]);

    // Aggregate data for Global AI Analysis
    const coachGlobalData = useMemo(() => {
        if (myStudents.length === 0) return null;

        return {
            totalStudents: stats.total,
            activeToday: stats.active,
            totalAssignments: stats.totalAssignments,
            completedAssignments: stats.completedAssignments,
            moodTrends: [], // Currently not tracked globally, can be expanded later
            studentSummaries: myStudents.map(s => ({
                name: s.name,
                pendingAssignments: s.assignments.filter(a => !a.isCompleted).length,
                lastActive: s.dailyLogs.length > 0 ? s.dailyLogs[s.dailyLogs.length - 1].date : 'N/A'
            }))
        };
    }, [myStudents, stats]);

    // Recent Activities
    const recentActivities = useMemo(() => {
        const allAssignmentsWithStudent = myStudents.flatMap(s =>
            s.assignments.map(a => ({ ...a, studentName: s.name }))
        );
        return allAssignmentsWithStudent
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
            .slice(0, 5);
    }, [myStudents]);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Fetch behavior data if a student is selected
    const studentBehavior = useStudentBehavior(selectedStudent?.id || null);

    const [activeTab, setActiveTab] = useState<'activity' | 'assignments' | 'topics' | 'books' | 'reports' | 'ai' | 'settings'>('activity');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAddStudentOpen, setAddStudentOpen] = useState(false);
    const [isAddAssignmentOpen, setAddAssignmentOpen] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);

    // Memoized student data for AI assistant to avoid unnecessary re-fetches
    const selectedStudentData = useMemo(() => {
        if (!selectedStudent) return null;
        return {
            name: selectedStudent.name,
            examType: selectedStudent.examType,
            subjects: selectedStudent.subjects,
            recentCheckins: studentBehavior.dailyCheckins,
            recentExams: studentBehavior.exams,
            recentStudyTime: studentBehavior.studyTimeLogs,
            recentQuestions: studentBehavior.dailyQuestionLogs
        };
    }, [selectedStudent, studentBehavior]);

    // AI Plan Form
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiPlanDuration, setAiPlanDuration] = useState('7');
    const [aiDailyHours, setAiDailyHours] = useState('4');
    const [aiStartDate, setAiStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return getLocalDateString(tomorrow);
    });
    const [aiExcludeWeekends, setAiExcludeWeekends] = useState(false);

    // AI Plan Preview with Date Selection
    const [pendingPlan, setPendingPlan] = useState<{ day: number; title: string; description: string; subject: string; topic?: string }[]>([]);
    const [showPlanPreview, setShowPlanPreview] = useState(false);
    const [selectedDatesForPlan, setSelectedDatesForPlan] = useState<string[]>([]);

    // Book Management State
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [newBookName, setNewBookName] = useState('');
    const [newBookSubject, setNewBookSubject] = useState('');
    const [isAnalyzingToc, setIsAnalyzingToc] = useState(false);
    const [selectedBookForAssignment, setSelectedBookForAssignment] = useState<Book | null>(null);
    const [accumulatedChapters, setAccumulatedChapters] = useState<BookChapter[]>([]); // Multi-page TOC support (Nested)
    const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
    const [topicToAssign, setTopicToAssign] = useState<{ book: Book, topic: string } | null>(null);
    const [showBookAssignmentCalendar, setShowBookAssignmentCalendar] = useState(false);

    // V4: Real-time calculation of activity stats to ensure accuracy
    const activityStats = useMemo(() => {
        if (!selectedStudent) return { currentStreak: 0, todayTotalQuestions: 0, productiveDays: [] as string[] };

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // 1. Today's total questions (from selectedStudent for real-time response)
        const todayTotalQuestions = selectedStudent.dailyLogs
            .filter(q => q.date === todayStr)
            .reduce((sum, q) => sum + q.questionsSolved, 0);

        // 2. Productive Days (Universal Set)
        const days = new Set<string>();

        // From selectedStudent question logs
        selectedStudent.dailyLogs.forEach(q => {
            if (q.questionsSolved > 0) days.add(q.date);
        });

        // From selectedStudent assignments (completed on their due date for simplicity)
        selectedStudent.assignments.forEach(a => {
            if (a.isCompleted) days.add(a.dueDate);
        });

        // From behavior hook (study time & historical data)
        studentBehavior.productiveDays.forEach(d => days.add(d));

        const productiveDays = Array.from(days).sort();

        // 3. Current Streak Calculation
        let streak = 0;
        const isActiveNear = days.has(todayStr) || days.has(yesterdayStr);

        if (isActiveNear) {
            const checkDate = days.has(todayStr) ? new Date() : yesterday;
            const sortedDaysDesc = productiveDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            for (const day of sortedDaysDesc) {
                const dayStr = new Date(day).toISOString().split('T')[0];
                const currentCheckStr = checkDate.toISOString().split('T')[0];

                if (dayStr === currentCheckStr) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (dayStr < currentCheckStr) {
                    break;
                }
            }
        }

        return {
            currentStreak: streak,
            todayTotalQuestions,
            productiveDays
        };
    }, [selectedStudent, studentBehavior.productiveDays]);

    // Assignment Calendar state
    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
    const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date());
    const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
    const [assignmentFlow, setAssignmentFlow] = useState<'select' | 'standard' | 'ai' | 'book' | 'topic'>('select');
    const [topicFlowSubject, setTopicFlowSubject] = useState<string | null>(null);
    const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Sync form fields when student is selected
    useEffect(() => {
        if (selectedStudent) {
            setStudentName(selectedStudent.name);
            setStudentExamType(selectedStudent.examType);
            setStudentField(selectedStudent.field || '');
            setStudentGrade(String(selectedStudent.grade));
        } else {
            resetStudentForm();
        }
    }, [selectedStudent]);

    // Keep selectedStudent in sync with global students list
    useEffect(() => {
        if (selectedStudent) {
            const freshStudent = students.find(s => s.id === selectedStudent.id);
            if (freshStudent && JSON.stringify(freshStudent) !== JSON.stringify(selectedStudent)) {
                setSelectedStudent(freshStudent || null);
            }
        }
    }, [students, selectedStudent]);

    // Add Student Form
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [studentExamType, setStudentExamType] = useState('');
    const [studentField, setStudentField] = useState('');
    const [studentGrade, setStudentGrade] = useState('');

    // Add Assignment Form
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDesc, setAssignmentDesc] = useState('');
    const [assignmentDueDate, setAssignmentDueDate] = useState('');

    const handleLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
    };

    const handleAddStudent = () => {
        if (!studentName || !studentEmail || !studentPassword || !studentExamType || !studentGrade) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        const studentSubjects = getSubjectsForStudent(studentExamType, studentField, parseInt(studentGrade));

        addStudent(
            {
                name: studentName,
                coachId: currentUser!.id,
                examType: studentExamType,
                field: studentExamType === EXAM_TYPES.TYT_AYT ? studentField : undefined,
                grade: parseInt(studentGrade),
                subjects: studentSubjects,
            },
            { email: studentEmail, password: studentPassword }
        );

        setAddStudentOpen(false);
        resetStudentForm();
        Alert.alert('Başarılı', 'Öğrenci eklendi!');
    };

    const resetStudentForm = () => {
        setStudentName('');
        setStudentEmail('');
        setStudentPassword('');
        setStudentExamType('');
        setStudentField('');
        setStudentGrade('');
    };

    const handleAddAssignment = () => {
        if (!selectedStudent || !assignmentTitle || !assignmentDueDate) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        addAssignment(selectedStudent.id, {
            title: assignmentTitle,
            description: assignmentDesc,
            dueDate: assignmentDueDate,
        });

        setAddAssignmentOpen(false);
        setAssignmentTitle('');
        setAssignmentDesc('');
        setAssignmentDueDate('');
        setAssignmentFlow('select');
        Alert.alert('Başarılı', 'Ödev atandı!');
    };

    const handleDeleteStudent = (studentId: string, studentName: string) => {
        Alert.alert(
            'Öğrenci Sil',
            `${studentName} adlı öğrenciyi silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        deleteStudent(studentId);
                        if (selectedStudent?.id === studentId) {
                            setSelectedStudent(null);
                        }
                    },
                },
            ]
        );
    };

    const handleGeneratePlan = async () => {
        if (!selectedStudent || !aiPrompt) {
            Alert.alert('Hata', 'Lütfen bir yönlendirme girin.');
            return;
        }

        console.log('[AI Plan] Starting plan generation...');
        console.log('[AI Plan] Student:', selectedStudent.name);
        console.log('[AI Plan] Prompt:', aiPrompt);
        console.log('[AI Plan] Duration:', aiPlanDuration, 'days');
        console.log('[AI Plan] Daily hours:', aiDailyHours);

        setIsGeneratingPlan(true);
        try {
            const planNodes = await generateStudyPlan({
                examType: selectedStudent.examType,
                subjects: selectedStudent.subjects,
                prompt: aiPrompt,
                difficulty: 'Orta',
                planDuration: parseInt(aiPlanDuration),
                dailyHours: parseInt(aiDailyHours)
            });

            console.log('[AI Plan] Generated nodes:', planNodes.length);

            if (!planNodes || planNodes.length === 0) {
                Alert.alert('Uyarı', 'AI boş bir plan oluşturdu. Lütfen yönlendirmeyi değiştirin.');
                return;
            }

            // Build summary for preview
            const planSummary = planNodes.slice(0, 5).map((node, i) =>
                `${i + 1}. ${node.title}`
            ).join('\n');
            const moreText = planNodes.length > 5 ? `\n\n...ve ${planNodes.length - 5} görev daha` : '';

            // Store plan in state and show calendar picker
            setPendingPlan(planNodes);
            setSelectedDatesForPlan([]); // User will tap to select days
            setShowPlanPreview(true);

        } catch (error: any) {
            console.error('[AI Plan] Error:', error);
            const errorMessage = error?.message || 'Bilinmeyen hata';
            if (errorMessage.includes('API_KEY') || errorMessage.includes('not found')) {
                Alert.alert('API Hatası', 'Gemini API anahtarı eksik veya geçersiz. Lütfen yöneticiyle iletişime geçin.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                Alert.alert('Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
            } else {
                Alert.alert('Hata', `Plan oluşturulurken sorun: ${errorMessage}`);
            }
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    // Confirm and add plan to calendar after user approval - FAST batch insert
    const handleConfirmPlan = async () => {
        if (!selectedStudent || pendingPlan.length === 0 || selectedDatesForPlan.length === 0) return;

        try {
            // Use Promise.all for faster parallel insertion
            await Promise.all(
                pendingPlan.map((node, index) =>
                    addAssignment(selectedStudent.id, {
                        title: node.title,
                        description: node.description,
                        dueDate: selectedDatesForPlan[index] || getLocalDateString(new Date()),
                    })
                )
            );

            Alert.alert('Başarılı', `${pendingPlan.length} görev takvime eklendi.`);
            setAiPrompt('');
            setPendingPlan([]);
            setSelectedDatesForPlan([]);
            setShowPlanPreview(false);
            setActiveTab('assignments');
        } catch (error) {
            console.error('[AI Plan] Error adding assignments:', error);
            Alert.alert('Hata', 'Görevler eklenirken bir sorun oluştu.');
        }
    };

    // Cancel plan preview
    const handleCancelPlan = () => {
        setPendingPlan([]);
        setShowPlanPreview(false);
    };

    // Take photo and accumulate topics (for multi-page TOC)
    const handleTakePhoto = async () => {
        if (!selectedStudent) return;

        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Kamera izni gereklidir.');
            return;
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            quality: 0.7,
        });

        if (result.canceled || !result.assets?.[0]?.base64) {
            return;
        }

        setIsAnalyzingToc(true);
        try {
            // AI Vision: Extract hierarchical topics from table of contents
            const newChapters = await extractTopicsFromImage(result.assets[0].base64);

            // Accumulate chapters (merge topics if chapter already exists)
            setAccumulatedChapters(prev => {
                const combined = [...prev];
                newChapters.forEach(newChap => {
                    const existingIndex = combined.findIndex(c => c.title === newChap.title);
                    if (existingIndex > -1) {
                        combined[existingIndex].topics = [...new Set([...combined[existingIndex].topics, ...newChap.topics])];
                    } else {
                        combined.push(newChap);
                    }
                });
                return combined;
            });

            const topicCount = newChapters.reduce((acc, c) => acc + c.topics.length, 0);
            Alert.alert('Başarılı', `${newChapters.length} ünite ve ${topicCount} yeni konu bulundu.\n\nBaşka sayfa varsa "📷 Başka Sayfa Çek" butonuna bas.`);
        } catch (error: any) {
            console.error('[Book] AI analysis error:', error);
            Alert.alert('Hata', error?.message || 'İçindekiler analizi başarısız oldu.');
        } finally {
            setIsAnalyzingToc(false);
        }
    };

    // Save book with accumulated chapters
    const handleSaveBook = async () => {
        if (!selectedStudent || !newBookName.trim()) {
            Alert.alert('Hata', 'Lütfen kitap adını girin.');
            return;
        }

        if (accumulatedChapters.length === 0) {
            Alert.alert('Hata', 'Önce en az bir içindekiler fotoğrafı çekin.');
            return;
        }

        const totalTopics = accumulatedChapters.reduce((acc, c) => acc + c.topics.length, 0);

        try {
            await addBook(selectedStudent.id, {
                name: newBookName.trim(),
                subject: newBookSubject || undefined,
                chapters: accumulatedChapters,
            });

            Alert.alert('Başarılı', `"${newBookName}" kitabı eklendi. ${accumulatedChapters.length} ünite ve ${totalTopics} konu kaydedildi.`);
            setNewBookName('');
            setNewBookSubject('');
            setAccumulatedChapters([]);
            setShowAddBookModal(false);
        } catch (error: any) {
            console.error('[Book] Save error:', error);
            Alert.alert('Hata', error?.message || 'Kitap kaydedilemedi.');
        }
    };

    // Assign topic from book to calendar
    const handleAssignTopicFromBook = async (book: Book, topic: string) => {
        if (!selectedStudent) return;

        // Instant UI feedback first
        const dateStr = getLocalDateString(calendarSelectedDate);
        setSelectedBookForAssignment(null);
        setAssignmentFlow('select');

        // Show alert after UI update
        Alert.alert('✅ Atandı!', `"${topic}" → ${dateStr}`);

        // Run assignment in background
        addAssignment(selectedStudent.id, {
            title: `${book.name} - ${topic}`,
            description: `${topic} konusu çalışılacak.`,
            dueDate: dateStr,
        }).catch(err => console.error('[Book Assignment] Error:', err));
    };

    const handleUpdateStudent = () => {
        if (!selectedStudent || !studentName || !studentGrade) {
            Alert.alert('Hata', 'Lütfen gerekli alanları doldurun.');
            return;
        }

        updateStudent({
            ...selectedStudent,
            name: studentName,
            grade: parseInt(studentGrade),
            examType: studentExamType,
            field: studentField || undefined,
        });

        Alert.alert('Başarılı', 'Öğrenci bilgileri güncellendi.');
        // Refresh local selectedStudent if needed, but context update should propagate
    };

    const toggleSubject = (subject: string) => {
        setExpandedSubjects(prev =>
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };

    const getDefaultDueDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return getLocalDateString(date);
    };

    const changeMonth = (offset: number) => {
        setCalendarCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const renderAssignmentCalendar = () => {
        if (!selectedStudent) return null;

        const year = calendarCurrentMonth.getFullYear();
        const month = calendarCurrentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayString = getLocalDateString();
        const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
        const calendarDays = [];

        // Day headers
        dayNames.forEach(day => {
            calendarDays.push(
                <View key={`header-${day}`} style={styles.calendarHeaderCell}>
                    <Text style={styles.calendarHeaderText}>{day}</Text>
                </View>
            );
        });

        // Adjusted first day (Monday start)
        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startOffset; i++) {
            calendarDays.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
        }

        const assignmentsByDate = selectedStudent.assignments.reduce((acc, a) => {
            acc[a.dueDate] = acc[a.dueDate] || [];
            acc[a.dueDate].push(a);
            return acc;
        }, {} as Record<string, Assignment[]>);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = getLocalDateString(date);
            const isToday = todayString === dateString;
            const isSelected = getLocalDateString(calendarSelectedDate) === dateString;
            const dailyMissions = assignmentsByDate[dateString] || [];

            let dotColor = null;
            if (dailyMissions.length > 0) {
                const allDone = dailyMissions.every(a => a.isCompleted);
                const hasOverdue = dailyMissions.some(a => !a.isCompleted && a.dueDate < todayString);
                dotColor = hasOverdue ? '#ef4444' : allDone ? '#10b981' : '#f59e0b';
            }

            calendarDays.push(
                <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                        styles.calendarDayCell,
                        isSelected && styles.selectedDayCell,
                        isToday && !isSelected && styles.todayCell,
                    ]}
                    onPress={() => {
                        setCalendarSelectedDate(date);
                        setAssignmentDueDate(getLocalDateString(date));
                        // Auto-scroll to assignment list
                        setTimeout(() => {
                            scrollRef.current?.scrollTo({ y: 800, animated: true });
                        }, 150);
                    }}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText
                    ]}>
                        {day}
                    </Text>
                    {dotColor && <View style={[styles.calendarDot, { backgroundColor: dotColor }]} />}
                </TouchableOpacity>
            );
        }

        return <View style={styles.calendarGrid}>{calendarDays}</View>;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>🎓</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Koç Paneli</Text>
                        <Text style={styles.subtitleText}>{currentUser?.name}</Text>
                    </View>
                </View>
                <Button onPress={handleLogout} variant="secondary" style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Çıkış</Text>
                </Button>
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={async () => {
                            setIsRefreshing(true);
                            await refreshData();
                            setIsRefreshing(false);
                        }}
                        colors={['#A855F7']}
                        tintColor="#A855F7"
                        progressBackgroundColor="#1e293b"
                    />
                }
            >
                {selectedStudent === null ? (
                    <>
                        {/* === ELITE CONTROL CENTER === */}

                        {/* 1️⃣ HERO - Critical Risk Count */}
                        <EliteHeroSection
                            criticalCount={getCriticalStudentsCount(myStudents)}
                            lastAnalysis={lastAnalysis}
                            onViewRiskStudents={() => {
                                scrollRef.current?.scrollTo({ y: 600, animated: true });
                            }}
                            onSendBulkMessage={() => {
                                Alert.alert('Toplu Mesaj', 'Bu özellik yakında aktif olacak.');
                            }}
                        />

                        {/* 2️⃣ INTERVENTION LIST - Top 3 Critical */}
                        <InterventionList
                            students={sortStudentsByRisk(myStudents).map(s => ({
                                ...s,
                                riskInfo: getStudentRiskInfo(s),
                            })) as StudentWithRisk[]}
                            onSendMessage={(student: Student) => {
                                Alert.alert('Mesaj Gönder', `${student.name} öğrencisine mesaj gönderilecek.`);
                            }}
                            onUpdateProgram={(student: Student) => {
                                setSelectedStudent(student);
                                setActiveTab('assignments');
                            }}
                        />

                        {/* 2.5️⃣ DAILY COACHING STATUS */}
                        <DailyCoachingStatus
                            behindCount={myStudents.filter(s => {
                                const riskInfo = getStudentRiskInfo(s);
                                return riskInfo.label === 'Kritik' || riskInfo.label === 'Dikkat';
                            }).length}
                            overdueCount={getTotalOverdueCount(myStudents)}
                            inactiveCount={myStudents.filter(s => {
                                const riskInfo = getStudentRiskInfo(s);
                                return riskInfo.passiveDays >= 3;
                            }).length}
                            behindStudents={myStudents.filter(s => {
                                const riskInfo = getStudentRiskInfo(s);
                                return riskInfo.label === 'Kritik' || riskInfo.label === 'Dikkat';
                            }).map(s => ({
                                name: s.name,
                                detail: `Risk: ${getStudentRiskInfo(s).label}`
                            }))}
                            overdueItems={premiumStats.overdueTasks.map(t => ({
                                name: t.studentName,
                                detail: `${t.title} - ${new Date(t.dueDate).toLocaleDateString('tr-TR')}`
                            }))}
                            inactiveStudents={premiumStats.passiveStudents.map(s => ({
                                name: s.name,
                                detail: `${s.passiveDays} gündür inaktif`
                            }))}
                        />


                        {/* Add Student Button - Subtle placement */}
                        <TouchableOpacity
                            style={styles.dashboardAddButton}
                            onPress={() => setAddStudentOpen(true)}
                        >
                            <View style={styles.dashboardAddButtonInner}>
                                <Text style={styles.dashboardAddButtonIcon}>➕</Text>
                                <Text style={styles.dashboardAddButtonText}>Yeni Öğrenci Ekle</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 5️⃣ COMPACT STUDENT LIST */}
                        <CompactStudentList
                            students={myStudents}
                            onStudentPress={(student: Student) => setSelectedStudent(student)}
                        />
                    </>
                ) : (
                    /* Selected Student Details Section - "The Cockpit" */
                    <View style={{ flex: 1 }}>
                        {/* Android Style Header */}
                        <View style={styles.androidHeader}>
                            <View style={styles.androidHeaderTop}>
                                <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.androidBackBtn}>
                                    <Text style={styles.androidBackIcon}>←</Text>
                                </TouchableOpacity>
                                <View style={styles.androidHeaderTitles}>
                                    <Text style={styles.androidStudentName}>{selectedStudent.name}</Text>
                                    <Text style={styles.androidStudentSub}>{selectedStudent.examType} • {selectedStudent.grade}. Sınıf</Text>
                                </View>
                                <View style={styles.headerIconsRow}>
                                    <TouchableOpacity
                                        style={[styles.headerIconBtn, activeTab === 'settings' && styles.headerIconBtnActive]}
                                        onPress={() => setActiveTab('settings')}
                                    >
                                        <Text style={styles.headerIconEmoji}>⚙️</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Content Area */}
                        <View style={styles.tabContent}>


                            {activeTab === 'assignments' && (
                                <View>
                                    <Text style={styles.tabTitle}>Ödev Yönetimi</Text>
                                    <GlassCard style={styles.assignmentWizardContainer}>
                                        {assignmentFlow === 'select' ? (
                                            <View>
                                                <View style={styles.wizardButtonGrid}>
                                                    <TouchableOpacity
                                                        style={[styles.wizardBtn, { borderColor: '#A855F7', shadowColor: '#A855F7' }]}
                                                        onPress={() => setActiveTab('ai')}
                                                    >
                                                        <Text style={styles.wizardBtnIcon}>🤖</Text>
                                                        <Text style={styles.wizardBtnText}>AI Plan Oluştur</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.wizardBtn, { borderColor: '#F97316', shadowColor: '#F97316' }]}
                                                        onPress={() => setAssignmentFlow('book')}
                                                    >
                                                        <Text style={styles.wizardBtnIcon}>📚</Text>
                                                        <Text style={styles.wizardBtnText}>Kitap Seçerek Ata</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.wizardBtn, { borderColor: '#06B6D4', shadowColor: '#06B6D4' }]}
                                                        onPress={() => setAssignmentFlow('topic')}
                                                    >
                                                        <Text style={styles.wizardBtnIcon}>🎯</Text>
                                                        <Text style={styles.wizardBtnText}>Konu Seçerek Ata</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.wizardBtn, { borderColor: '#10b981', shadowColor: '#10b981' }]}
                                                        onPress={() => {
                                                            setAssignmentFlow('standard');
                                                            setAssignmentDueDate(getLocalDateString(calendarSelectedDate));
                                                        }}
                                                    >
                                                        <Text style={styles.wizardBtnIcon}>✍️</Text>
                                                        <Text style={styles.wizardBtnText}>Manuel Ödev Ata</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View>
                                                <View style={styles.wizardHeader}>
                                                    <TouchableOpacity onPress={() => setAssignmentFlow('select')}>
                                                        <Text style={styles.backBtnText}>← Geri</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.wizardTitleText}>
                                                        {assignmentFlow === 'standard' ? 'Standart Ödev Atama' :
                                                            assignmentFlow === 'ai' ? 'AI Ödev Sihirbazı' :
                                                                assignmentFlow === 'topic' ? 'Konu Bazlı Ödev' : 'Kitap Kütüphanesi'}
                                                    </Text>
                                                </View>

                                                {assignmentFlow === 'standard' && (
                                                    <View style={styles.standardForm}>
                                                        <Input label="Ödev Başlığı" placeholder="Örn: Limit ve Süreklilik Soruları" value={assignmentTitle} onChangeText={setAssignmentTitle} />
                                                        <Input label="Açıklama" placeholder="Örn: Test 1-5 arası çözülecek" value={assignmentDesc} onChangeText={setAssignmentDesc} multiline numberOfLines={3} />
                                                        <Input label="Bitiş Tarihi" value={assignmentDueDate} onChangeText={setAssignmentDueDate} placeholder="YYYY-MM-DD" />
                                                        <Button onPress={handleAddAssignment} style={[styles.submitButton, { marginTop: 8 }]}>
                                                            <Text style={styles.buttonText}>Ödevi Ata</Text>
                                                        </Button>
                                                    </View>
                                                )}

                                                {assignmentFlow === 'ai' && (
                                                    <View style={styles.aiForm}>
                                                        <Text style={styles.aiDraftText}>AI, öğrencinin zayıf olduğu konuları analiz ederek en verimli ödevleri önerir.</Text>
                                                        <Button onPress={() => Alert.alert('AI Analizi', 'Öğrenci verileri inceleniyor... Bu özellik yakında aktif olacak.')} style={[styles.submitButton, { marginTop: 8 }]}>
                                                            <Text style={styles.buttonText}>Zayıf Konuları Analiz Et & Ödev Oluştur</Text>
                                                        </Button>
                                                    </View>
                                                )}

                                                {assignmentFlow === 'book' && (
                                                    <View style={styles.bookForm}>
                                                        {!selectedBookForAssignment ? (
                                                            <View>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                    <Text style={styles.bookDraftText}>Kitaplarım</Text>
                                                                    <TouchableOpacity
                                                                        style={{ backgroundColor: '#a855f7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                                                                        onPress={() => setShowAddBookModal(true)}
                                                                    >
                                                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ Kitap Ekle</Text>
                                                                    </TouchableOpacity>
                                                                </View>

                                                                {(selectedStudent.books || []).length === 0 ? (
                                                                    <View style={{ backgroundColor: '#1e293b', padding: 20, borderRadius: 8, alignItems: 'center' }}>
                                                                        <Text style={{ color: '#94a3b8', marginBottom: 8 }}>Henüz kitap eklenmemiş</Text>
                                                                        <TouchableOpacity
                                                                            style={{ backgroundColor: '#a855f7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                                                                            onPress={() => setShowAddBookModal(true)}
                                                                        >
                                                                            <Text style={{ color: '#fff', fontWeight: '600' }}>📚 İlk Kitabı Ekle</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                ) : (
                                                                    <View style={{ gap: 8 }}>
                                                                        {(selectedStudent.books || []).map((book, idx) => {
                                                                            const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                                                                            const bgColor = colors[idx % colors.length] + '22';
                                                                            const borderColor = colors[idx % colors.length];
                                                                            return (
                                                                                <TouchableOpacity
                                                                                    key={book.id}
                                                                                    style={{
                                                                                        backgroundColor: bgColor,
                                                                                        padding: 14,
                                                                                        borderRadius: 10,
                                                                                        borderLeftWidth: 4,
                                                                                        borderLeftColor: borderColor,
                                                                                        flexDirection: 'row',
                                                                                        alignItems: 'center',
                                                                                    }}
                                                                                    onPress={() => setSelectedBookForAssignment(book)}
                                                                                >
                                                                                    <Text style={{ fontSize: 24, marginRight: 12 }}>📚</Text>
                                                                                    <View style={{ flex: 1 }}>
                                                                                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{book.name}</Text>
                                                                                        <Text style={{ color: borderColor, fontSize: 12, marginTop: 2 }}>
                                                                                            {book.chapters?.length || 0} ünite • {book.subject || 'Genel'}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <Text style={{ color: '#64748b', fontSize: 18 }}>→</Text>
                                                                                </TouchableOpacity>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        ) : (
                                                            <View>
                                                                <TouchableOpacity
                                                                    onPress={() => setSelectedBookForAssignment(null)}
                                                                    style={{ marginBottom: 12 }}
                                                                >
                                                                    <Text style={{ color: '#3b82f6' }}>← Kitap Listesine Dön</Text>
                                                                </TouchableOpacity>
                                                                <Text style={styles.bookDraftText}>📕 {selectedBookForAssignment.name}</Text>
                                                                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
                                                                    Atamak istediğiniz konuya dokunun ({getLocalDateString(calendarSelectedDate)} tarihine atanacak)
                                                                </Text>

                                                                {(selectedBookForAssignment.chapters?.length || 0) === 0 ? (
                                                                    <View style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 8 }}>
                                                                        <Text style={{ color: '#94a3b8' }}>Bu kitapta ünite bulunamadı. Kitabı silerek yeniden ekleyebilirsiniz.</Text>
                                                                    </View>
                                                                ) : (
                                                                    <ScrollView
                                                                        style={{ maxHeight: 350 }}
                                                                        nestedScrollEnabled={true}
                                                                        showsVerticalScrollIndicator={true}
                                                                    >
                                                                        {selectedBookForAssignment.chapters?.map((chapter, cIdx) => {
                                                                            const isExpanded = expandedChapters.includes(`assign-${selectedBookForAssignment.id}-${chapter.title}`);
                                                                            const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                                                                            const borderColor = colors[cIdx % colors.length];

                                                                            return (
                                                                                <View key={cIdx} style={{ marginBottom: 4 }}>
                                                                                    <TouchableOpacity
                                                                                        style={{
                                                                                            backgroundColor: '#1e293b',
                                                                                            padding: 14,
                                                                                            borderRadius: 10,
                                                                                            borderLeftWidth: 4,
                                                                                            borderLeftColor: borderColor,
                                                                                            flexDirection: 'row',
                                                                                            alignItems: 'center',
                                                                                        }}
                                                                                        onPress={() => setExpandedChapters(prev =>
                                                                                            prev.includes(`assign-${selectedBookForAssignment.id}-${chapter.title}`)
                                                                                                ? prev.filter(id => id !== `assign-${selectedBookForAssignment.id}-${chapter.title}`)
                                                                                                : [...prev, `assign-${selectedBookForAssignment.id}-${chapter.title}`]
                                                                                        )}
                                                                                    >
                                                                                        <Text style={{ color: borderColor, fontSize: 16, marginRight: 10 }}>📁</Text>
                                                                                        <Text style={{ color: '#e2e8f0', fontSize: 14, flex: 1, fontWeight: '600' }}>{chapter.title}</Text>
                                                                                        {chapter.topics.length > 0 ? (
                                                                                            <Text style={{ color: '#64748b', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</Text>
                                                                                        ) : (
                                                                                            <TouchableOpacity
                                                                                                onPress={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleAssignTopicFromBook(selectedBookForAssignment, chapter.title);
                                                                                                }}
                                                                                                style={{ padding: 4 }}
                                                                                            >
                                                                                                <Text style={{ color: '#a855f7', fontSize: 12, fontWeight: 'bold' }}>+ ATA</Text>
                                                                                            </TouchableOpacity>
                                                                                        )}
                                                                                    </TouchableOpacity>

                                                                                    {isExpanded && chapter.topics.length > 0 && (
                                                                                        <View style={{ paddingLeft: 16, marginTop: 4 }}>
                                                                                            {chapter.topics.map((topic, tIdx) => (
                                                                                                <TouchableOpacity
                                                                                                    key={tIdx}
                                                                                                    style={{
                                                                                                        padding: 12,
                                                                                                        backgroundColor: '#1e293b40',
                                                                                                        borderRadius: 8,
                                                                                                        marginBottom: 2,
                                                                                                        flexDirection: 'row',
                                                                                                        justifyContent: 'space-between',
                                                                                                        alignItems: 'center'
                                                                                                    }}
                                                                                                    onPress={() => handleAssignTopicFromBook(selectedBookForAssignment, topic)}
                                                                                                >
                                                                                                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>{topic}</Text>
                                                                                                    <Text style={{ color: '#a855f7', fontSize: 11 }}>+</Text>
                                                                                                </TouchableOpacity>
                                                                                            ))}
                                                                                        </View>
                                                                                    )}
                                                                                </View>
                                                                            );
                                                                        })}
                                                                    </ScrollView>
                                                                )}
                                                            </View>
                                                        )}
                                                    </View>
                                                )}

                                                {/* Add Book Modal/Form */}
                                                {showAddBookModal && (
                                                    <View style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#a855f7' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>📚 Yeni Kitap Ekle</Text>
                                                            <TouchableOpacity onPress={() => setShowAddBookModal(false)}>
                                                                <Text style={{ color: '#94a3b8', fontSize: 20 }}>✕</Text>
                                                            </TouchableOpacity>
                                                        </View>

                                                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Kitap Adı</Text>
                                                        <Input
                                                            value={newBookName}
                                                            onChangeText={setNewBookName}
                                                            placeholder="Örn: TYT Matematik Soru Bankası"
                                                        />

                                                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 12, marginBottom: 6 }}>Ders (Opsiyonel)</Text>
                                                        <Input
                                                            value={newBookSubject}
                                                            onChangeText={setNewBookSubject}
                                                            placeholder="Örn: Matematik"
                                                        />

                                                        {/* Topic Counter */}
                                                        {accumulatedChapters.length > 0 && (
                                                            <View style={{ backgroundColor: '#10b98122', padding: 10, borderRadius: 8, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#10b981' }}>
                                                                <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 14 }}>
                                                                    ✅ {accumulatedChapters.length} konu bulundu
                                                                </Text>
                                                                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                                                                    Başka sayfa varsa tekrar fotoğraf çekebilirsin.
                                                                </Text>
                                                            </View>
                                                        )}

                                                        <View style={{ marginTop: 16 }}>
                                                            {/* Take Photo Button */}
                                                            <TouchableOpacity
                                                                style={{
                                                                    backgroundColor: isAnalyzingToc ? '#475569' : '#a855f7',
                                                                    padding: 14,
                                                                    borderRadius: 8,
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                }}
                                                                onPress={handleTakePhoto}
                                                                disabled={isAnalyzingToc}
                                                            >
                                                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                                                                    {isAnalyzingToc ? '🤖 AI Analiz Ediyor...' : accumulatedChapters.length > 0 ? '📷 Başka Sayfa Çek' : '📷 İçindekiler Fotoğrafı Çek'}
                                                                </Text>
                                                            </TouchableOpacity>

                                                            {/* Save Button (only if topics exist) */}
                                                            {accumulatedChapters.length > 0 && (
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: '#10b981',
                                                                        padding: 14,
                                                                        borderRadius: 8,
                                                                        flexDirection: 'row',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        marginTop: 8,
                                                                    }}
                                                                    onPress={handleSaveBook}
                                                                    disabled={!newBookName.trim()}
                                                                >
                                                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                                                                        ✓ Kitabı Kaydet ({accumulatedChapters.length} konu)
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )}

                                                            <Text style={{ color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                                                                Çok sayfalı içindekiler için birden fazla fotoğraf çekebilirsin.
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}

                                                {assignmentFlow === 'topic' && (
                                                    <View style={styles.topicForm}>
                                                        {!topicFlowSubject ? (
                                                            <View>
                                                                <Text style={styles.bookDraftText}>Ödev atamak istediğiniz dersi seçin:</Text>
                                                                <View style={styles.topicGrid}>
                                                                    {selectedStudent.subjects.map(subject => (
                                                                        <TouchableOpacity
                                                                            key={subject}
                                                                            style={[styles.topicItem, styles.subjectItem]}
                                                                            onPress={() => setTopicFlowSubject(subject)}
                                                                        >
                                                                            <Text style={styles.topicItemText}>{subject}</Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </View>
                                                            </View>
                                                        ) : (
                                                            <View>
                                                                <TouchableOpacity
                                                                    onPress={() => setTopicFlowSubject(null)}
                                                                    style={{ marginBottom: 12 }}
                                                                >
                                                                    <Text style={{ color: '#3b82f6' }}>← Ders Listesine Dön</Text>
                                                                </TouchableOpacity>
                                                                <Text style={styles.bookDraftText}>{topicFlowSubject} dersinden ödev başlığını seçin:</Text>
                                                                <View style={styles.topicGrid}>
                                                                    {(SUBJECTS_DATA[getSubjectsDataKey(selectedStudent.examType, selectedStudent.grade)] as any)[topicFlowSubject]?.map((topic: string) => (
                                                                        <TouchableOpacity
                                                                            key={topic}
                                                                            style={styles.topicItem}
                                                                            onPress={() => {
                                                                                setAssignmentTitle(`${topicFlowSubject} - ${topic}`);
                                                                                setAssignmentDesc(`${topic} konusu ile ilgili sorular çözülecek.`);
                                                                                setAssignmentDueDate(getLocalDateString(calendarSelectedDate));
                                                                                setAssignmentFlow('standard');
                                                                                setTopicFlowSubject(null);
                                                                            }}
                                                                        >
                                                                            <Text style={styles.topicItemText}>{topic}</Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </GlassCard>

                                    <View style={styles.calendarContainer}>
                                        <View style={styles.calendarHeaderRow}>
                                            <TouchableOpacity
                                                onPress={() => changeMonth(-1)}
                                                style={styles.monthNavBtn}
                                            >
                                                <Text style={styles.monthNavText}>◀</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.currentMonthText}>
                                                {MONTHS_TR[calendarCurrentMonth.getMonth()]} {calendarCurrentMonth.getFullYear()}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => changeMonth(1)}
                                                style={styles.monthNavBtn}
                                            >
                                                <Text style={styles.monthNavText}>▶</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {renderAssignmentCalendar()}

                                        <View style={styles.divider} />

                                        <Text style={styles.dateLabel}>
                                            📅 {calendarSelectedDate.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </Text>
                                        {selectedStudent.assignments.filter(a => a.dueDate === getLocalDateString(calendarSelectedDate)).length === 0 ? (
                                            <View style={styles.emptyStateContainerSmall}>
                                                <Text style={styles.emptyTextSmall}>Seçili gün için ödev bulunamadı.</Text>
                                            </View>
                                        ) : (
                                            selectedStudent.assignments
                                                .filter(a => a.dueDate === getLocalDateString(calendarSelectedDate))
                                                .map(assignment => (
                                                    <TouchableOpacity
                                                        key={`assignment-${assignment.id}`}
                                                        onPress={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}
                                                    >
                                                        <GlassCard style={[styles.assignmentGlassCard, assignment.isCompleted && styles.completedAssignmentCard]}>
                                                            <View style={styles.assignmentMain}>
                                                                <View style={[styles.assignmentStatus, assignment.isCompleted && styles.completedStatus]}>
                                                                    <Text style={styles.assignmentStatusText}>{assignment.isCompleted ? '✓' : '!'}</Text>
                                                                </View>
                                                                <View style={{ flex: 1 }}>
                                                                    <View style={styles.assignmentHeaderRow}>
                                                                        <Text style={[styles.assignmentTitle, assignment.isCompleted && styles.completedText]}>
                                                                            {assignment.title}
                                                                        </Text>
                                                                        <Text style={styles.expandIcon}>{expandedAssignmentId === assignment.id ? '▼' : '▶'}</Text>
                                                                    </View>
                                                                    {expandedAssignmentId === assignment.id && (
                                                                        <View style={styles.assignmentDetails}>
                                                                            <Text style={styles.assignmentDescription}>
                                                                                {assignment.description || 'Açıklama belirtilmemiş.'}
                                                                            </Text>
                                                                            <View style={styles.assignmentMeta}>
                                                                                <Text style={styles.assignmentDueTextSmall}>📅 {assignment.dueDate}</Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </GlassCard>
                                                    </TouchableOpacity>
                                                ))
                                        )}
                                    </View>
                                </View>
                            )}

                            {activeTab === 'topics' && (
                                <View>
                                    <Text style={styles.tabTitle}>Müfredat Takibi</Text>
                                    <View style={styles.reportList}>
                                        {selectedStudent.subjects.map((subject, index) => {
                                            const dataKey = getSubjectsDataKey(selectedStudent.examType, selectedStudent.grade);
                                            const topics = (SUBJECTS_DATA[dataKey] as any)[subject] || [];
                                            const completed = selectedStudent.completedTopics.filter(t => topics.includes(t)) || [];
                                            const percent = topics.length > 0 ? Math.round((completed.length / topics.length) * 100) : 0;
                                            const isExpanded = expandedSubjects.includes(subject);

                                            // Subject-specific color coding
                                            const subjectColors: Record<string, string> = {
                                                'Matematik': '#3b82f6',
                                                'Türkçe': '#ef4444',
                                                'Geometri': '#8b5cf6',
                                                'Fizik': '#06B6D4',
                                                'Kimya': '#10b981',
                                                'Biyoloji': '#22c55e',
                                                'Tarih': '#f59e0b',
                                                'Coğrafya': '#84cc16',
                                                'Felsefe': '#a855f7',
                                                'İngilizce': '#ec4899',
                                            };
                                            const subjectColor = subjectColors[subject] || ['#3b82f6', '#06B6D4', '#A855F7', '#10b981'][index % 4];
                                            const progressColor = percent === 100 ? '#10b981' : subjectColor;

                                            return (
                                                <View key={subject} style={styles.premiumSubjectRow}>
                                                    <TouchableOpacity
                                                        style={[styles.premiumSubjectHeader, { borderColor: `${subjectColor}33`, shadowColor: subjectColor }]}
                                                        onPress={() => setExpandedSubjects(prev =>
                                                            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
                                                        )}
                                                    >
                                                        <View style={{ flex: 1 }}>
                                                            <View style={styles.subjectMetaRow}>
                                                                <Text style={styles.premiumSubjectName}>{subject}</Text>
                                                                <Text style={[styles.premiumSubjectPercent, { color: subjectColor }]}>%{percent}</Text>
                                                            </View>
                                                            <View style={styles.premiumProgressBg}>
                                                                <View style={[styles.premiumProgressFill, { width: `${percent}%`, backgroundColor: progressColor, shadowColor: progressColor }]} />
                                                            </View>
                                                        </View>
                                                        <View style={styles.expandCircle}>
                                                            <Text style={styles.expandEmoji}>{isExpanded ? '−' : '+'}</Text>
                                                        </View>
                                                    </TouchableOpacity>

                                                    {isExpanded && (
                                                        <View style={styles.detailedTopicsContainer}>
                                                            {topics.map((topic: string) => {
                                                                const isDone = selectedStudent.completedTopics.includes(topic);
                                                                return (
                                                                    <View key={topic} style={styles.topicMiniRow}>
                                                                        <View style={[styles.topicDot, isDone && styles.topicDotCompleted]} />
                                                                        <Text style={[styles.topicMiniText, isDone && styles.completedText]}>{topic}</Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {activeTab === 'books' && (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <Text style={styles.tabTitle}>Kitap Kütüphanesi</Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#a855f7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                                            onPress={() => setShowAddBookModal(true)}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Kitap Ekle</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <GlassCard style={{ padding: 16, marginBottom: 20 }}>
                                        <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 20 }}>
                                            Öğrencinin kullandığı soru bankalarını ekleyebilir ve AI yardımıyla içindekiler bölümünü analiz ederek hızlıca ödev atayabilirsiniz.
                                        </Text>
                                    </GlassCard>

                                    {(selectedStudent.books || []).length === 0 ? (
                                        <View style={{ backgroundColor: '#1e293b', padding: 40, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#475569' }}>
                                            <Text style={{ fontSize: 40, marginBottom: 16 }}>📚</Text>
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Kütüphane Boş</Text>
                                            <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 20, fontSize: 13 }}>
                                                Henüz bir kitap eklenmemiş. İlk kitabınızı ekleyerek başlayın.
                                            </Text>
                                            <Button onPress={() => setShowAddBookModal(true)} style={{ paddingHorizontal: 24 }}>
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>İlk Kitabı Ekle</Text>
                                            </Button>
                                        </View>
                                    ) : (
                                        <View style={{ gap: 12 }}>
                                            {(selectedStudent.books || []).map((book, idx) => {
                                                const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                                                const borderColor = colors[idx % colors.length];
                                                const isBookExpanded = expandedSubjects.includes(book.id);
                                                const totalTopics = (book.chapters || []).reduce((acc, c) => acc + c.topics.length, 0);

                                                return (
                                                    <View key={book.id}>
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: '#1e293b',
                                                                padding: 16,
                                                                borderRadius: 12,
                                                                borderLeftWidth: 4,
                                                                borderLeftColor: borderColor,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                            }}
                                                            onPress={() => setExpandedSubjects(prev =>
                                                                prev.includes(book.id) ? prev.filter(id => id !== book.id) : [...prev, book.id]
                                                            )}
                                                        >
                                                            <View style={{ width: 48, height: 48, backgroundColor: `${borderColor}22`, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                                                                <Text style={{ fontSize: 24 }}>📖</Text>
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{book.name}</Text>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                    <View style={{ backgroundColor: `${borderColor}33`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                                                        <Text style={{ color: borderColor, fontSize: 11, fontWeight: '700' }}>{book.subject || 'Genel'}</Text>
                                                                    </View>
                                                                    <Text style={{ color: '#64748b', fontSize: 12 }}>{book.chapters?.length || 0} Ünite • {totalTopics} Konu</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                                <TouchableOpacity
                                                                    onPress={() => handleDeleteBook(book.id, book.name)}
                                                                    style={{ padding: 8 }}
                                                                >
                                                                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                                                                </TouchableOpacity>
                                                                <Text style={{ color: '#475569', fontSize: 20 }}>{isBookExpanded ? '▼' : '▶'}</Text>
                                                            </View>
                                                        </TouchableOpacity>

                                                        {isBookExpanded && (
                                                            <View style={{ marginTop: 8, paddingLeft: 12 }}>
                                                                {(book.chapters || []).map((chapter, cIdx) => {
                                                                    const isChapterExpanded = expandedChapters.includes(`${book.id}-${chapter.title}`);
                                                                    return (
                                                                        <View key={`${book.id}-${cIdx}`} style={{ marginBottom: 4 }}>
                                                                            <TouchableOpacity
                                                                                style={{
                                                                                    flexDirection: 'row',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    padding: 12,
                                                                                    backgroundColor: '#1e293b80',
                                                                                    borderRadius: 8
                                                                                }}
                                                                                onPress={() => setExpandedChapters(prev =>
                                                                                    prev.includes(`${book.id}-${chapter.title}`)
                                                                                        ? prev.filter(id => id !== `${book.id}-${chapter.title}`)
                                                                                        : [...prev, `${book.id}-${chapter.title}`]
                                                                                )}
                                                                            >
                                                                                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>{chapter.title}</Text>
                                                                                <Text style={{ color: '#64748b', fontSize: 12 }}>{isChapterExpanded ? '▼' : '▶'}</Text>
                                                                            </TouchableOpacity>

                                                                            {isChapterExpanded && (
                                                                                <View style={{ paddingLeft: 12, marginTop: 4 }}>
                                                                                    {chapter.topics.map((topic, tIdx) => (
                                                                                        <TouchableOpacity
                                                                                            key={tIdx}
                                                                                            style={{
                                                                                                padding: 10,
                                                                                                backgroundColor: '#1e293b40',
                                                                                                borderRadius: 6,
                                                                                                marginBottom: 2,
                                                                                                flexDirection: 'row',
                                                                                                justifyContent: 'space-between',
                                                                                                alignItems: 'center'
                                                                                            }}
                                                                                            onPress={() => {
                                                                                                setTopicToAssign({ book, topic });
                                                                                                setShowBookAssignmentCalendar(true);
                                                                                            }}
                                                                                        >
                                                                                            <Text style={{ color: '#94a3b8', fontSize: 13 }}>{topic}</Text>
                                                                                            <Text style={{ color: '#a855f7', fontSize: 16 }}>+</Text>
                                                                                        </TouchableOpacity>
                                                                                    ))}
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                    );
                                                                })}
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {/* Reuse the Add Book Modal rendering logic or pull it into a function */}
                                    {showAddBookModal && (
                                        <View style={{ marginTop: 20 }}>
                                            <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#a855f7' }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>📑 Yeni Kitap Kaydı</Text>
                                                    <TouchableOpacity onPress={() => { setShowAddBookModal(false); setAccumulatedChapters([]); setNewBookName(''); }}>
                                                        <Text style={{ color: '#94a3b8', fontSize: 24 }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <Input
                                                    label="Kitap Adı"
                                                    value={newBookName}
                                                    onChangeText={setNewBookName}
                                                    placeholder="Örn: Limit Soru Bankası"
                                                />

                                                <Input
                                                    label="Ders"
                                                    value={newBookSubject}
                                                    onChangeText={setNewBookSubject}
                                                    placeholder="Örn: Matematik"
                                                    style={{ marginTop: 12 }}
                                                />

                                                {accumulatedChapters.length > 0 && (
                                                    <View style={{ backgroundColor: '#10b98115', padding: 12, borderRadius: 12, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#10b981' }}>
                                                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 14 }}>
                                                            ✅ {accumulatedChapters.length} Ünite Analiz Edildi
                                                        </Text>
                                                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                                                            Başka sayfa varsa çekmeye devam edebilirsin.
                                                        </Text>
                                                    </View>
                                                )}

                                                <View style={{ marginTop: 24, gap: 10 }}>
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: isAnalyzingToc ? '#334155' : '#a855f7',
                                                            padding: 16,
                                                            borderRadius: 12,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                        onPress={handleTakePhoto}
                                                        disabled={isAnalyzingToc}
                                                    >
                                                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                                                            {isAnalyzingToc ? '🤖 AI Analiz Ediyor...' : (accumulatedChapters.length > 0 ? '📷 Başka Sayfa Çek' : '📷 İçindekiler Fotoğrafı Çek')}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    {accumulatedChapters.length > 0 && (
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: '#10b981',
                                                                padding: 16,
                                                                borderRadius: 12,
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                            }}
                                                            onPress={handleSaveBook}
                                                            disabled={!newBookName.trim()}
                                                        >
                                                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                                                                ✓ Kitabı Kütüphaneye Ekle
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {activeTab === 'reports' && (
                                <View>
                                    {/* Hero Stats */}
                                    <View style={styles.heroStatsContainer}>
                                        <Text style={styles.heroStatsLabel}>TOPLAM ÇÖZÜLEN SORU</Text>
                                        <Text style={styles.heroStatsValue}>
                                            {selectedStudent.dailyLogs.reduce((sum, log) => sum + log.questionsSolved, 0)}
                                        </Text>
                                        <Text style={styles.heroStatsSubtext}>Son 7 günde harika bir performans! 🔥</Text>
                                    </View>

                                    <View style={[styles.reportGlassSection, { marginTop: 20 }]}>
                                        <Text style={styles.reportSubTitle}>📝 Ödev Tamamlama Oranları</Text>
                                        <View style={{ marginTop: 12 }}>
                                            {(() => {
                                                const total = selectedStudent.assignments.length;
                                                const completed = selectedStudent.assignments.filter(a => a.isCompleted).length;
                                                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                                                return (
                                                    <View>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>Genel Başarı Oranı</Text>
                                                            <Text style={{ color: '#10b981', fontSize: 24, fontWeight: '800' }}>%{rate}</Text>
                                                        </View>
                                                        <View style={{ height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' }}>
                                                            <View style={{ height: '100%', width: `${rate}%`, backgroundColor: '#10b981' }} />
                                                        </View>
                                                        <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
                                                            {total} ödevden {completed} tanesi tamamlandı.
                                                        </Text>
                                                    </View>
                                                );
                                            })()}
                                        </View>
                                    </View>

                                    <View style={styles.reportGlassSection}>
                                        <Text style={styles.reportSubTitle}>📊 Soru Çözüm Analizi (Son 7 Gün)</Text>
                                        <View style={styles.reportList}>
                                            {selectedStudent.dailyLogs.slice(-10).map((log, index) => (
                                                <View key={`${log.date}-${log.subject}-${index}`} style={styles.reportBarRow}>
                                                    <View style={{ width: 60 }}>
                                                        <Text style={styles.logDate}>{log.date.split('-').slice(1).join('/')}</Text>
                                                    </View>
                                                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                                                        <Text style={{ color: '#e2e8f0', fontSize: 12, marginBottom: 4, fontWeight: '600' }}>
                                                            {log.subject}
                                                        </Text>
                                                        <View style={styles.logBarContainer}>
                                                            <View style={[
                                                                styles.logBar,
                                                                {
                                                                    width: `${Math.min((log.questionsSolved / 200) * 100, 100)}%`,
                                                                    backgroundColor: index % 2 === 0 ? '#3b82f6' : '#06B6D4',
                                                                }
                                                            ]} />
                                                        </View>
                                                    </View>
                                                    <Text style={styles.logValue}>{log.questionsSolved}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.reportGlassSection, { marginTop: 20 }]}>
                                        <Text style={styles.reportSubTitle}>📝 Son Deneme Sınavları</Text>
                                        <View style={styles.reportList}>
                                            {selectedStudent.trialExams.map(exam => {
                                                const net = (exam.totalCorrect - (exam.totalIncorrect * 0.25)).toFixed(2);
                                                return (
                                                    <View key={exam.id} style={styles.examReportRow}>
                                                        <View style={styles.examHeader}>
                                                            <Text style={styles.examTitleText}>{exam.name}</Text>
                                                            <Text style={styles.examDate}>{exam.date}</Text>
                                                        </View>
                                                        <View style={styles.examNetRow}>
                                                            <View style={styles.netBox}>
                                                                <Text style={styles.netLabel}>NET</Text>
                                                                <Text style={styles.netValue}>{net}</Text>
                                                            </View>
                                                            <View style={styles.statDetailBox}>
                                                                <Text style={styles.correctLabel}>D: {exam.totalCorrect}</Text>
                                                                <Text style={styles.wrongLabel}>Y: {exam.totalIncorrect}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {activeTab === 'ai' && (
                                <View>
                                    <View style={styles.wizardHeader}>
                                        <TouchableOpacity onPress={() => setActiveTab('assignments')}>
                                            <Text style={styles.backBtnText}>← Geri</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.wizardTitleText}>AI Plan Oluştur</Text>
                                    </View>
                                    <GlassCard style={styles.aiLabSection}>
                                        <View style={styles.aiHeaderRow}>
                                            <Text style={styles.aiLabTitle}>🤖 AI Strateji Laboratuvarı</Text>
                                            <View style={styles.aiGlowDot} />
                                        </View>
                                        <Text style={styles.aiLabDescription}>
                                            Öğrencinin performans verilerini analiz ederek kişiselleştirilmiş bir çalışma planı oluşturun.
                                        </Text>

                                        <View style={styles.aiInputGroup}>
                                            <Text style={styles.aiInputLabel}>🎯 Odak Noktası / Notlar</Text>
                                            <Input
                                                value={aiPrompt}
                                                onChangeText={setAiPrompt}
                                                placeholder="Örn: Limit ve Türev konularına ağırlık verilmeli..."
                                                multiline
                                                numberOfLines={3}
                                                inputStyle={styles.aiTextArea}
                                            />
                                        </View>

                                        <View style={styles.aiInputRow}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.aiInputLabel}>📅 Gün</Text>
                                                <Input
                                                    value={aiPlanDuration}
                                                    onChangeText={setAiPlanDuration}
                                                    placeholder="7"
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={styles.aiInputLabel}>🕒 Günlük Saat</Text>
                                                <Input
                                                    value={aiDailyHours}
                                                    onChangeText={setAiDailyHours}
                                                    placeholder="4"
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        {/* Start Date and Weekend Exclusion Row */}
                                        <View style={styles.aiInputRow}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.aiInputLabel}>📆 Başlangıç Tarihi</Text>
                                                <Input
                                                    value={aiStartDate}
                                                    onChangeText={setAiStartDate}
                                                    placeholder="2025-02-06"
                                                />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={styles.aiInputLabel}>🚫 H.Sonu Hariç</Text>
                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: aiExcludeWeekends ? '#a855f7' : '#1e293b',
                                                        borderRadius: 8,
                                                        padding: 12,
                                                        borderWidth: 1,
                                                        borderColor: aiExcludeWeekends ? '#a855f7' : '#475569',
                                                    }}
                                                    onPress={() => setAiExcludeWeekends(!aiExcludeWeekends)}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 14 }}>
                                                        {aiExcludeWeekends ? '✓ Hafta Sonu Yok' : 'Tüm Günler'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <Button
                                            onPress={handleGeneratePlan}
                                            disabled={isGeneratingPlan}
                                            style={styles.aiGenerateButton}
                                        >
                                            <Text style={styles.aiGenerateButtonText}>
                                                {isGeneratingPlan ? '⚡ Strateji Üretiliyor...' : '🚀 Akıllı Plan Oluştur'}
                                            </Text>
                                        </Button>

                                        {/* Calendar Picker - shown after plan is generated */}
                                        {showPlanPreview && pendingPlan.length > 0 && (
                                            <View style={{ marginTop: 20 }}>
                                                <View style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#a855f7' }}>
                                                    <Text style={{ color: '#a855f7', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                                                        📅 Günleri Seçin ({selectedDatesForPlan.length}/{pendingPlan.length} gün seçildi)
                                                    </Text>
                                                    <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>
                                                        {pendingPlan.length} görev için günlere dokunarak seçin
                                                    </Text>

                                                    {/* Month Navigation */}
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <TouchableOpacity onPress={() => {
                                                            const prev = new Date(calendarCurrentMonth);
                                                            prev.setMonth(prev.getMonth() - 1);
                                                            setCalendarCurrentMonth(prev);
                                                        }}>
                                                            <Text style={{ color: '#a855f7', fontSize: 20 }}>◀</Text>
                                                        </TouchableOpacity>
                                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                                                            {MONTHS_TR[calendarCurrentMonth.getMonth()]} {calendarCurrentMonth.getFullYear()}
                                                        </Text>
                                                        <TouchableOpacity onPress={() => {
                                                            const next = new Date(calendarCurrentMonth);
                                                            next.setMonth(next.getMonth() + 1);
                                                            setCalendarCurrentMonth(next);
                                                        }}>
                                                            <Text style={{ color: '#a855f7', fontSize: 20 }}>▶</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {/* Day Headers */}
                                                    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                                                            <Text key={day} style={{ flex: 1, textAlign: 'center', color: '#64748b', fontSize: 11, fontWeight: '600' }}>{day}</Text>
                                                        ))}
                                                    </View>

                                                    {/* Calendar Grid */}
                                                    {(() => {
                                                        const year = calendarCurrentMonth.getFullYear();
                                                        const month = calendarCurrentMonth.getMonth();
                                                        const firstDay = new Date(year, month, 1);
                                                        const lastDay = new Date(year, month + 1, 0);
                                                        const startOffset = (firstDay.getDay() + 6) % 7;
                                                        const days: (number | null)[] = [];

                                                        for (let i = 0; i < startOffset; i++) days.push(null);
                                                        for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

                                                        const weeks: (number | null)[][] = [];
                                                        for (let i = 0; i < days.length; i += 7) {
                                                            weeks.push(days.slice(i, i + 7));
                                                        }

                                                        return weeks.map((week, weekIdx) => (
                                                            <View key={weekIdx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                                                {week.map((day, dayIdx) => {
                                                                    if (day === null) return <View key={dayIdx} style={{ flex: 1, height: 40 }} />;

                                                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                                    const isSelected = selectedDatesForPlan.includes(dateStr);
                                                                    const selectionIndex = selectedDatesForPlan.indexOf(dateStr);
                                                                    const today = new Date();
                                                                    const isPast = new Date(dateStr) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                                                    const canSelect = selectedDatesForPlan.length < pendingPlan.length || isSelected;

                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={dayIdx}
                                                                            style={{
                                                                                flex: 1,
                                                                                height: 40,
                                                                                justifyContent: 'center',
                                                                                alignItems: 'center',
                                                                                backgroundColor: isSelected ? '#a855f7' : 'transparent',
                                                                                borderRadius: 8,
                                                                                opacity: isPast ? 0.3 : 1,
                                                                            }}
                                                                            disabled={isPast}
                                                                            onPress={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedDatesForPlan(prev => prev.filter(d => d !== dateStr));
                                                                                } else if (canSelect) {
                                                                                    setSelectedDatesForPlan(prev => [...prev, dateStr].sort());
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Text style={{ color: isSelected ? '#fff' : '#e2e8f0', fontSize: 14, fontWeight: isSelected ? '700' : '400' }}>
                                                                                {day}
                                                                            </Text>
                                                                            {isSelected && (
                                                                                <Text style={{ color: '#fff', fontSize: 8, position: 'absolute', bottom: 2 }}>
                                                                                    {selectionIndex + 1}
                                                                                </Text>
                                                                            )}
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        ));
                                                    })()}

                                                    {/* Action Buttons */}
                                                    <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                                                        <TouchableOpacity
                                                            style={{ flex: 1, backgroundColor: '#1e293b', padding: 14, borderRadius: 8, alignItems: 'center' }}
                                                            onPress={() => {
                                                                setShowPlanPreview(false);
                                                                setPendingPlan([]);
                                                                setSelectedDatesForPlan([]);
                                                            }}
                                                        >
                                                            <Text style={{ color: '#94a3b8', fontWeight: '600' }}>İptal</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 2,
                                                                backgroundColor: selectedDatesForPlan.length === pendingPlan.length ? '#a855f7' : '#475569',
                                                                padding: 14,
                                                                borderRadius: 8,
                                                                alignItems: 'center',
                                                            }}
                                                            disabled={selectedDatesForPlan.length !== pendingPlan.length}
                                                            onPress={handleConfirmPlan}
                                                        >
                                                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                                                                {selectedDatesForPlan.length === pendingPlan.length
                                                                    ? `✓ ${pendingPlan.length} Görevi Ata`
                                                                    : `${pendingPlan.length - selectedDatesForPlan.length} gün daha seç`}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </GlassCard>
                                </View>
                            )}

                            {activeTab === 'activity' && (
                                <View>

                                    {/* B. BUGÜN YAPILACAKLAR */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>Bugün</Text>
                                        <TouchableOpacity onPress={() => studentBehavior.refresh()}>
                                            <Text style={{ color: '#a855f7', fontSize: 12 }}>Yenile ↻</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ marginBottom: 24 }}>
                                        {selectedStudent.assignments.filter(a => {
                                            const today = new Date().toISOString().split('T')[0];
                                            return a.dueDate === today;
                                        }).length > 0 ? (
                                            selectedStudent.assignments
                                                .filter(a => a.dueDate === new Date().toISOString().split('T')[0])
                                                .map(assignment => (
                                                    <View key={assignment.id} style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: '#1e293b',
                                                        borderRadius: 12,
                                                        padding: 14,
                                                        marginBottom: 8,
                                                    }}>
                                                        <View style={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: 6,
                                                            borderWidth: 2,
                                                            borderColor: assignment.isCompleted ? '#a855f7' : '#475569',
                                                            backgroundColor: assignment.isCompleted ? '#a855f7' : 'transparent',
                                                            marginRight: 12,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            {assignment.isCompleted && (
                                                                <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                                                            )}
                                                        </View>
                                                        <Text style={{
                                                            flex: 1,
                                                            color: assignment.isCompleted ? '#64748b' : '#e2e8f0',
                                                            fontSize: 14,
                                                            textDecorationLine: assignment.isCompleted ? 'line-through' : 'none',
                                                        }}>
                                                            {assignment.title}
                                                        </Text>
                                                    </View>
                                                ))
                                        ) : (
                                            <View style={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: 12,
                                                padding: 20,
                                                alignItems: 'center',
                                            }}>
                                                <Text style={{ color: '#64748b', fontSize: 14 }}>
                                                    Bugün için görev yok
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* C. HAFTALIK GÖRÜNÜM - Mini Takvim */}
                                    <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                                        Bu Hafta
                                    </Text>
                                    <StreakCalendar
                                        productiveDays={activityStats.productiveDays}
                                        currentStreak={activityStats.currentStreak}
                                    />

                                    {/* D. GELİŞİM - AI Tek Satır + Grafik (Varsa) */}
                                    <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 24 }}>
                                        Gelişim
                                    </Text>

                                    {/* AI One-Liner */}
                                    {studentBehavior.dailyCheckins.length > 0 && (
                                        <View style={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: 12,
                                            padding: 16,
                                            marginBottom: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                            <Text style={{ fontSize: 18, marginRight: 12 }}>🤖</Text>
                                            <Text style={{ flex: 1, color: '#94a3b8', fontSize: 13, lineHeight: 20 }}>
                                                {studentBehavior.currentStreak > 3
                                                    ? `Harika gidiyor! ${studentBehavior.currentStreak} gündür düzenli çalışıyor.`
                                                    : studentBehavior.currentStreak > 0
                                                        ? 'İyi başlangıç, bu ritmi koruyalım.'
                                                        : 'Motivasyon lazım, bugün başlayalım!'}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Simple Chart - Only if data exists */}
                                    {studentBehavior.exams.length > 0 && (
                                        <ExamTrendCard
                                            exams={studentBehavior.exams}
                                            onAddPress={() => { }}
                                        />
                                    )}
                                </View>
                            )}

                            {activeTab === 'settings' && (
                                <View>
                                    <Text style={styles.subSectionTitle}>Öğrenci Ayarları</Text>
                                    <Input
                                        label="Ad Soyad"
                                        value={studentName}
                                        onChangeText={setStudentName}
                                    />
                                    <Select label="Sınıf" value={studentGrade} onValueChange={setStudentGrade}>
                                        {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <SelectItem key={g} label={`${g}. Sınıf`} value={String(g)} />
                                        ))}
                                    </Select>
                                    <Select label="Sınav Türü" value={studentExamType} onValueChange={setStudentExamType}>
                                        {Object.values(EXAM_TYPES).map(et => (
                                            <SelectItem key={et} label={et} value={et} />
                                        ))}
                                    </Select>
                                    {studentExamType === EXAM_TYPES.TYT_AYT && (
                                        <Select label="Alan" value={studentField} onValueChange={setStudentField}>
                                            {Object.values(AYT_FIELDS).map(f => (
                                                <SelectItem key={f} label={f} value={f} />
                                            ))}
                                        </Select>
                                    )}
                                    <Button onPress={handleUpdateStudent} style={styles.submitButton}>
                                        <Text style={styles.buttonText}>Bilgileri Güncelle</Text>
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onPress={() => handleDeleteStudent(selectedStudent.id, selectedStudent.name)}
                                        style={[styles.submitButton, { marginTop: 12, backgroundColor: '#ef444422', borderColor: '#ef4444' }]}
                                    >
                                        <Text style={[styles.buttonText, { color: '#ef4444' }]}>Öğrenciyi Sil</Text>
                                    </Button>
                                </View>
                            )}
                        </View>
                    </View>
                )
                }
            </ScrollView >

            {/* Add Student Modal */}
            < Modal
                isOpen={isAddStudentOpen}
                onClose={() => {
                    setAddStudentOpen(false);
                    resetStudentForm();
                }}
                title="Yeni Öğrenci Ekle"
            >
                <Input
                    label="Tam Ad"
                    value={studentName}
                    onChangeText={setStudentName}
                    placeholder="Öğrenci adı"
                />
                <Input
                    label="E-posta"
                    value={studentEmail}
                    onChangeText={setStudentEmail}
                    placeholder="ornek@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <Input
                    label="Şifre"
                    value={studentPassword}
                    onChangeText={setStudentPassword}
                    placeholder="Şifre"
                    secureTextEntry
                />
                <Select
                    label="Sınav Türü"
                    value={studentExamType}
                    onValueChange={setStudentExamType}
                >
                    <SelectItem label="Sınav türü seçin" value="" />
                    {Object.values(EXAM_TYPES).map(et => (
                        <SelectItem key={et} label={et} value={et} />
                    ))}
                </Select>
                {
                    studentExamType === EXAM_TYPES.TYT_AYT && (
                        <Select label="Alan" value={studentField} onValueChange={setStudentField}>
                            <SelectItem label="Alan seçin" value="" />
                            {Object.values(AYT_FIELDS).map(f => (
                                <SelectItem key={f} label={f} value={f} />
                            ))}
                        </Select>
                    )
                }
                <Select label="Sınıf" value={studentGrade} onValueChange={setStudentGrade}>
                    <SelectItem label="Sınıf seçin" value="" />
                    {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                        <SelectItem key={g} label={`${g}. Sınıf`} value={String(g)} />
                    ))}
                </Select>
                <Button onPress={handleAddStudent} style={styles.submitButton}>
                    <Text style={styles.buttonText}>Öğrenci Ekle</Text>
                </Button>
            </Modal >

            <AIAnalysisModal
                visible={showAIAnalysisModal}
                onClose={() => setShowAIAnalysisModal(false)}
                weeklyActivityChange={premiumStats.weeklyChange}
                totalOverdueTasks={getTotalOverdueCount(myStudents)}
                studentCount={myStudents.length}
                criticalCount={getCriticalStudentsCount(myStudents)}
                activeStudents={premiumStats.activeStudents}
                avgCompletionRate={premiumStats.weeklyCompletionRate}
                topStudents={sortStudentsByRisk(myStudents)
                    .map(s => {
                        const riskInfo = getStudentRiskInfo(s);
                        return {
                            name: s.name,
                            lastActive: riskInfo.passiveDays === 0 ? 'Bugün' : `${riskInfo.passiveDays}g`,
                            overdueCount: riskInfo.overdueCount,
                            completionRate: riskInfo.weeklyCompletionRate
                        };
                    })
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .slice(0, 5)}
                atRiskStudents={sortStudentsByRisk(myStudents)
                    .filter(s => {
                        const riskInfo = getStudentRiskInfo(s);
                        return riskInfo.label === 'Kritik' || riskInfo.label === 'Dikkat';
                    })
                    .map(s => {
                        const riskInfo = getStudentRiskInfo(s);
                        return {
                            name: s.name,
                            lastActive: riskInfo.passiveDays === 0 ? 'Bugün' : `${riskInfo.passiveDays}g`,
                            overdueCount: riskInfo.overdueCount,
                            completionRate: riskInfo.weeklyCompletionRate
                        };
                    })
                    .slice(0, 5)}
            />

            {/* Add Assignment Modal */}
            < Modal
                isOpen={isAddAssignmentOpen}
                onClose={() => {
                    setAddAssignmentOpen(false);
                    setAssignmentTitle('');
                    setAssignmentDesc('');
                }}
                title="Ödev Ata"
            >
                <Input
                    label="Ödev Başlığı"
                    value={assignmentTitle}
                    onChangeText={setAssignmentTitle}
                    placeholder="Örn: Matematik - Türev Testi"
                />
                <Input
                    label="Açıklama"
                    value={assignmentDesc}
                    onChangeText={setAssignmentDesc}
                    placeholder="Ödev açıklaması"
                    multiline
                    numberOfLines={3}
                />
                <Input
                    label="Son Tarih (YYYY-MM-DD)"
                    value={assignmentDueDate}
                    onChangeText={setAssignmentDueDate}
                    placeholder="2024-12-31"
                />
                <Button onPress={handleAddAssignment} style={styles.submitButton}>
                    <Text style={styles.buttonText}>Ödev Ata</Text>
                </Button>
            </Modal >

            {/* Book Assignment Calendar Modal */}
            <Modal
                isOpen={showBookAssignmentCalendar}
                onClose={() => setShowBookAssignmentCalendar(false)}
                title="Atama Tarihi Seç"
            >
                <View style={{ padding: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                        {topicToAssign?.book.name}
                    </Text>
                    <Text style={{ color: '#a855f7', fontSize: 14, marginBottom: 20 }}>
                        {topicToAssign?.topic}
                    </Text>

                    <View style={styles.bookAssignCalendarContainer}>
                        <View style={styles.bookAssignCalendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)}>
                                <Text style={styles.bookAssignMonthNav}>◀</Text>
                            </TouchableOpacity>
                            <Text style={styles.bookAssignCalendarMonthTitle}>
                                {MONTHS_TR[calendarCurrentMonth.getMonth()]} {calendarCurrentMonth.getFullYear()}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <Text style={styles.bookAssignMonthNav}>▶</Text>
                            </TouchableOpacity>
                        </View>
                        {renderAssignmentCalendar()}
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                            Seçilen Tarih: {getLocalDateString(calendarSelectedDate)}
                        </Text>
                        <Button
                            onPress={() => {
                                if (topicToAssign) {
                                    handleAssignTopicFromBook(topicToAssign.book, topicToAssign.topic);
                                    setShowBookAssignmentCalendar(false);
                                }
                            }}
                            style={styles.submitButton}
                        >
                            <Text style={styles.buttonText}>Tarihi Onayla & Ata</Text>
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Bottom Navigation Bar - Only when student is selected */}
            {
                selectedStudent && (
                    <View style={styles.bottomNavBar}>
                        {[
                            { id: 'activity', label: 'Aktivite', icon: '🔥' },
                            { id: 'assignments', label: 'Ödevler', icon: '📝' },
                            { id: 'topics', label: 'Konular', icon: '📚' },
                            { id: 'books', label: 'Kitaplar', icon: '📕' },
                            { id: 'reports', label: 'Raporlar', icon: '📈' },
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.bottomNavItem, activeTab === tab.id && styles.bottomNavItemActive]}
                                onPress={() => setActiveTab(tab.id as any)}
                            >
                                <Text style={styles.bottomNavIcon}>{tab.icon}</Text>
                                <Text style={[styles.bottomNavLabel, activeTab === tab.id && styles.bottomNavLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )
            }
            {/* PREMIUM: Subscription CTA Bar */}
            {!selectedStudent && <SubscriptionCTABar />}

            {/* PREMIUM: Upgrade Modal */}
            <UpgradeModal />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1f2937',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
    },
    welcomeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitleText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 16,
        paddingBottom: 150,
    },
    statsGrid: {
        marginBottom: 16,
    },
    statGlassCard: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3b82f633',
    },
    statIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#9ca3af',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    addStudentBar: {
        backgroundColor: '#05966922',
        borderWidth: 1,
        borderColor: '#05966944',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    addStudentBarText: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activitiesCard: {
        marginBottom: 20,
        padding: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    activityDesc: {
        color: '#9ca3af',
        fontSize: 12,
    },
    activityDate: {
        color: '#6b7280',
        fontSize: 11,
    },
    emptyTextSmall: {
        color: '#6b7280',
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 10,
    },
    studentsCard: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f293788',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#374151',
    },
    selectedStudentCard: {
        borderColor: '#2563eb',
        backgroundColor: '#1e3a5f88',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f633',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#3b82f644',
    },
    studentAvatarText: {
        color: '#60a5fa',
        fontSize: 18,
        fontWeight: 'bold',
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    studentExam: {
        color: '#9ca3af',
        fontSize: 13,
    },
    studentStats: {
        marginRight: 12,
    },
    statText: {
        color: '#d1d5db',
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    deleteButtonText: {
        fontSize: 18,
    },
    detailsFullCard: {
        marginBottom: 20,
        backgroundColor: '#1f2937ee',
        padding: 0,
        overflow: 'hidden',
        minHeight: 600,
        borderRadius: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1f2937',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    backButtonText: {
        color: '#60a5fa',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailsTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    studentProfileBrief: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentLargeAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#60a5fa44',
    },
    studentLargeAvatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statusPulse: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#1f2937',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusBadge: {
        backgroundColor: '#10b98122',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    statusBadgeText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    performanceText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: '#3b82f6',
    },
    tabIcon: {
        fontSize: 18,
        marginBottom: 2,
    },
    tabLabel: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '500',
    },
    activeTabLabel: {
        color: '#fff',
    },
    // Android Redesign Styles
    androidHeader: {
        backgroundColor: '#1f2937',
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    androidHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    androidBackBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    androidBackIcon: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '300',
    },
    androidHeaderTitles: {
        flex: 1,
        marginLeft: 8,
    },
    androidStudentName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    androidStudentSub: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 2,
    },
    androidProfileBtn: {
        marginLeft: 8,
    },
    androidAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#60a5fa44',
    },
    androidAvatarTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    androidTabBar: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    androidTabItem: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        position: 'relative',
    },
    androidTabItemActive: {
        // backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    androidTabLabel: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    androidTabLabelActive: {
        color: '#3b82f6',
    },
    androidTabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 12,
        right: 12,
        height: 3,
        backgroundColor: '#3b82f6',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    fabIcon: {
        fontSize: 28,
        color: '#fff',
    },
    tabContent: {
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        color: '#9ca3af',
        fontSize: 14,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    smallButton: {
        backgroundColor: '#7c3aed33',
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 30,
    },
    smallButtonText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cockpitStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    cockpitStatCard: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cockpitStatLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    cockpitStatValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        textShadowColor: 'rgba(168, 85, 247, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    infoGlassSection: {
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoCol: {
        width: '50%',
        marginBottom: 16,
    },
    studentStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: '#37415199',
        padding: 16,
        borderRadius: 12,
        minWidth: 90,
    },
    statNumber: {
        color: '#60a5fa',
        fontSize: 28,
        fontWeight: 'bold',
    },
    actionButtonDetail: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonDetailText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    assignmentGlassCard: {
        backgroundColor: 'rgba(55, 65, 81, 0.3)',
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    assignmentMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    assignmentStatus: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f59e0b22',
        borderWidth: 1,
        borderColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    completedStatus: {
        backgroundColor: '#10b98122',
        borderColor: '#10b981',
    },
    assignmentStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    assignmentDueText: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 2,
    },
    premiumSubjectRow: {
        marginBottom: 20,
    },
    premiumSubjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(168, 85, 247, 0.2)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    subjectMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    premiumSubjectName: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    premiumSubjectPercent: {
        color: '#A855F7',
        fontSize: 14,
        fontWeight: '800',
    },
    premiumProgressBg: {
        height: 10,
        backgroundColor: 'rgba(55, 65, 81, 0.4)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    premiumProgressFill: {
        height: '100%',
        borderRadius: 5,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    expandCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    expandEmoji: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailedTopicsContainer: {
        marginTop: 8,
        paddingLeft: 12,
        gap: 8,
    },
    topicMiniRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    topicDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4b5563',
        marginRight: 10,
    },
    topicDotCompleted: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    topicMiniText: {
        color: '#d1d5db',
        fontSize: 13,
    },
    heroStatsContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    heroStatsLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    heroStatsValue: {
        color: '#fff',
        fontSize: 56,
        fontWeight: '900',
        textShadowColor: 'rgba(6, 182, 212, 0.8)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 16,
    },
    heroStatsSubtext: {
        color: '#06B6D4',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    reportGlassSection: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    reportSubTitle: {
        color: '#06B6D4',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    reportBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    examReportRow: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    examHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    examTitleText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    examDate: {
        color: '#6b7280',
        fontSize: 11,
    },
    examNetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    netBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f622',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    netLabel: {
        color: '#3b82f6',
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 6,
    },
    netValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statDetailBox: {
        flexDirection: 'row',
        gap: 12,
    },
    correctLabel: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '600',
    },
    wrongLabel: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
    },
    aiLabSection: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
    },
    aiHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    aiLabTitle: {
        color: '#a78bfa',
        fontSize: 18,
        fontWeight: 'bold',
    },
    aiGlowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#a78bfa',
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
    aiLabDescription: {
        color: '#9ca3af',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20,
    },
    aiInputGroup: {
        marginBottom: 16,
    },
    aiInputLabel: {
        color: '#d1d5db',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        marginLeft: 4,
    },
    aiTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    aiInputRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    aiGenerateButton: {
        backgroundColor: '#7c3aed',
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    aiGenerateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    emptyStateContainer: {
        padding: 40,
        alignItems: 'center',
    },
    subSectionTitle: {
        color: '#d1d5db',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        paddingBottom: 8,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#6b7280',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    assignmentTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
    },
    assignmentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expandIcon: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        marginLeft: 8,
    },
    assignmentDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    assignmentDescription: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        lineHeight: 20,
    },
    assignmentMeta: {
        flexDirection: 'row',
        marginTop: 8,
    },
    assignmentDueTextSmall: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
    completedAssignmentCard: {
        opacity: 0.8,
    },
    calendarContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: 'rgba(55, 65, 81, 0.2)',
    },
    assignmentWizardContainer: {
        padding: 16,
        marginBottom: 16,
    },
    wizardSubtitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    wizardButtonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    wizardBtn: {
        width: '47%',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    wizardBtnIcon: {
        fontSize: 26,
        marginBottom: 6,
    },
    wizardBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    wizardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtnText: {
        color: '#3b82f6',
        fontSize: 14,
        marginRight: 16,
    },
    wizardTitleText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    aiDraftText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    bookDraftText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    standardForm: {
        gap: 8,
    },
    subTabTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthNavBtn: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNavText: {
        color: '#60a5fa',
        fontSize: 18,
    },
    currentMonthText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarHeaderCell: {
        width: '14.28%',
        alignItems: 'center',
        marginBottom: 8,
    },
    calendarHeaderText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
    },
    calendarDayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    calendarDayText: {
        color: '#d1d5db',
        fontSize: 14,
    },
    selectedDayCell: {
        backgroundColor: '#3b82f6',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    todayCell: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    todayText: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    calendarDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
    },
    dateLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        marginLeft: 4,
    },
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    topicItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '48.5%',
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicItemText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    subjectItem: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        paddingVertical: 20,
    },
    topicForm: {
        minHeight: 200,
    },
    emptyStateContainerSmall: {
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        alignItems: 'center',
    },
    tabTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    aiForm: {
        paddingTop: 8,
    },
    bookForm: {
        paddingTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 20,
    },
    reportList: {
        gap: 12,
    },
    logDate: {
        color: '#9ca3af',
        fontSize: 12,
        width: 80,
    },
    logBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#374151',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    logBar: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
    },
    logValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'right',
    },
    // Header Icon Buttons (AI Plan & Settings)
    headerIconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerIconBtnActive: {
        backgroundColor: 'rgba(168, 85, 247, 0.3)',
        borderColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
    },
    headerIconEmoji: {
        fontSize: 18,
    },
    // Bottom Navigation Bar
    bottomNavBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: 8,
        paddingHorizontal: 8,
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottomNavItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 16,
    },
    bottomNavItemActive: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
    },
    bottomNavIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    bottomNavLabel: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '600',
    },
    bottomNavLabelActive: {
        color: '#A855F7',
        fontWeight: '700',
    },
    // Summary Section Premium Styles
    summaryHeroSection: {
        marginBottom: 20,
    },
    summaryHeroCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroStatNumber: {
        fontSize: 56,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(168, 85, 247, 0.6)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 16,
    },
    heroStatLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 8,
        letterSpacing: 1,
    },
    heroGlowBar: {
        width: 80,
        height: 4,
        backgroundColor: '#A855F7',
        borderRadius: 2,
        marginTop: 16,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    summaryStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 20,
    },
    summaryMiniCard: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    summaryMiniIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    summaryMiniValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    summaryMiniLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryInfoCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    summaryInfoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    summaryInfoDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 16,
    },
    summaryInfoGrid: {
        gap: 12,
    },
    summaryInfoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 12,
    },
    summaryInfoLabel: {
        fontSize: 14,
        color: '#94A3B8',
    },
    summaryInfoValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    // Coach Dashboard Premium Styles
    dashboardHero: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    dashboardHeroContent: {
        alignItems: 'center',
    },
    dashboardHeroEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    dashboardHeroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
    },
    dashboardHeroSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    dashboardStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 20,
    },
    dashboardStatCard: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    dashboardStatEmoji: {
        fontSize: 20,
        marginBottom: 6,
    },
    dashboardStatNumber: {
        fontSize: 24,
        fontWeight: '800',
    },
    dashboardStatLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    dashboardAddButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#10b981',
        borderStyle: 'dashed',
    },
    dashboardAddButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 10,
    },
    dashboardAddButtonIcon: {
        fontSize: 20,
    },
    dashboardAddButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    dashboardSection: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    dashboardSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dashboardSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    dashboardBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    dashboardBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#A855F7',
    },
    dashboardEmptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    dashboardEmptyIcon: {
        fontSize: 36,
        marginBottom: 8,
        opacity: 0.5,
    },
    dashboardEmptyText: {
        fontSize: 14,
        color: '#6b7280',
    },
    dashboardActivityList: {
        gap: 12,
    },
    dashboardActivityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        padding: 12,
        borderRadius: 12,
    },
    dashboardActivityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#A855F7',
        marginRight: 12,
    },
    dashboardActivityContent: {
        flex: 1,
    },
    dashboardActivityName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    dashboardActivityDesc: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    dashboardActivityDate: {
        fontSize: 11,
        color: '#6b7280',
    },
    dashboardStudentList: {
        gap: 12,
    },
    dashboardStudentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    dashboardStudentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dashboardStudentAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3b82f6',
    },
    dashboardStudentInfo: {
        flex: 1,
    },
    dashboardStudentName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    dashboardStudentMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    dashboardStudentStats: {
        alignItems: 'center',
        marginRight: 12,
    },
    dashboardStudentStatNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f59e0b',
    },
    dashboardStudentStatLabel: {
        fontSize: 9,
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    dashboardDeleteBtn: {
        padding: 8,
        opacity: 0.6,
    },
    // Book Assignment Calendar Styles
    bookAssignCalendarContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 10,
    },
    bookAssignCalendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bookAssignMonthNav: {
        color: '#a855f7',
        fontSize: 18,
        fontWeight: 'bold',
        padding: 10,
    },
    bookAssignCalendarMonthTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
