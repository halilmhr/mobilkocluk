export type UserRole = 'coach' | 'student';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  youtubeUrl?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  subject: string;
  questionsSolved: number;
}

export interface SubjectResult {
  subject: string;
  correct: number;
  incorrect: number;
  blank?: number;
}

export interface TrialExam {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type?: 'TYT' | 'AYT' | 'HEPSİ';
  totalCorrect: number;
  totalIncorrect: number;
  totalBlank: number;
  subjectResults: SubjectResult[];
}

export interface BookChapter {
  title: string;
  topics: string[];
}

export interface Book {
  id: string;
  name: string;
  subject?: string;        // Ders adı (Matematik, Fizik vb.)
  tocImageUri?: string;    // İçindekiler fotoğrafı URI
  chapters: BookChapter[]; // AI'dan çıkarılan ünite ve konular
  topics?: string[];       // Geriye dönük uyumluluk için düz liste (isteğe bağlı)
  createdAt: string;
}

export interface Student {
  id: string;
  coachId: string;
  name: string;
  examType: string;
  field?: string;
  grade?: number;
  subjects: string[];
  assignments: Assignment[];
  dailyLogs: DailyLog[];
  trialExams: TrialExam[];
  completedTopics: string[];
  books: Book[];
}
