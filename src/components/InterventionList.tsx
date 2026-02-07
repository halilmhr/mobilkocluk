/**
 * Intervention List - Refined Premium Design
 * Horizontal scroll with single primary button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';
import type { Student } from '../types';
import { RiskInfo } from '../lib/riskCalculator';

export interface StudentWithRisk extends Student {
    riskInfo: RiskInfo;
}

interface InterventionListProps {
    students: StudentWithRisk[];
    onSendMessage: (student: Student) => void;
    onUpdateProgram: (student: Student) => void;
}

export const InterventionList: React.FC<InterventionListProps> = ({
    students,
    onSendMessage,
    onUpdateProgram,
}) => {
    const topRiskStudents = students
        .filter(s => s.riskInfo.score > 5)
        .slice(0, 5);

    if (topRiskStudents.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bugün Müdahale Etmen Gerekenler</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {topRiskStudents.map((student) => {
                    const isKritik = student.riskInfo.label === 'Kritik';
                    const { passiveDays } = student.riskInfo;

                    return (
                        <TouchableOpacity
                            key={student.id}
                            style={styles.card}
                            onPress={() => onUpdateProgram(student)}
                            activeOpacity={0.7}
                        >
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <Text style={styles.studentName} numberOfLines={1}>
                                    {student.name}
                                </Text>
                                <View style={[
                                    styles.badge,
                                    isKritik ? styles.badgeKritik : styles.badgeDikkat
                                ]}>
                                    <Text style={[
                                        styles.badgeText,
                                        isKritik ? styles.badgeTextKritik : styles.badgeTextDikkat
                                    ]}>
                                        {student.riskInfo.label}
                                    </Text>
                                </View>
                            </View>

                            {/* Passive Info */}
                            {passiveDays >= 3 && (
                                <Text style={styles.passiveText}>
                                    <Text style={styles.passiveDays}>{passiveDays} gün</Text> inaktif
                                </Text>
                            )}

                            {/* Single Primary Button */}
                            <TouchableOpacity
                                style={styles.messageButton}
                                onPress={() => onSendMessage(student)}
                            >
                                <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
                            </TouchableOpacity>

                            {/* Ghost/Outline secondary */}
                            <TouchableOpacity
                                style={styles.ghostButton}
                                onPress={() => onUpdateProgram(student)}
                            >
                                <Text style={styles.ghostButtonText}>Program</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 12,
    },
    scrollContent: {
        paddingRight: 16,
        gap: 10,
    },
    card: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        width: 200,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeKritik: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    badgeDikkat: {
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '600',
    },
    badgeTextKritik: {
        color: '#ef4444',
    },
    badgeTextDikkat: {
        color: '#fbbf24',
    },
    passiveText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    passiveDays: {
        color: '#ef4444',
        fontWeight: '600',
    },
    messageButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 9,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 6,
    },
    messageButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    ghostButton: {
        backgroundColor: 'transparent',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    ghostButtonText: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '500',
    },
});
