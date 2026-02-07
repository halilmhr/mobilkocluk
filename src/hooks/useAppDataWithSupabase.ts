import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Student, UserRole, DailyLog, TrialExam, Assignment, Book } from '../types';
import { getSubjectsForStudent, EXAM_TYPES, AYT_FIELDS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const pseudoHash = (password: string) => `hashed_${password}`;

const useAppDataWithSupabase = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [useSupabase] = useState(isSupabaseConfigured());

    useEffect(() => {
        const initializeData = async () => {
            try {
                if (useSupabase) {
                    await loadDataFromSupabase();
                } else {
                    await loadDataFromAsyncStorage();
                }
            } catch (error) {
                console.error("Failed to load data", error);
                if (useSupabase) {
                    await loadDataFromAsyncStorage();
                }
            } finally {
                setIsLoading(false);
            }
        };
        initializeData();
    }, [useSupabase]);

    // Session restore
    useEffect(() => {
        const restoreSession = async () => {
            if (!isLoading && users.length > 0 && !currentUser) {
                const savedUserId = await AsyncStorage.getItem('current_user_id');
                if (savedUserId) {
                    const user = users.find(u => u.id === savedUserId);
                    if (user) {
                        setCurrentUser(user);
                    } else {
                        await AsyncStorage.removeItem('current_user_id');
                    }
                }
            }
        };
        restoreSession();
    }, [isLoading, users, currentUser]);

    const loadDataFromAsyncStorage = async () => {
        const storedUsers = await AsyncStorage.getItem('app_users');
        const storedStudents = await AsyncStorage.getItem('app_students');

        let initialUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        let initialStudents: Student[] = storedStudents ? JSON.parse(storedStudents) : [];

        if (initialUsers.length === 0) {
            const coachId = `coach_${Date.now()}`;
            const defaultCoach: User = {
                id: coachId,
                name: 'Koç Yönetici',
                email: 'koc@example.com',
                passwordHash: pseudoHash('sifre'),
                role: 'coach',
            };
            initialUsers.push(defaultCoach);

            const studentId = `student_${Date.now() + 1}`;
            const defaultStudentUser: User = {
                id: studentId,
                name: 'Örnek Öğrenci',
                email: 'ogrenci@example.com',
                passwordHash: pseudoHash('sifre'),
                role: 'student'
            };
            initialUsers.push(defaultStudentUser);

            const defaultStudent: Student = {
                id: studentId,
                name: 'Örnek Öğrenci',
                coachId: coachId,
                examType: EXAM_TYPES.TYT_AYT,
                field: AYT_FIELDS.SAYISAL,
                subjects: getSubjectsForStudent(EXAM_TYPES.TYT_AYT, AYT_FIELDS.SAYISAL),
                assignments: [],
                dailyLogs: [],
                trialExams: [],
                completedTopics: [],
                books: []
            };
            initialStudents.push(defaultStudent);
        }

        setUsers(initialUsers);
        setStudents(initialStudents);
    };

    const loadDataFromSupabase = async () => {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*');

        if (usersError) throw usersError;

        const loadedUsers: User[] = (usersData || []).map((u: any) => ({
            id: u.id,
            email: u.email,
            passwordHash: u.password_hash,
            role: u.role as UserRole,
            name: u.name,
        }));

        const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select(`*, assignments(*), daily_logs(*), trial_exams(*, subject_results(*)), books(*)`);

        if (studentsError) throw studentsError;

        const loadedStudents: Student[] = (studentsData || []).map((s: any) => ({
            id: s.id,
            coachId: s.coach_id,
            name: loadedUsers.find(u => u.id === s.id)?.name || '',
            examType: s.exam_type,
            field: s.field,
            subjects: s.subjects || [],
            completedTopics: s.completed_topics || [],
            lastActive: s.last_active || null,
            assignments: (s.assignments || []).map((a: any) => ({
                id: a.id,
                title: a.title,
                description: a.description || '',
                dueDate: a.due_date,
                isCompleted: a.is_completed,
                youtubeUrl: a.youtube_url,
            })),
            dailyLogs: (s.daily_logs || []).map((dl: any) => ({
                date: dl.date,
                subject: dl.subject,
                questionsSolved: dl.questions_solved,
            })),
            trialExams: (s.trial_exams || []).map((te: any) => ({
                id: te.id,
                name: te.name,
                date: te.date,
                type: te.type,
                totalCorrect: te.total_correct,
                totalIncorrect: te.total_incorrect,
                totalBlank: te.total_blank,
                subjectResults: (te.subject_results || []).map((sr: any) => ({
                    subject: sr.subject,
                    correct: sr.correct,
                    incorrect: sr.incorrect,
                    blank: sr.blank,
                })),
            })),
            books: (s.books || []).map((b: any) => ({
                id: b.id,
                name: b.name,
                subject: b.subject,
                tocImageUri: b.toc_image_uri,
                chapters: b.chapters || [],
                topics: b.topics || [], // Keep legacy topics if any
                createdAt: b.created_at,
            })),
        }));

        setUsers(loadedUsers);
        setStudents(loadedStudents);
    };

    // Persist to AsyncStorage
    useEffect(() => {
        const saveData = async () => {
            if (!isLoading && !useSupabase) {
                await AsyncStorage.setItem('app_users', JSON.stringify(users));
                await AsyncStorage.setItem('app_students', JSON.stringify(students));
            }
        };
        saveData();
    }, [users, students, isLoading, useSupabase]);

    const updateLastActive = useCallback(async (studentId: string) => {
        if (!useSupabase) return;
        try {
            const { error } = await supabase
                .from('students')
                .update({ last_active: new Date().toISOString() })
                .eq('id', studentId);

            if (error) {
                console.error('Error updating last_active:', error);
            } else {
                // Update local state
                setStudents(prev => prev.map(s =>
                    s.id === studentId ? { ...s, lastActive: new Date().toISOString() } : s
                ));
            }
        } catch (error) {
            console.error('Error updating last_active:', error);
        }
    }, [useSupabase]);

    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
        const user = users.find(u => u.email === email && u.passwordHash === pseudoHash(password));
        if (user) {
            setCurrentUser(user);
            await AsyncStorage.setItem('current_user_id', user.id);

            // Update last_active for students on login
            if (user.role === 'student') {
                await updateLastActive(user.id);
            }

            return user;
        }
        return null;
    }, [users, updateLastActive]);

    const logout = useCallback(async () => {
        setCurrentUser(null);
        await AsyncStorage.removeItem('current_user_id');
    }, []);

    const addStudent = useCallback(async (
        studentData: Omit<Student, 'id' | 'assignments' | 'dailyLogs' | 'trialExams' | 'completedTopics' | 'books'>,
        userData: { email: string, password: string }
    ) => {
        if (useSupabase) {
            try {
                // We'll let Postgres generate the UUID if possible, or use one we generate.
                // In the web version, it's manually set or handled by Supabase Auth usually.
                // Here we'll insert into users first.
                const { data: userResponse, error: userError } = await supabase
                    .from('users')
                    .insert({
                        email: userData.email,
                        password_hash: pseudoHash(userData.password),
                        role: 'student',
                        name: studentData.name,
                    })
                    .select()
                    .single();

                if (userError) throw userError;

                const studentId = userResponse.id;

                const { error: studentError } = await supabase
                    .from('students')
                    .insert({
                        id: studentId,
                        coach_id: studentData.coachId,
                        exam_type: studentData.examType,
                        field: studentData.field,
                        subjects: studentData.subjects,
                        completed_topics: [],
                    });

                if (studentError) throw studentError;

                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error adding student:', error);
            }
        } else {
            const studentId = `student_${Date.now()}`;
            const newStudentUser: User = {
                id: studentId,
                name: studentData.name,
                email: userData.email,
                passwordHash: pseudoHash(userData.password),
                role: 'student'
            };
            const newStudent: Student = {
                ...studentData,
                id: studentId,
                assignments: [],
                dailyLogs: [],
                trialExams: [],
                completedTopics: [],
                books: []
            };
            setUsers(prev => [...prev, newStudentUser]);
            setStudents(prev => [...prev, newStudent]);
        }
    }, [useSupabase, loadDataFromSupabase]);

    const updateStudent = useCallback(async (updatedStudent: Student) => {
        if (useSupabase) {
            try {
                const { error: studentError } = await supabase
                    .from('students')
                    .update({
                        exam_type: updatedStudent.examType,
                        field: updatedStudent.field,
                        subjects: updatedStudent.subjects,
                        completed_topics: updatedStudent.completedTopics,
                    })
                    .eq('id', updatedStudent.id);

                if (studentError) throw studentError;

                const { error: userError } = await supabase
                    .from('users')
                    .update({ name: updatedStudent.name })
                    .eq('id', updatedStudent.id);

                if (userError) throw userError;

                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error updating student:', error);
            }
        } else {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            setUsers(prev => prev.map(u => u.id === updatedStudent.id ? { ...u, name: updatedStudent.name } : u));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const deleteStudent = useCallback(async (studentId: string) => {
        if (useSupabase) {
            try {
                // Deleting from users should cascade if FKs are set correctly, 
                // but let's be explicit if needed. Usually 'users' is the parent.
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', studentId);

                if (error) throw error;
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        } else {
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setUsers(prev => prev.filter(u => u.id !== studentId));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const addAssignment = useCallback(async (studentId: string, assignmentData: Omit<Assignment, 'id' | 'isCompleted'>) => {
        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('assignments')
                    .insert({
                        student_id: studentId,
                        title: assignmentData.title,
                        description: assignmentData.description,
                        due_date: assignmentData.dueDate,
                        is_completed: false,
                        youtube_url: assignmentData.youtubeUrl,
                    });

                if (error) throw error;
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error adding assignment:', error);
            }
        } else {
            const newAssignment: Assignment = {
                ...assignmentData,
                id: `assign_${Date.now()}`,
                isCompleted: false,
            };
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assignments: [...s.assignments, newAssignment] } : s));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const updateAssignment = useCallback(async (studentId: string, updatedAssignment: Assignment) => {
        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('assignments')
                    .update({
                        title: updatedAssignment.title,
                        description: updatedAssignment.description,
                        due_date: updatedAssignment.dueDate,
                        is_completed: updatedAssignment.isCompleted,
                        youtube_url: updatedAssignment.youtubeUrl,
                    })
                    .eq('id', updatedAssignment.id);

                if (error) throw error;
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error updating assignment:', error);
            }
        } else {
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return { ...s, assignments: s.assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a) };
                }
                return s;
            }));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const deleteAssignment = useCallback(async (studentId: string, assignmentId: string) => {
        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('assignments')
                    .delete()
                    .eq('id', assignmentId);

                if (error) throw error;
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error deleting assignment:', error);
            }
        } else {
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return { ...s, assignments: s.assignments.filter(a => a.id !== assignmentId) };
                }
                return s;
            }));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const toggleAssignmentCompletion = useCallback(async (studentId: string, assignmentId: string) => {
        // Optimistic UI update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    assignments: s.assignments.map(a => a.id === assignmentId ? { ...a, isCompleted: !a.isCompleted } : a)
                };
            }
            return s;
        }));

        if (useSupabase) {
            try {
                const student = students.find(s => s.id === studentId);
                const assignment = student?.assignments.find(a => a.id === assignmentId);

                if (!assignment) return;

                const { error } = await supabase
                    .from('assignments')
                    .update({ is_completed: !assignment.isCompleted })
                    .eq('id', assignmentId);

                if (error) throw error;
            } catch (error) {
                console.error('Error toggling assignment:', error);
                // Rollback on error
                setStudents(prev => prev.map(s => {
                    if (s.id === studentId) {
                        return {
                            ...s,
                            assignments: s.assignments.map(a => a.id === assignmentId ? { ...a, isCompleted: a.isCompleted } : a)
                        };
                    }
                    return s;
                }));
            }
        }
    }, [useSupabase, students]);

    const addBook = useCallback(async (studentId: string, bookData: Partial<Book> & { name: string }) => {
        if (useSupabase) {
            try {
                console.log('[addBook] Inserting to Supabase:', { studentId, name: bookData.name, topicsCount: bookData.topics?.length });

                const { data, error } = await supabase
                    .from('books')
                    .insert({
                        student_id: studentId,
                        name: bookData.name,
                        subject: bookData.subject || null,
                        toc_image_uri: bookData.tocImageUri || null,
                        chapters: bookData.chapters || [],
                        topics: [], // Stop using legacy topics
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('[addBook] Supabase error:', error);
                    throw error;
                }

                console.log('[addBook] Success:', data);
                await loadDataFromSupabase();
                return data.id;
            } catch (error: any) {
                console.error('[addBook] Error adding book:', error);
                throw new Error(error?.message || 'Kitap eklenemedi');
            }
        } else {
            const newBook: Book = {
                id: `book_${Date.now()}`,
                name: bookData.name,
                subject: bookData.subject,
                tocImageUri: bookData.tocImageUri,
                chapters: bookData.chapters || [],
                topics: [],
                createdAt: new Date().toISOString(),
            };
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return { ...s, books: [...(s.books || []), newBook] };
                }
                return s;
            }));
            return newBook.id;
        }
    }, [useSupabase, loadDataFromSupabase]);

    const deleteBook = useCallback(async (studentId: string, bookId: string) => {
        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('books')
                    .delete()
                    .eq('id', bookId);

                if (error) throw error;
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error deleting book:', error);
            }
        } else {
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return { ...s, books: (s.books || []).filter(b => b.id !== bookId) };
                }
                return s;
            }));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const updateBookTopics = useCallback(async (studentId: string, bookId: string, topics: string[]) => {
        // Optimistic update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    books: (s.books || []).map(b => b.id === bookId ? { ...b, topics } : b)
                };
            }
            return s;
        }));

        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('books')
                    .update({ topics })
                    .eq('id', bookId);

                if (error) throw error;
            } catch (error) {
                console.error('Error updating book topics:', error);
            }
        }
    }, [useSupabase]);

    const addDailyLog = useCallback(async (studentId: string, logsData: { subject: string; questionsSolved: number }[]) => {
        const date = new Date().toISOString().split('T')[0];
        const validLogs = logsData.filter(log => log.questionsSolved > 0);

        if (validLogs.length === 0) return;

        const newLogs: DailyLog[] = validLogs.map(logData => ({ ...logData, date }));

        // Local state update
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, dailyLogs: [...s.dailyLogs, ...newLogs] } : s
        ));

        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('daily_logs')
                    .insert(
                        validLogs.map(log => ({
                            student_id: studentId,
                            date: date,
                            subject: log.subject,
                            questions_solved: log.questionsSolved,
                        }))
                    );

                if (error) throw error;
            } catch (error) {
                console.error('Error adding daily logs:', error);
                // We keep local state as it is for now, maybe show an alert. 
                // But typically for logs, we don't rollback unless it's critical.
            }
        }
    }, [useSupabase]);

    const addTrialExam = useCallback(async (studentId: string, examData: Omit<TrialExam, 'id' | 'date'>) => {
        const date = new Date().toISOString().split('T')[0];

        if (useSupabase) {
            try {
                // In a real app we might use crypto.randomUUID() but for compatibility 
                // let's hope the backend generates it or we use a temporary one that gets overwritten by reload if needed.
                // However, the web version uses crypto.randomUUID(). React Native support for this varies.
                // For now, let's use Date.now().toString() as a temporary ID if we must.
                const tempExamId = `trial_${Date.now()}`;

                const { data: examResponse, error: examError } = await supabase
                    .from('trial_exams')
                    .insert({
                        student_id: studentId,
                        name: examData.name,
                        date: date,
                        type: examData.type,
                        total_correct: examData.totalCorrect,
                        total_incorrect: examData.totalIncorrect,
                        total_blank: examData.totalBlank,
                    })
                    .select()
                    .single();

                if (examError) throw examError;

                const newExamId = examResponse.id;

                // Add subject results
                if (examData.subjectResults.length > 0) {
                    const { error: resultsError } = await supabase
                        .from('subject_results')
                        .insert(
                            examData.subjectResults.map(sr => ({
                                trial_exam_id: newExamId,
                                subject: sr.subject,
                                correct: sr.correct,
                                incorrect: sr.incorrect,
                                blank: sr.blank || 0,
                            }))
                        );

                    if (resultsError) throw resultsError;
                }

                // Instead of full reload, let's just update local state with the returned data if possible
                // but loadDataFromSupabase is safer to ensure all relations are correct.
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error adding trial exam:', error);
            }
        } else {
            const newExam: TrialExam = { ...examData, id: `trial_${Date.now()}`, date };
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, trialExams: [...s.trialExams, newExam] } : s));
        }
    }, [useSupabase, loadDataFromSupabase]);

    const toggleTopicCompletion = useCallback(async (studentId: string, topicKey: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const completed = student.completedTopics.includes(topicKey);
        const newCompletedTopics = completed
            ? student.completedTopics.filter(t => t !== topicKey)
            : [...student.completedTopics, topicKey];

        // Optimistic UI update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                return { ...s, completedTopics: newCompletedTopics };
            }
            return s;
        }));

        if (useSupabase) {
            try {
                const { error } = await supabase
                    .from('students')
                    .update({ completed_topics: newCompletedTopics })
                    .eq('id', studentId);

                if (error) throw error;
            } catch (error) {
                console.error('Error toggling topic:', error);
                // Rollback on error
                setStudents(prev => prev.map(s => {
                    if (s.id === studentId) {
                        return { ...s, completedTopics: student.completedTopics };
                    }
                    return s;
                }));
            }
        }
    }, [useSupabase, students]);

    // Refresh data from Supabase (for pull-to-refresh)
    const refreshData = useCallback(async () => {
        if (useSupabase) {
            try {
                await loadDataFromSupabase();
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }
    }, [useSupabase]);

    return {
        users,
        students,
        currentUser,
        isLoading,
        login,
        logout,
        addStudent,
        updateStudent,
        deleteStudent,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleAssignmentCompletion,
        addBook,
        deleteBook,
        updateBookTopics,
        addDailyLog,
        addTrialExam,
        toggleTopicCompletion,
        refreshData,
    };
};

export default useAppDataWithSupabase;
