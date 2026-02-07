/**
 * Compact Student List - Refined Premium Design
 * Fixed progress bar width issue
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';
import { sortStudentsByRisk, formatLastActive, RiskInfo } from '../lib/riskCalculator';
import type { Student } from '../types';

type FilterType = 'riskiest' | 'successful' | 'passive';

interface StudentWithRisk extends Student { riskInfo: RiskInfo; }

interface CompactStudentListProps {
    students: Student[];
    onStudentPress: (student: Student) => void;
}

export const CompactStudentList: React.FC<CompactStudentListProps> = ({ students, onStudentPress }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('riskiest');

    const studentsWithRisk = useMemo(() => sortStudentsByRisk(students), [students]);

    const filteredStudents = useMemo(() => {
        switch (activeFilter) {
            case 'riskiest': return [...studentsWithRisk].sort((a, b) => b.riskInfo.score - a.riskInfo.score);
            case 'successful': return [...studentsWithRisk].sort((a, b) => b.riskInfo.weeklyCompletionRate - a.riskInfo.weeklyCompletionRate);
            case 'passive': return [...studentsWithRisk].sort((a, b) => b.riskInfo.passiveDays - a.riskInfo.passiveDays);
            default: return studentsWithRisk;
        }
    }, [studentsWithRisk, activeFilter]);

    const getProgressColor = (rate: number) => {
        if (rate >= 70) return '#10b981';
        if (rate >= 40) return '#fbbf24';
        return '#ef4444';
    };

    const getBadgeStyle = (label: string) => {
        switch (label) {
            case 'Kritik': return { letter: 'K', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
            case 'Dikkat': return { letter: 'D', bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' };
            default: return { letter: 'N', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
        }
    };

    if (students.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Öğrencilerim</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Henüz öğrenci yok</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Öğrencilerim</Text>
                <View style={styles.filterRow}>
                    {(['riskiest', 'successful', 'passive'] as FilterType[]).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.filterActive]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                                {filter === 'riskiest' ? 'En Riskli' : filter === 'successful' ? 'Başarılı' : 'Pasif'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            <View style={styles.list}>
                {filteredStudents.map((student) => {
                    const badge = getBadgeStyle(student.riskInfo.label);
                    const rate = student.riskInfo.weeklyCompletionRate;
                    const progressColor = getProgressColor(rate);

                    return (
                        <TouchableOpacity
                            key={student.id}
                            style={styles.row}
                            onPress={() => onStudentPress(student)}
                            activeOpacity={0.7}
                        >
                            {/* Name */}
                            <View style={styles.nameSection}>
                                <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
                            </View>

                            {/* Progress */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[
                                            styles.progressFill,
                                            { width: `${Math.min(rate, 100)}%`, backgroundColor: progressColor }
                                        ]} />
                                    </View>
                                </View>
                                <Text style={[styles.rate, { color: progressColor }]}>%{rate}</Text>
                            </View>

                            {/* Badge */}
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.letter}</Text>
                            </View>

                            {/* Last Active */}
                            <View style={styles.lastActive}>
                                <Text style={styles.lastActiveLabel}>Son Giriş</Text>
                                <Text style={styles.lastActiveValue}>
                                    {formatLastActive((student as any).lastActive)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        flexWrap: 'wrap',
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    filterRow: { flexDirection: 'row', gap: 6 },
    filterChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#1f2937',
    },
    filterActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    filterText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
    },
    filterTextActive: { color: '#a78bfa' },
    list: { gap: 6 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    nameSection: {
        flex: 1,
        minWidth: 0, // Allow text truncation
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    progressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 90,
        marginLeft: 8,
    },
    progressBarContainer: {
        flex: 1,
        marginRight: 6,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#374151',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    rate: {
        fontSize: 10,
        fontWeight: '600',
        width: 30,
        textAlign: 'right',
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    lastActive: {
        alignItems: 'flex-end',
        marginLeft: 8,
        minWidth: 55,
    },
    lastActiveLabel: {
        fontSize: 8,
        color: '#4b5563',
        fontWeight: '500',
    },
    lastActiveValue: {
        fontSize: 9,
        color: '#6b7280',
    },
    emptyState: {
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: { color: '#6b7280', fontSize: 13 },
});
