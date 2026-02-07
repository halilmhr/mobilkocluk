/**
 * Performance Chart - Refined Premium Design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';

interface PerformanceChartProps {
    data: number[];
    weeklyChange: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
    data,
    weeklyChange,
}) => {
    const maxValue = Math.max(...data, 1);
    const isPositive = weeklyChange >= 0;

    const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📈 Son 7 Gün</Text>
                <View style={[
                    styles.badge,
                    isPositive ? styles.badgePositive : styles.badgeNegative
                ]}>
                    <Text style={[
                        styles.badgeText,
                        isPositive ? styles.textPositive : styles.textNegative
                    ]}>
                        {isPositive ? '+' : ''}{weeklyChange}%
                    </Text>
                </View>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Haftalık performans özeti</Text>

            {/* Chart */}
            <View style={styles.chartArea}>
                {data.map((value, index) => {
                    const barHeight = Math.max((value / maxValue) * 70, 4);
                    const isToday = index === data.length - 1;

                    return (
                        <View key={index} style={styles.barWrapper}>
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        { height: barHeight },
                                        isToday && styles.barToday,
                                    ]}
                                />
                                {isToday && <View style={styles.todayGlow} />}
                            </View>
                            <Text style={[
                                styles.dayLabel,
                                isToday && styles.dayLabelActive
                            ]}>
                                {dayLabels[index]}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Geçen haftaya göre {isPositive ? 'artış' : 'düşüş'} gösteriyor
            </Text>
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
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgePositive: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    badgeNegative: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    textPositive: {
        color: '#10b981',
    },
    textNegative: {
        color: '#ef4444',
    },
    subtitle: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 14,
    },
    chartArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 90,
        marginBottom: 8,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        height: 70,
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    bar: {
        width: 18,
        backgroundColor: '#374151',
        borderRadius: 4,
    },
    barToday: {
        backgroundColor: '#8b5cf6',
    },
    todayGlow: {
        position: 'absolute',
        bottom: 0,
        width: 18,
        height: '100%',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderRadius: 4,
    },
    dayLabel: {
        marginTop: 6,
        fontSize: 9,
        color: '#6b7280',
        fontWeight: '500',
    },
    dayLabelActive: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    footer: {
        textAlign: 'center',
        fontSize: 10,
        color: '#6b7280',
    },
});
