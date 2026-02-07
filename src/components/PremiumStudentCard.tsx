import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePremium } from '../context/PremiumContext';

interface PremiumStudentCardProps {
    student: {
        id: string;
        name: string;
        examType: string;
        grade: number;
        assignments: { isCompleted: boolean }[];
        dailyLogs: { questionsSolved: number }[];
    };
    onPress: () => void;
    onDelete: () => void;
}

export const PremiumStudentCard: React.FC<PremiumStudentCardProps> = ({
    student,
    onPress,
    onDelete,
}) => {
    const { isPremium, showUpgradeModal } = usePremium();

    const completedAssignments = student.assignments.filter(a => a.isCompleted).length;
    const totalAssignments = student.assignments.length;
    const completionRate = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    // Mock risk calculation
    const getRiskStatus = () => {
        if (completionRate > 70) return { label: 'Stabil', color: '#10b981', icon: '✅' };
        if (completionRate > 40) return { label: 'Dikkat', color: '#f59e0b', icon: '⚠️' };
        return { label: 'Risk', color: '#ef4444', icon: '🚨' };
    };

    const riskStatus = getRiskStatus();

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {/* Basic Info - Always Visible */}
            <View style={styles.mainRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{student.name}</Text>
                    <Text style={styles.meta}>{student.examType} • {student.grade}. Sınıf</Text>
                </View>
                <View style={styles.basicStats}>
                    <Text style={styles.completionRate}>{completionRate}%</Text>
                    <Text style={styles.completionLabel}>Tamamlama</Text>
                </View>
            </View>

            {/* Premium Features Section */}
            <View style={styles.premiumSection}>
                {isPremium ? (
                    <>
                        {/* Risk Badge */}
                        <View style={[styles.riskBadge, { backgroundColor: `${riskStatus.color}20` }]}>
                            <Text style={styles.riskIcon}>{riskStatus.icon}</Text>
                            <Text style={[styles.riskLabel, { color: riskStatus.color }]}>{riskStatus.label}</Text>
                        </View>

                        {/* Progress Trend */}
                        <View style={styles.trendContainer}>
                            <Text style={styles.trendLabel}>Son 7 gün:</Text>
                            <View style={styles.trendBars}>
                                {[40, 55, 45, 70, 60, 80, 75].map((height, i) => (
                                    <View key={i} style={[styles.trendBar, { height: height * 0.3 + 8 }]} />
                                ))}
                            </View>
                        </View>

                        {/* AI Comment */}
                        <View style={styles.aiComment}>
                            <Text style={styles.aiCommentIcon}>💡</Text>
                            <Text style={styles.aiCommentText}>
                                Matematik konularında tutarlı ilerleme, Fizik'te destek gerekli
                            </Text>
                        </View>
                    </>
                ) : (
                    <TouchableOpacity style={styles.lockedSection} onPress={showUpgradeModal}>
                        <View style={styles.lockedRow}>
                            <View style={styles.lockedPlaceholder}>
                                <Text style={styles.lockedIcon}>🔒</Text>
                                <Text style={styles.lockedText}>Risk durumu</Text>
                            </View>
                            <View style={styles.lockedPlaceholder}>
                                <Text style={styles.lockedIcon}>📈</Text>
                                <Text style={styles.lockedText}>Trend grafiği</Text>
                            </View>
                        </View>
                        <View style={styles.premiumInsightBadge}>
                            <Text style={styles.premiumInsightText}>🔒 Premium içgörü mevcut</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Delete Button */}
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3b82f6',
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    meta: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 2,
    },
    basicStats: {
        alignItems: 'center',
    },
    completionRate: {
        color: '#10b981',
        fontSize: 22,
        fontWeight: '800',
    },
    completionLabel: {
        color: '#6b7280',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    premiumSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    riskBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    riskIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    riskLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    trendLabel: {
        color: '#94A3B8',
        fontSize: 12,
        marginRight: 10,
    },
    trendBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    trendBar: {
        width: 8,
        backgroundColor: '#A855F7',
        borderRadius: 2,
    },
    aiComment: {
        flexDirection: 'row',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        padding: 10,
        borderRadius: 10,
    },
    aiCommentIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    aiCommentText: {
        color: '#E2E8F0',
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    lockedSection: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 12,
    },
    lockedRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    lockedPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.5,
    },
    lockedIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    lockedText: {
        color: '#6b7280',
        fontSize: 12,
    },
    premiumInsightBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    premiumInsightText: {
        color: '#A855F7',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 6,
        opacity: 0.5,
    },
    deleteBtnText: {
        fontSize: 16,
    },
});
