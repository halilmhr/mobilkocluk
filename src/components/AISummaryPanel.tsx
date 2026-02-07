/**
 * AI Summary Panel - Refined Premium Design
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';

interface AISummaryPanelProps {
    weeklyActivityChange: number;
    totalOverdueTasks: number;
    mostActiveStudent: string | null;
    onViewDetails: () => void;
    lastUpdate?: Date;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({
    weeklyActivityChange,
    totalOverdueTasks,
    mostActiveStudent,
    onViewDetails,
    lastUpdate,
}) => {
    const isPositive = weeklyActivityChange >= 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>AI Özet</Text>
                <Text style={styles.updateText}>şimdi</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📊</Text>
                    <Text style={[
                        styles.statValue,
                        isPositive ? styles.valuePositive : styles.valueNegative
                    ]}>
                        {isPositive ? '+' : ''}{weeklyActivityChange}%
                    </Text>
                    <Text style={styles.statLabel}>Aktivite</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>⏳</Text>
                    <Text style={[
                        styles.statValue,
                        totalOverdueTasks > 0 ? styles.valueNegative : styles.valuePositive
                    ]}>
                        {totalOverdueTasks}
                    </Text>
                    <Text style={styles.statLabel}>Gecikme</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>⭐</Text>
                    <Text style={styles.statValue} numberOfLines={1}>
                        {mostActiveStudent?.split(' ')[0] || '—'}
                    </Text>
                    <Text style={styles.statLabel}>En Aktif</Text>
                </View>
            </View>

            {/* Detail Button */}
            <TouchableOpacity style={styles.detailButton} onPress={onViewDetails}>
                <Text style={styles.detailButtonText}>Detaylı AI Analizi</Text>
                <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    updateText: {
        fontSize: 10,
        color: '#6b7280',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1f2937',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e5e7eb',
        marginBottom: 2,
    },
    valuePositive: {
        color: '#10b981',
    },
    valueNegative: {
        color: '#ef4444',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '500',
        color: '#6b7280',
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    detailButtonText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '600',
    },
    arrow: {
        color: '#a78bfa',
        fontSize: 12,
        marginLeft: 4,
    },
});
