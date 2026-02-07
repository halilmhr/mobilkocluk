/**
 * Elite Hero Section - Refined Premium Design
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';

interface EliteHeroSectionProps {
    criticalCount: number;
    onViewRiskStudents: () => void;
    onSendBulkMessage: () => void;
    lastAnalysis?: Date;
}

export const EliteHeroSection: React.FC<EliteHeroSectionProps> = ({
    criticalCount,
    onViewRiskStudents,
    onSendBulkMessage,
    lastAnalysis,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (criticalCount > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.01,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [criticalCount]);

    const formatTime = () => {
        const now = lastAnalysis || new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    };

    const hasCritical = criticalCount > 0;

    return (
        <Animated.View
            style={[
                styles.container,
                hasCritical && styles.containerCritical,
                { transform: [{ scale: pulseAnim }] },
            ]}
        >
            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <Text style={styles.emoji}>🔥</Text>
                    <Text style={[styles.count, !hasCritical && styles.countSafe]}>
                        {criticalCount}
                    </Text>
                </View>

                <View style={styles.rightSection}>
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>{formatTime()} • Canlı</Text>
                    </View>
                    <Text style={styles.label}>
                        {hasCritical ? 'Öğrenci Kritik Riskte' : 'Tüm Öğrenciler Yolunda'}
                    </Text>
                </View>
            </View>

            {/* Buttons - Compact */}
            {hasCritical && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onViewRiskStudents}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Riskli Öğrenciler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={onSendBulkMessage}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.outlineButtonText}>Toplu Mesaj</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    containerCritical: {
        borderColor: 'rgba(239, 68, 68, 0.2)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 32,
        marginRight: 8,
    },
    count: {
        fontSize: 48,
        fontWeight: '800',
        color: '#ef4444',
    },
    countSafe: {
        color: '#10b981',
    },
    rightSection: {
        flex: 1,
        marginLeft: 16,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#10b981',
        marginRight: 5,
    },
    liveText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '500',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#dc2626',
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    outlineButton: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    outlineButtonText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
});
