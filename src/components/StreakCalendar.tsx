import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DayData {
    date: string; // YYYY-MM-DD format
    isProductive: boolean;
}

interface StreakCalendarProps {
    productiveDays: string[]; // Array of YYYY-MM-DD strings
    currentStreak: number;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    productiveDays,
    currentStreak,
}) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert to Monday = 0
    };

    const formatDate = (day: number) => {
        const month = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${currentYear}-${month}-${dayStr}`;
    };

    const isProductive = (day: number) => {
        return productiveDays.includes(formatDate(day));
    };

    const isToday = (day: number) => {
        return day === today.getDate();
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
                <Text style={styles.title}>🔥 Çalışma Takvimi</Text>
                <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>{currentStreak} gün seri</Text>
                </View>
            </View>

            <Text style={styles.monthLabel}>{MONTHS_TR[currentMonth]} {currentYear}</Text>

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
                        {week.map((day, dayIndex) => (
                            <View
                                key={dayIndex}
                                style={[
                                    styles.dayCell,
                                    day && isToday(day) ? styles.todayCell : null,
                                ]}
                            >
                                {day && (
                                    <>
                                        <Text style={[
                                            styles.dayNumber,
                                            isToday(day) && styles.todayNumber,
                                            isFuture(day) && styles.futureNumber,
                                        ]}>
                                            {day}
                                        </Text>
                                        {!isFuture(day) && (
                                            <View style={[
                                                styles.statusDot,
                                                isProductive(day)
                                                    ? styles.productiveDot
                                                    : styles.missingDot
                                            ]} />
                                        )}
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.productiveDot]} />
                    <Text style={styles.legendText}>Verimli gün</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.missingDot]} />
                    <Text style={styles.legendText}>Eksik gün</Text>
                </View>
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
    monthLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
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
    dayNumber: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    todayNumber: {
        color: '#A855F7',
        fontWeight: '700',
    },
    futureNumber: {
        color: '#475569',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    productiveDot: {
        backgroundColor: '#10b981',
    },
    missingDot: {
        backgroundColor: '#ef4444',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    legendText: {
        color: '#64748b',
        fontSize: 12,
    },
});
