import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

interface DailyQuestionsCardProps {
    subjects: string[];
    onSave: (logs: { subject: string; questionsSolved: number }[]) => void;
}

export const DailyQuestionsCard: React.FC<DailyQuestionsCardProps> = ({
    subjects,
    onSave,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [counts, setCounts] = useState<Record<string, string>>({});

    const handleSave = () => {
        const logs = Object.entries(counts)
            .map(([subject, count]) => ({
                subject,
                questionsSolved: parseInt(count) || 0,
            }))
            .filter(log => log.questionsSolved > 0);

        if (logs.length > 0) {
            onSave(logs);
            setCounts({});
            setShowModal(false);
        }
    };

    const totalQuestions = Object.values(counts).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.7}
            onPress={() => setShowModal(true)}
        >
            <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                justifyContent: 'center', alignItems: 'center', marginBottom: 12,
            }}>
                <Text style={{ fontSize: 20 }}>📝</Text>
            </View>
            <Text style={styles.title}>Soru Çözümü</Text>
            <Text style={styles.subtitle}>Bugün {totalQuestions} soru</Text>
            <View style={styles.addButton}>
                <Text style={styles.addButtonText}>Giriş Yap</Text>
            </View>

            {/* Modal */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Günlük Soru Sayıları</Text>

                        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                            {subjects.map((subject) => (
                                <View key={subject} style={styles.inputGroup}>
                                    <Text style={styles.subjectLabel}>{subject}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={counts[subject] || ''}
                                        onChangeText={(text) => setCounts(prev => ({ ...prev, [subject]: text }))}
                                        placeholder="0"
                                        placeholderTextColor="#64748b"
                                        keyboardType="number-pad"
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.2)',
    },
    title: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 12,
        lineHeight: 16,
    },
    addButton: {
        marginTop: 12,
        backgroundColor: '#00BFBF',
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center' as const,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    scrollArea: {
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    subjectLabel: {
        color: '#E2E8F0',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: '#fff',
        fontSize: 16,
        width: 80,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 14,
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
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
