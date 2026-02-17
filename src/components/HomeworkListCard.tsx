import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    isCompleted: boolean;
}

interface HomeworkListCardProps {
    assignments: Assignment[];
    onComplete: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
    title?: string;
}

export const HomeworkListCard: React.FC<HomeworkListCardProps> = ({
    assignments,
    onComplete,
    title = '📝 Ödevlerim',
}) => {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [showDifficultyModal, setShowDifficultyModal] = useState(false);

    const isLate = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const handleCompletePress = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setShowDifficultyModal(true);
    };

    const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
        if (selectedAssignment) {
            onComplete(selectedAssignment.id, difficulty);
            setShowDifficultyModal(false);
            setSelectedAssignment(null);
        }
    };

    const pendingAssignments = assignments.filter(a => !a.isCompleted);
    const completedAssignments = assignments.filter(a => a.isCompleted);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingAssignments.length} bekliyor</Text>
                </View>
            </View>

            {pendingAssignments.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🎉</Text>
                    <Text style={styles.emptyText}>Tüm ödevler tamamlandı!</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {pendingAssignments.slice(0, 5).map((assignment) => (
                        <View key={assignment.id} style={styles.assignmentItem}>
                            <View style={styles.assignmentInfo}>
                                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                                <View style={styles.dueDateRow}>
                                    <Text style={[
                                        styles.dueDate,
                                        isLate(assignment.dueDate) && styles.lateDueDate
                                    ]}>
                                        {isLate(assignment.dueDate) ? '⚠️ ' : '📅 '}
                                        {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                                    </Text>
                                    {isLate(assignment.dueDate) && (
                                        <View style={styles.lateBadge}>
                                            <Text style={styles.lateBadgeText}>Gecikmiş</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={() => handleCompletePress(assignment)}
                            >
                                <Text style={styles.completeButtonText}>Tamamla</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {completedAssignments.length > 0 && (
                <View style={styles.completedSection}>
                    <Text style={styles.completedLabel}>
                        ✅ {completedAssignments.length} ödev tamamlandı
                    </Text>
                </View>
            )}

            {/* Difficulty Feedback Modal */}
            <Modal
                visible={showDifficultyModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDifficultyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Zor muydu?</Text>
                        <Text style={styles.modalSubtitle}>{selectedAssignment?.title}</Text>

                        <View style={styles.difficultyRow}>
                            <TouchableOpacity
                                style={[styles.difficultyButton, { borderColor: '#10b981' }]}
                                onPress={() => handleDifficultySelect('easy')}
                            >
                                <Text style={styles.difficultyEmoji}>😊</Text>
                                <Text style={[styles.difficultyLabel, { color: '#10b981' }]}>Kolay</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.difficultyButton, { borderColor: '#f59e0b' }]}
                                onPress={() => handleDifficultySelect('medium')}
                            >
                                <Text style={styles.difficultyEmoji}>🤔</Text>
                                <Text style={[styles.difficultyLabel, { color: '#f59e0b' }]}>Orta</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.difficultyButton, { borderColor: '#ef4444' }]}
                                onPress={() => handleDifficultySelect('hard')}
                            >
                                <Text style={styles.difficultyEmoji}>😰</Text>
                                <Text style={[styles.difficultyLabel, { color: '#ef4444' }]}>Zor</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    badge: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: '600',
    },
    list: {
        gap: 10,
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 14,
        borderRadius: 14,
    },
    assignmentInfo: {
        flex: 1,
    },
    assignmentTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    dueDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dueDate: {
        color: '#94A3B8',
        fontSize: 12,
    },
    lateDueDate: {
        color: '#ef4444',
    },
    lateBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    },
    lateBadgeText: {
        color: '#ef4444',
        fontSize: 10,
        fontWeight: '600',
    },
    completeButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
    },
    completedSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    completedLabel: {
        color: '#6b7280',
        fontSize: 13,
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
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    modalSubtitle: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    difficultyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
    },
    difficultyButton: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    difficultyEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    difficultyLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
});
