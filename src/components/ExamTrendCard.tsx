import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';

interface Exam {
    id: string;
    date: string;
    netScore: number;
    examType?: string;
}

interface ExamTrendCardProps {
    exams: Exam[];
    onAddPress: () => void;
}

export const ExamTrendCard: React.FC<ExamTrendCardProps> = ({
    exams,
    onAddPress,
}) => {
    const sortedExams = [...exams].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 3);

    const getTrend = () => {
        if (sortedExams.length < 2) return { direction: 'neutral', text: 'Veri yetersiz' };
        const latest = sortedExams[0].netScore;
        const previous = sortedExams[1].netScore;
        const diff = latest - previous;
        if (diff > 0) return { direction: 'up', text: `+${diff.toFixed(1)} net ↑`, color: '#10b981' };
        if (diff < 0) return { direction: 'down', text: `${diff.toFixed(1)} net ↓`, color: '#ef4444' };
        return { direction: 'neutral', text: 'Değişim yok', color: '#f59e0b' };
    };

    const trend = getTrend();

    const getBarHeight = (score: number) => {
        const scores = sortedExams.map(e => e.netScore);
        const maxScore = scores.length > 0 ? Math.max(...scores, 100) : 100;
        return (score / maxScore) * 80;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📈 Sınav Trendi</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddPress}
                >
                    <Text style={styles.addButtonText}>+ Ekle</Text>
                </TouchableOpacity>
            </View>

            {sortedExams.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyText}>Henüz sınav sonucu eklenmedi</Text>
                    <TouchableOpacity
                        style={styles.emptyAddButton}
                        onPress={onAddPress}
                    >
                        <Text style={styles.emptyAddButtonText}>İlk Sonucu Ekle</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Trend Badge */}
                    <View style={[styles.trendBadge, { backgroundColor: `${trend.color}20` }]}>
                        <Text style={[styles.trendText, { color: trend.color }]}>
                            {trend.text}
                        </Text>
                    </View>

                    {/* Visual Trend */}
                    <View style={styles.chartContainer}>
                        {[...sortedExams].reverse().map((exam, index) => (
                            <View key={exam.id} style={styles.barContainer}>
                                <Text style={styles.barScore}>{exam.netScore.toFixed(1)}</Text>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: getBarHeight(exam.netScore),
                                            backgroundColor: index === sortedExams.length - 1
                                                ? '#A855F7'
                                                : '#3b82f6'
                                        }
                                    ]}
                                />
                                <Text style={styles.barDate}>
                                    {new Date(exam.date).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}
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
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    addButton: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    addButtonText: {
        color: '#A855F7',
        fontSize: 13,
        fontWeight: '600',
    },
    trendBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    trendText: {
        fontSize: 14,
        fontWeight: '700',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 20,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barScore: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    bar: {
        width: 40,
        borderRadius: 8,
        minHeight: 20,
    },
    barDate: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 14,
        marginBottom: 16,
    },
    emptyAddButton: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyAddButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        width: '85%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#94A3B8',
        fontSize: 13,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonSelected: {
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
    },
    typeButtonText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    typeButtonTextSelected: {
        color: '#A855F7',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#A855F7',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
