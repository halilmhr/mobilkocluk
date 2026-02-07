import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

type Mood = 'good' | 'ok' | 'bad';
type Difficulty = 'easy' | 'medium' | 'hard';
type StudyDuration = '0-30' | '30-60' | '60+';
type TopicStatus = 'not_started' | 'in_progress' | 'completed';

interface DailyCheckin {
    id: string;
    date: string;
    mood: Mood;
    hardSubject?: string;
}

interface HomeworkLog {
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    dueDate: string;
    completedAt?: string;
    difficulty?: Difficulty;
    isLate: boolean;
}

interface SubjectProgress {
    id: string;
    subject: string;
    topic: string;
    status: TopicStatus;
}

interface Exam {
    id: string;
    date: string;
    netScore: number;
    examType?: string;
}

interface StudyTimeLog {
    id: string;
    date: string;
    duration: StudyDuration;
}

interface DailyQuestionLog {
    id: string;
    date: string;
    subject: string;
    questionsSolved: number;
}

export const useStudentBehavior = (studentId: string | null) => {
    const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
    const [homeworkLogs, setHomeworkLogs] = useState<HomeworkLog[]>([]);
    const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [studyTimeLogs, setStudyTimeLogs] = useState<StudyTimeLog[]>([]);
    const [dailyQuestionLogs, setDailyQuestionLogs] = useState<DailyQuestionLog[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    // Fetch all behavioral data
    const fetchBehaviorData = useCallback(async () => {
        if (!studentId) {
            console.log('DEBUG: [useStudentBehavior] No studentId provided.');
            setLoading(false);
            return;
        }
        console.log('DEBUG: [useStudentBehavior] Fetching data for studentId:', studentId, ' (Type:', typeof studentId, ')');

        setLoading(true);
        try {
            // Fetch daily checkins
            const { data: checkins } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false })
                .limit(30);

            // Fetch homework logs
            const { data: homework } = await supabase
                .from('homework_logs')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            // Fetch subject progress
            const { data: progress } = await supabase
                .from('subject_progress')
                .select('*')
                .eq('student_id', studentId);

            // Fetch trial exams (the detailed ones)
            const { data: examData } = await supabase
                .from('trial_exams')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false })
                .limit(10);

            // Fetch study time logs
            const { data: studyTime } = await supabase
                .from('study_time_logs')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false })
                .limit(30);

            // Fetch daily question logs
            const { data: questionLogs } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false })
                .limit(30);

            if (checkins) {
                setDailyCheckins(checkins.map(c => ({
                    id: c.id,
                    date: c.date,
                    mood: c.mood as Mood,
                    hardSubject: c.hard_subject,
                })));
            }

            if (homework) {
                setHomeworkLogs(homework.map(h => ({
                    id: h.id,
                    assignmentId: h.assignment_id,
                    assignmentTitle: h.assignment_title,
                    dueDate: h.due_date,
                    completedAt: h.completed_at,
                    difficulty: h.difficulty as Difficulty,
                    isLate: h.is_late,
                })));
            }

            if (progress) {
                setSubjectProgress(progress.map(p => ({
                    id: p.id,
                    subject: p.subject,
                    topic: p.topic,
                    status: p.status as TopicStatus,
                })));
            }

            if (examData) {
                setExams(examData.map(e => ({
                    id: e.id,
                    date: e.date,
                    // Calculate net score: Correct - (Incorrect * 0.25)
                    netScore: e.total_correct - (e.total_incorrect * 0.25),
                    examType: e.type || e.name,
                })));
            }

            if (studyTime) {
                setStudyTimeLogs(studyTime.map(s => ({
                    id: s.id,
                    date: s.date,
                    duration: s.duration as StudyDuration,
                })));
            }

            if (questionLogs) {
                setDailyQuestionLogs(questionLogs.map(q => ({
                    id: q.id,
                    date: q.date,
                    subject: q.subject,
                    questionsSolved: q.questions_solved,
                })));
            }
        } catch (error: any) {
            console.error('DEBUG: [fetchBehaviorData] Error:', error.message || error);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchBehaviorData();
    }, [fetchBehaviorData]);

    // Check if today's checkin exists
    const hasCheckedInToday = dailyCheckins.some(c => c.date === today);
    const hasLoggedStudyTimeToday = studyTimeLogs.some(s => s.date === today);

    // Submit daily checkin
    const submitDailyCheckin = async (mood: Mood, hardSubject?: string) => {
        if (!studentId) return;

        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .upsert({
                    student_id: studentId,
                    date: today,
                    mood,
                    hard_subject: hardSubject,
                })
                .select()
                .single();

            if (error) {
                console.error('DEBUG: [submitDailyCheckin] Supabase Error:', error);
                return;
            }

            if (data) {
                console.log('DEBUG: [submitDailyCheckin] Success:', data);
                setDailyCheckins(prev => [{
                    id: data.id,
                    date: data.date,
                    mood: data.mood as Mood,
                    hardSubject: data.hard_subject,
                }, ...prev.filter(c => c.date !== today)]);
            }
        } catch (error: any) {
            console.error('DEBUG: [submitDailyCheckin] Runtime Error:', error.message || error);
        }
    };

    // Log homework completion with difficulty
    const logHomeworkCompletion = async (
        assignmentId: string,
        assignmentTitle: string,
        dueDate: string,
        difficulty: Difficulty
    ) => {
        if (!studentId) return;

        const completedAt = new Date().toISOString();
        const isLate = new Date(dueDate) < new Date(completedAt.split('T')[0]);

        try {
            const { data, error } = await supabase
                .from('homework_logs')
                .upsert({
                    student_id: studentId,
                    assignment_id: assignmentId,
                    assignment_title: assignmentTitle,
                    due_date: dueDate,
                    completed_at: completedAt,
                    difficulty,
                    is_late: isLate,
                })
                .select()
                .single();

            if (error) {
                console.error('DEBUG: [logHomeworkCompletion] Supabase Error:', error);
                return;
            }

            if (data) {
                console.log('DEBUG: [logHomeworkCompletion] Success:', data);
                setHomeworkLogs(prev => [{
                    id: data.id,
                    assignmentId: data.assignment_id,
                    assignmentTitle: data.assignment_title,
                    dueDate: data.due_date,
                    completedAt: data.completed_at,
                    difficulty: data.difficulty as Difficulty,
                    isLate: data.is_late,
                }, ...prev.filter(h => h.assignmentId !== assignmentId)]);
            }
        } catch (error: any) {
            console.error('DEBUG: [logHomeworkCompletion] Runtime Error:', error.message || error);
        }
    };

    // Update topic status
    const updateTopicStatus = async (subject: string, topic: string, status: TopicStatus) => {
        if (!studentId) return;

        try {
            const { data, error } = await supabase
                .from('subject_progress')
                .upsert({
                    student_id: studentId,
                    subject,
                    topic,
                    status,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('DEBUG: [updateTopicStatus] Supabase Error:', error);
                return;
            }

            if (data) {
                console.log('DEBUG: [updateTopicStatus] Success:', data);
                setSubjectProgress(prev => {
                    const existing = prev.findIndex(p => p.subject === subject && p.topic === topic);
                    const newItem = {
                        id: data.id,
                        subject: data.subject,
                        topic: data.topic,
                        status: data.status as TopicStatus,
                    };
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = newItem;
                        return updated;
                    }
                    return [...prev, newItem];
                });
            }
        } catch (error: any) {
            console.error('DEBUG: [updateTopicStatus] Runtime Error:', error.message || error);
        }
    };

    // Add exam result
    const addExamResult = async (date: string, netScore: number, examType: string) => {
        if (!studentId) return;

        try {
            const { data, error } = await supabase
                .from('trial_exams')
                .insert({
                    student_id: studentId,
                    date,
                    net_score: netScore,
                    exam_type: examType,
                })
                .select()
                .single();

            if (!error && data) {
                setExams(prev => [{
                    id: data.id,
                    date: data.date,
                    netScore: data.net_score,
                    examType: data.exam_type,
                }, ...prev]);
            }
        } catch (error) {
            console.error('Error adding exam:', error);
        }
    };

    // Log study time
    const logStudyTime = async (duration: StudyDuration) => {
        if (!studentId) return;

        try {
            const { data, error } = await supabase
                .from('study_time_logs')
                .upsert({
                    student_id: studentId,
                    date: today,
                    duration,
                })
                .select()
                .single();

            if (!error && data) {
                setStudyTimeLogs(prev => [{
                    id: data.id,
                    date: data.date,
                    duration: data.duration as StudyDuration,
                }, ...prev.filter(s => s.date !== today)]);
            }
        } catch (error: any) {
            console.error('DEBUG: [logStudyTime] Runtime Error:', error.message || error);
        }
    };

    // Log daily questions
    const logDailyQuestions = async (logs: { subject: string; questionsSolved: number }[]) => {
        if (!studentId) return;

        try {
            const inserts = logs.map(log => ({
                student_id: studentId,
                date: today,
                subject: log.subject,
                questions_solved: log.questionsSolved,
            }));

            const { data, error } = await supabase
                .from('daily_logs')
                .upsert(inserts)
                .select();

            if (error) {
                console.error('DEBUG: [logDailyQuestions] Supabase Error:', error);
                return;
            }

            if (data) {
                console.log('DEBUG: [logDailyQuestions] Success:', data);
                setDailyQuestionLogs(prev => {
                    const filtered = prev.filter(p => p.date !== today);
                    const newLogs = data.map(d => ({
                        id: d.id,
                        date: d.date,
                        subject: d.subject,
                        questionsSolved: d.questions_solved,
                    }));
                    return [...newLogs, ...filtered];
                });
            }
        } catch (error: any) {
            console.error('DEBUG: [logDailyQuestions] Runtime Error:', error.message || error);
        }
    };

    // Calculate productive days for streak calendar
    const productiveDays = useMemo(() => {
        const days = new Set<string>();

        // 1. Days with study time > 0-30
        studyTimeLogs.forEach(s => {
            if (s.duration !== '0-30') days.add(s.date);
        });

        // 2. Days with question logs
        dailyQuestionLogs.forEach(q => {
            if (q.questionsSolved > 0) days.add(q.date);
        });

        // 3. Days with homework completions
        homeworkLogs.forEach(h => {
            if (h.completedAt) {
                days.add(h.completedAt.split('T')[0]);
            }
        });

        return Array.from(days).sort();
    }, [studyTimeLogs, dailyQuestionLogs, homeworkLogs]);

    // Calculate current streak
    const calculateStreak = () => {
        if (productiveDays.length === 0) return 0;

        let streak = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if active today or yesterday to continue streak
        const isActiveNear = productiveDays.includes(todayStr) || productiveDays.includes(yesterdayStr);
        if (!isActiveNear) return 0;

        const checkDate = productiveDays.includes(todayStr) ? new Date() : yesterday;

        const sortedDays = [...productiveDays].sort((a, b) =>
            new Date(b).getTime() - new Date(a).getTime()
        );

        for (const day of sortedDays) {
            const dayStr = new Date(day).toISOString().split('T')[0];
            const currentCheckStr = checkDate.toISOString().split('T')[0];

            if (dayStr === currentCheckStr) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dayStr < currentCheckStr) {
                break;
            }
        }
        return streak;
    };

    return {
        // Data
        dailyCheckins,
        homeworkLogs,
        subjectProgress,
        exams,
        studyTimeLogs,
        dailyQuestionLogs,
        productiveDays,
        loading,

        // Computed
        hasCheckedInToday,
        hasLoggedStudyTimeToday,
        currentStreak: calculateStreak(),
        todayStudyDuration: studyTimeLogs.find(s => s.date === today)?.duration,
        todayTotalQuestions: dailyQuestionLogs
            .filter(q => q.date === today)
            .reduce((sum, q) => sum + q.questionsSolved, 0),

        // Actions
        submitDailyCheckin,
        logHomeworkCompletion,
        updateTopicStatus,
        addExamResult,
        logStudyTime,
        logDailyQuestions,
        refresh: fetchBehaviorData,
    };
};
