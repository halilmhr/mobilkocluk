/**
 * Smart Student List - Premium Coach Dashboard
 * 
 * Risk rozeti, haftalık tamamlama %, son giriş, filtre sistemi
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { PREMIUM_COLORS, PREMIUM_SPACING, PREMIUM_TYPOGRAPHY, PREMIUM_ANIMATION } from '../styles/premiumStyles';
import { StudentWithRisk, sortStudentsByRisk, formatLastActive, getRiskBackgroundColor } from '../lib/riskCalculator';
import type { Student } from '../types';

type FilterType = 'riskiest' | 'successful' | 'passive' | 'newest';

interface FilterOption {
    key: FilterType;
    label: string;
    icon: string;
}

const FILTER_OPTIONS: FilterOption[] = [
    { key: 'riskiest', label: 'En Riskli', icon: '🔥' },
    { key: 'successful', label: 'En Başarılı', icon: '⭐' },
    { key: 'passive', label: 'En Pasif', icon: '😴' },
    { key: 'newest', label: 'Son Eklenen', icon: '🆕' },
];

interface SmartStudentListProps {
    students: Student[];
    onStudentPress: (student: Student) => void;
    onDeleteStudent?: (studentId: string, studentName: string) => void;
}

export const SmartStudentList: React.FC<SmartStudentListProps> = ({
    students,
    onStudentPress,
    onDeleteStudent,
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('riskiest');
    const [pressedId, setPressedId] = useState<string | null>(null);

    // Calculate risk info for all students
    const studentsWithRisk = useMemo(() => {
        return sortStudentsByRisk(students);
    }, [students]);

    // Apply filter
    const filteredStudents = useMemo(() => {
        switch (activeFilter) {
            case 'riskiest':
                return [...studentsWithRisk].sort((a, b) => b.riskInfo.score - a.riskInfo.score);
            case 'successful':
                return [...studentsWithRisk].sort((a, b) =>
                    b.riskInfo.weeklyCompletionRate - a.riskInfo.weeklyCompletionRate
                );
            case 'passive':
                return [...studentsWithRisk].sort((a, b) =>
                    b.riskInfo.passiveDays - a.riskInfo.passiveDays
                );
            case 'newest':
                // Assuming newer students have higher IDs or we could use createdAt
                return [...studentsWithRisk].reverse();
            default:
                return studentsWithRisk;
        }
    }, [studentsWithRisk, activeFilter]);

    const handlePressIn = (id: string) => {
        setPressedId(id);
    };

    const handlePressOut = () => {
        setPressedId(null);
    };

    const getRiskBadgeStyle = (label: string) => {
        switch (label) {
            case 'Kritik':
                return { backgroundColor: PREMIUM_COLORS.dangerSoft, borderColor: PREMIUM_COLORS.danger };
            case 'Dikkat':
                return { backgroundColor: PREMIUM_COLORS.warningSoft, borderColor: PREMIUM_COLORS.warning };
            default:
                return { backgroundColor: PREMIUM_COLORS.successSoft, borderColor: PREMIUM_COLORS.success };
        }
    };

    const getRiskTextColor = (label: string) => {
        switch (label) {
            case 'Kritik':
                return PREMIUM_COLORS.danger;
            case 'Dikkat':
                return PREMIUM_COLORS.warning;
            default:
                return PREMIUM_COLORS.success;
        }
    };

    if (students.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>👥 Öğrencilerim</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>Henüz öğrenci eklenmemiş</Text>
                    <Text style={styles.emptySubtext}>
                        Yeni öğrenci ekleyerek başlayın
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>👥 Öğrencilerim</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{students.length}</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
            >
                {FILTER_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.filterTab,
                            activeFilter === option.key && styles.filterTabActive,
                        ]}
                        onPress={() => setActiveFilter(option.key)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.filterIcon}>{option.icon}</Text>
                        <Text style={[
                            styles.filterLabel,
                            activeFilter === option.key && styles.filterLabelActive,
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Student Cards */}
            <View style={styles.studentList}>
                {filteredStudents.map((student) => {
                    const isPressed = pressedId === student.id;
                    const riskBadgeStyle = getRiskBadgeStyle(student.riskInfo.label);
                    const riskTextColor = getRiskTextColor(student.riskInfo.label);

                    return (
                        <TouchableOpacity
                            key={student.id}
                            style={[
                                styles.studentCard,
                                isPressed && styles.studentCardPressed,
                            ]}
                            onPress={() => onStudentPress(student)}
                            onPressIn={() => handlePressIn(student.id)}
                            onPressOut={handlePressOut}
                            activeOpacity={1}
                        >
                            {/* Avatar */}
                            <View style={[
                                styles.avatar,
                                { backgroundColor: student.riskInfo.color + '30' }
                            ]}>
                                <Text style={[
                                    styles.avatarText,
                                    { color: student.riskInfo.color }
                                ]}>
                                    {student.name.charAt(0)}
                                </Text>
                            </View>

                            {/* Student Info */}
                            <View style={styles.studentInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <View style={[styles.riskBadge, riskBadgeStyle]}>
                                        <Text style={[styles.riskBadgeText, { color: riskTextColor }]}>
                                            {student.riskInfo.label}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.studentMeta}>
                                    {student.examType} • {student.grade}. Sınıf
                                </Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            %{student.riskInfo.weeklyCompletionRate}
                                        </Text>
                                        <Text style={styles.statLabel}>Tamamlama</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {formatLastActive((student as any).lastActive)}
                                        </Text>
                                        <Text style={styles.statLabel}>Son Giriş</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Delete Button */}
                            {onDeleteStudent && (
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => onDeleteStudent(student.id, student.name)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={styles.deleteBtnText}>🗑️</Text>
                                </TouchableOpacity>
                            )}

                            {/* Arrow */}
                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: PREMIUM_SPACING.sectionGap,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: PREMIUM_SPACING.gap,
    },
    title: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.h3,
    },
    countBadge: {
        marginLeft: PREMIUM_SPACING.gapSm,
        backgroundColor: PREMIUM_COLORS.accentSoft,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countBadgeText: {
        color: PREMIUM_COLORS.accent,
        fontSize: 13,
        fontWeight: '700',
    },
    filterScroll: {
        marginBottom: PREMIUM_SPACING.gap,
    },
    filterContainer: {
        gap: PREMIUM_SPACING.gapSm,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PREMIUM_COLORS.surface,
        paddingHorizontal: PREMIUM_SPACING.paddingSm,
        paddingVertical: 8,
        borderRadius: PREMIUM_SPACING.borderRadiusSm,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
    },
    filterTabActive: {
        backgroundColor: PREMIUM_COLORS.accentSoft,
        borderColor: PREMIUM_COLORS.accent,
    },
    filterIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    filterLabel: {
        color: PREMIUM_COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    filterLabelActive: {
        color: PREMIUM_COLORS.accent,
    },
    studentList: {
        gap: PREMIUM_SPACING.gapSm,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PREMIUM_COLORS.surface,
        padding: PREMIUM_SPACING.padding,
        borderRadius: PREMIUM_SPACING.borderRadius,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
        transform: [{ scale: 1 }],
    },
    studentCardPressed: {
        transform: [{ scale: PREMIUM_ANIMATION.tapScale }],
        backgroundColor: PREMIUM_COLORS.surfaceLight,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: PREMIUM_SPACING.gap,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
    },
    studentInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    studentName: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.body,
        fontWeight: '600',
        marginRight: PREMIUM_SPACING.gapSm,
    },
    riskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    riskBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    studentMeta: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        color: PREMIUM_COLORS.text,
        fontSize: 12,
        fontWeight: '600',
        marginRight: 4,
    },
    statLabel: {
        color: PREMIUM_COLORS.textMuted,
        fontSize: 11,
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: PREMIUM_COLORS.surfaceLight,
        marginHorizontal: PREMIUM_SPACING.gapSm,
    },
    deleteBtn: {
        padding: 8,
        marginRight: 4,
    },
    deleteBtnText: {
        fontSize: 16,
        opacity: 0.5,
    },
    arrow: {
        color: PREMIUM_COLORS.textMuted,
        fontSize: 18,
    },
    emptyState: {
        backgroundColor: PREMIUM_COLORS.surface,
        borderRadius: PREMIUM_SPACING.borderRadius,
        padding: PREMIUM_SPACING.paddingXl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: PREMIUM_SPACING.gap,
    },
    emptyText: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.body,
        fontWeight: '600',
    },
    emptySubtext: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginTop: 4,
    },
});
