/**
 * Risk Calculator - Premium Coach Dashboard
 * 
 * Risk Skoru = Pasif Gün × 2 + Gecikmiş Görev × 1.5 + Performans Düşüş %
 * 
 * Skor → Etiket:
 * • 0–5    → Normal (yeşil)
 * • 6–10   → Dikkat (sarı)  
 * • 10+    → Kritik (kırmızı)
 */

import type { Student, Assignment, DailyLog } from '../types';

export type RiskLabel = 'Normal' | 'Dikkat' | 'Kritik';

export interface RiskInfo {
    score: number;
    label: RiskLabel;
    color: string;
    passiveDays: number;
    overdueCount: number;
    weeklyCompletionRate: number;
    weeklyChange: number; // Önceki haftaya göre değişim %
    last7DaysActivity: number;
}

export interface StudentWithRisk extends Student {
    riskInfo: RiskInfo;
}

/**
 * Pasif gün sayısını hesapla
 */
export function calculatePassiveDays(lastActive?: string): number {
    if (!lastActive) return 30; // Hiç giriş yapmamış = maksimum risk

    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

/**
 * Gecikmiş görev sayısını hesapla
 */
export function calculateOverdueCount(assignments: Assignment[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return assignments.filter(a => {
        if (a.isCompleted) return false;
        const dueDate = new Date(a.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }).length;
}

/**
 * Son 7 gün aktivite sayısını hesapla
 */
export function calculateLast7DaysActivity(dailyLogs: DailyLog[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return dailyLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= sevenDaysAgo && logDate <= now;
    }).length;
}

/**
 * Haftalık tamamlama oranını hesapla
 */
export function calculateWeeklyCompletionRate(assignments: Assignment[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyAssignments = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= sevenDaysAgo && dueDate <= now;
    });

    if (weeklyAssignments.length === 0) return 100; // Ödev yoksa %100

    const completed = weeklyAssignments.filter(a => a.isCompleted).length;
    return Math.round((completed / weeklyAssignments.length) * 100);
}

/**
 * Önceki haftaya göre değişimi hesapla
 */
export function calculateWeeklyChange(dailyLogs: DailyLog[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekLogs = dailyLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= sevenDaysAgo && logDate <= now;
    });

    const lastWeekLogs = dailyLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= fourteenDaysAgo && logDate < sevenDaysAgo;
    });

    const thisWeekQuestions = thisWeekLogs.reduce((sum, log) => sum + log.questionsSolved, 0);
    const lastWeekQuestions = lastWeekLogs.reduce((sum, log) => sum + log.questionsSolved, 0);

    if (lastWeekQuestions === 0) {
        return thisWeekQuestions > 0 ? 100 : 0;
    }

    return Math.round(((thisWeekQuestions - lastWeekQuestions) / lastWeekQuestions) * 100);
}

/**
 * Risk skorunu hesapla
 * Formula: Pasif Gün × 2 + Gecikmiş Görev × 1.5 + Performans Düşüş %
 */
export function calculateRiskScore(student: Student): number {
    const passiveDays = calculatePassiveDays((student as any).lastActive);
    const overdueCount = calculateOverdueCount(student.assignments);
    const weeklyChange = calculateWeeklyChange(student.dailyLogs);

    // Performans düşüşü (negatif değişim)
    const performanceDecline = Math.max(0, -weeklyChange);

    const score = (passiveDays * 2) + (overdueCount * 1.5) + (performanceDecline * 0.1);

    return Math.round(score * 10) / 10; // 1 ondalık basamak
}

/**
 * Risk etiketini al
 */
export function getRiskLabel(score: number): RiskLabel {
    if (score <= 5) return 'Normal';
    if (score <= 10) return 'Dikkat';
    return 'Kritik';
}

/**
 * Risk rengini al
 */
export function getRiskColor(score: number): string {
    if (score <= 5) return '#10b981'; // Yeşil
    if (score <= 10) return '#f59e0b'; // Sarı
    return '#ef4444'; // Kırmızı
}

/**
 * Risk arka plan rengini al (glow için)
 */
export function getRiskBackgroundColor(score: number): string {
    if (score <= 5) return 'rgba(16, 185, 129, 0.15)';
    if (score <= 10) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(239, 68, 68, 0.15)';
}

/**
 * Öğrenci için tam risk bilgisini hesapla
 */
export function getStudentRiskInfo(student: Student): RiskInfo {
    const passiveDays = calculatePassiveDays((student as any).lastActive);
    const overdueCount = calculateOverdueCount(student.assignments);
    const weeklyCompletionRate = calculateWeeklyCompletionRate(student.assignments);
    const weeklyChange = calculateWeeklyChange(student.dailyLogs);
    const last7DaysActivity = calculateLast7DaysActivity(student.dailyLogs);

    const score = calculateRiskScore(student);

    return {
        score,
        label: getRiskLabel(score),
        color: getRiskColor(score),
        passiveDays,
        overdueCount,
        weeklyCompletionRate,
        weeklyChange,
        last7DaysActivity,
    };
}

/**
 * Öğrencileri risk skoruna göre sırala (en yüksek risk önce)
 */
export function sortStudentsByRisk(students: Student[]): StudentWithRisk[] {
    return students
        .map(student => ({
            ...student,
            riskInfo: getStudentRiskInfo(student),
        }))
        .sort((a, b) => b.riskInfo.score - a.riskInfo.score);
}

/**
 * En riskli öğrenci sayısını al
 */
export function getCriticalStudentsCount(students: Student[]): number {
    return students.filter(s => {
        const score = calculateRiskScore(s);
        return score > 10;
    }).length;
}

/**
 * Bugün riskli öğrenci sayısını al (Kritik + Dikkat)
 */
export function getTodayRiskStudentsCount(students: Student[]): number {
    return students.filter(s => {
        const score = calculateRiskScore(s);
        return score > 5;
    }).length;
}

/**
 * Son giriş tarihini formatla
 */
export function formatLastActive(lastActive?: string): string {
    if (!lastActive) return 'Hiç giriş yapmadı';

    const days = calculatePassiveDays(lastActive);

    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
    return `${Math.floor(days / 30)} ay önce`;
}

/**
 * En aktif öğrenciyi bul (son 7 gün en çok soru çözen)
 */
export function getMostActiveStudent(students: Student[]): string | null {
    if (students.length === 0) return null;

    const studentsWithActivity = students.map(s => ({
        name: s.name,
        activity: calculateLast7DaysActivity(s.dailyLogs),
        questions: s.dailyLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (logDate >= sevenDaysAgo) {
                return sum + log.questionsSolved;
            }
            return sum;
        }, 0),
    }));

    const mostActive = studentsWithActivity.reduce((max, s) =>
        s.questions > max.questions ? s : max
        , studentsWithActivity[0]);

    return mostActive.questions > 0 ? mostActive.name : null;
}

/**
 * Tüm öğrencilerin toplam gecikmiş görev sayısı
 */
export function getTotalOverdueCount(students: Student[]): number {
    return students.reduce((total, s) =>
        total + calculateOverdueCount(s.assignments)
        , 0);
}

