import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DayData {
    date: string; // YYYY-MM-DD format
    isProductive: boolean;
}

interface StreakCalendarProps {
    selectedDate?: string;
    onSelectDate?: (date: string) => void;
    assignmentsByDate?: Record<string, any[]>;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    selectedDate,
    onSelectDate,
    assignmentsByDate = {},
}) => {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date());
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Real today string for overdue comparison
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const changeMonth = (offset: number) => {
        setViewDate(prev => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + offset);
            return next;
        });
    };

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const formatDate = (day: number) => {
        const month = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${currentYear}-${month}-${dayStr}`;
    };

    const isToday = (day: number) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const isFuture = (day: number) => {
        const checkDate = new Date(currentYear, currentMonth, day);
        return checkDate > today;
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📅 Ödev Takvimi</Text>
            </View>

            <View style={styles.monthNavRow}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                    <Text style={styles.monthNavArrow}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{MONTHS_TR[currentMonth]} {currentYear}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                    <Text style={styles.monthNavArrow}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaderRow}>
                {DAYS_TR.map((day) => (
                    <Text key={day} style={styles.dayHeader}>{day}</Text>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => {
                            if (!day) return <View key={dayIndex} style={styles.dayCell} />;

                            const dateStr = formatDate(day);
                            const isSel = selectedDate === dateStr;
                            const isTodayDay = isToday(day);
                            const isFut = isFuture(day);

                            const dayAssignments = assignmentsByDate[dateStr] || [];
                            const assignmentCount = dayAssignments.length;
                            let bgColor: string | null = null;
                            let dotColor: string | null = null;

                            if (assignmentCount > 0) {
                                const allDone = dayAssignments.every((a: any) => a.isCompleted);
                                const hasOverdue = dayAssignments.some((a: any) => !a.isCompleted && dateStr < todayStr);
                                if (hasOverdue) {
                                    bgColor = 'rgba(239, 68, 68, 0.15)';
                                    dotColor = '#ef4444';
                                } else if (allDone) {
                                    bgColor = 'rgba(16, 185, 129, 0.15)';
                                    dotColor = '#10b981';
                                } else {
                                    bgColor = 'rgba(245, 158, 11, 0.12)';
                                    dotColor = '#f59e0b';
                                }
                            }

                            return (
                                <TouchableOpacity
                                    key={dayIndex}
                                    style={[
                                        styles.dayCell,
                                        bgColor && !isSel ? { backgroundColor: bgColor, borderRadius: 10 } : null,
                                        isSel && styles.selectedCell,
                                        isTodayDay && !isSel && styles.todayCell,
                                    ]}
                                    onPress={() => onSelectDate?.(dateStr)}
                                >
                                    <Text style={[
                                        styles.dayNumber,
                                        isSel && styles.selectedNumber,
                                        isTodayDay && !isSel && styles.todayNumber,
                                        isFut && styles.futureNumber,
                                    ]}>
                                        {day}
                                    </Text>
                                    <View style={styles.dotRow}>
                                        {assignmentCount > 0 && (
                                            <View style={[styles.countBadge, { backgroundColor: isSel ? 'rgba(255,255,255,0.3)' : (dotColor || 'transparent') }]}>
                                                <Text style={[styles.countText, isSel && { color: '#fff' }]}>{assignmentCount}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    streakBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    streakText: {
        color: '#f59e0b',
        fontSize: 13,
        fontWeight: '700',
    },
    monthNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthNavButton: {
        padding: 8,
    },
    monthNavArrow: {
        color: '#A855F7',
        fontSize: 16,
        fontWeight: '700',
    },
    monthLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    dayHeaderRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 11,
        fontWeight: '600',
    },
    calendarGrid: {
        gap: 4,
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    todayCell: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
    },
    selectedCell: {
        backgroundColor: '#A855F7',
    },
    dayNumber: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    todayNumber: {
        color: '#A855F7',
        fontWeight: '700',
    },
    selectedNumber: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    futureNumber: {
        color: '#475569',
    },
    dotRow: {
        flexDirection: 'row',
        gap: 3,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadge: {
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    countText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
});
