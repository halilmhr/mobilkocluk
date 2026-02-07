import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DailyCheckinCardProps {
    onSubmit: (mood: 'good' | 'ok' | 'bad', hardSubject?: string) => void;
    hasCheckedInToday?: boolean;
    subjects?: string[];
}

export const DailyCheckinCard: React.FC<DailyCheckinCardProps> = ({
    onSubmit,
    hasCheckedInToday = false,
    subjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya'],
}) => {
    const [selectedMood, setSelectedMood] = useState<'good' | 'ok' | 'bad' | null>(null);
    const [showSubjectQuestion, setShowSubjectQuestion] = useState(false);
    const [submitted, setSubmitted] = useState(hasCheckedInToday);

    useEffect(() => {
        setSubmitted(hasCheckedInToday);
    }, [hasCheckedInToday]);

    const handleMoodSelect = (mood: 'good' | 'ok' | 'bad') => {
        setSelectedMood(mood);
        setShowSubjectQuestion(true);
    };

    const handleSubjectSelect = (subject: string | null) => {
        if (selectedMood) {
            onSubmit(selectedMood, subject || undefined);
            setSubmitted(true);
        }
    };

    const handleSkipSubject = () => {
        if (selectedMood) {
            onSubmit(selectedMood);
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <View style={styles.completedContainer}>
                <Text style={styles.completedIcon}>✅</Text>
                <Text style={styles.completedText}>Bugünkü check-in tamamlandı!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!showSubjectQuestion ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>Bugün nasılsın?</Text>
                        <Text style={styles.subtitle}>Günlük durumunu paylaş</Text>
                    </View>
                    <View style={styles.moodRow}>
                        <TouchableOpacity
                            style={[styles.moodButton, selectedMood === 'good' && styles.moodButtonSelected]}
                            onPress={() => handleMoodSelect('good')}
                        >
                            <Text style={styles.moodEmoji}>😃</Text>
                            <Text style={styles.moodLabel}>İyi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.moodButton, selectedMood === 'ok' && styles.moodButtonSelected]}
                            onPress={() => handleMoodSelect('ok')}
                        >
                            <Text style={styles.moodEmoji}>😐</Text>
                            <Text style={styles.moodLabel}>Fena Değil</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.moodButton, selectedMood === 'bad' && styles.moodButtonSelected]}
                            onPress={() => handleMoodSelect('bad')}
                        >
                            <Text style={styles.moodEmoji}>😞</Text>
                            <Text style={styles.moodLabel}>Zor</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>En zorlayan ders hangisiydi?</Text>
                        <Text style={styles.subtitle}>İstersen atlayabilirsin</Text>
                    </View>
                    <View style={styles.subjectGrid}>
                        {subjects.map((subject) => (
                            <TouchableOpacity
                                key={subject}
                                style={styles.subjectButton}
                                onPress={() => handleSubjectSelect(subject)}
                            >
                                <Text style={styles.subjectText}>{subject}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkipSubject}>
                        <Text style={styles.skipText}>Atla →</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 13,
    },
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    moodButton: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    moodButtonSelected: {
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
    },
    moodEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    moodLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
    },
    subjectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    subjectButton: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    subjectText: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '500',
    },
    skipButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    skipText: {
        color: '#A855F7',
        fontSize: 14,
        fontWeight: '600',
    },
    completedContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    completedIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    completedText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
    },
});
