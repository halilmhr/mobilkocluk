import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type StudyDuration = '0-30' | '30-60' | '60+';

interface StudyTimeCardProps {
    selectedDuration?: StudyDuration | null;
    onSelect: (duration: StudyDuration) => void;
    hasLoggedToday?: boolean;
}

export const StudyTimeCard: React.FC<StudyTimeCardProps> = ({
    selectedDuration,
    onSelect,
    hasLoggedToday = false,
}) => {
    const durations: { value: StudyDuration; label: string; icon: string }[] = [
        { value: '0-30', label: '0-30 dk', icon: '⚡' },
        { value: '30-60', label: '30-60 dk', icon: '📖' },
        { value: '60+', label: '60+ dk', icon: '🔥' },
    ];

    if (hasLoggedToday && selectedDuration) {
        return (
            <View style={styles.completedContainer}>
                <Text style={styles.completedIcon}>✅</Text>
                <View style={styles.completedContent}>
                    <Text style={styles.completedTitle}>Bugün çalışma süresi kaydedildi</Text>
                    <Text style={styles.completedValue}>
                        {durations.find(d => d.value === selectedDuration)?.icon}{' '}
                        {durations.find(d => d.value === selectedDuration)?.label}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>⏱️ Bugün ne kadar çalıştın?</Text>
            </View>

            <View style={styles.optionsRow}>
                {durations.map((item) => (
                    <TouchableOpacity
                        key={item.value}
                        style={[
                            styles.optionButton,
                            selectedDuration === item.value && styles.optionButtonSelected
                        ]}
                        onPress={() => onSelect(item.value)}
                    >
                        <Text style={styles.optionIcon}>{item.icon}</Text>
                        <Text style={[
                            styles.optionLabel,
                            selectedDuration === item.value && styles.optionLabelSelected
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
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
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    optionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    optionLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    optionLabelSelected: {
        color: '#10b981',
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
        fontSize: 24,
        marginRight: 14,
    },
    completedContent: {
        flex: 1,
    },
    completedTitle: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '600',
    },
    completedValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 4,
    },
});
