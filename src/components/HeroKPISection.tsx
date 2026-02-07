/**
 * Hero KPI Section - Premium Coach Dashboard
 * 
 * Büyük dominant risk metriği + 3 küçük KPI kartı
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PREMIUM_COLORS, PREMIUM_SPACING, PREMIUM_TYPOGRAPHY, PREMIUM_SHADOWS } from '../styles/premiumStyles';

interface HeroKPISectionProps {
    riskStudentsCount: number;
    totalStudents: number;
    activeStudents: number;
    weeklyCompletionRate: number;
}

export const HeroKPISection: React.FC<HeroKPISectionProps> = ({
    riskStudentsCount,
    totalStudents,
    activeStudents,
    weeklyCompletionRate,
}) => {
    // Animated glow effect for risk count
    const glowAnim = React.useRef(new Animated.Value(0.5)).current;

    React.useEffect(() => {
        if (riskStudentsCount > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.5,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        }
    }, [riskStudentsCount]);

    const glowStyle = riskStudentsCount > 0 ? {
        shadowOpacity: glowAnim,
    } : {};

    return (
        <View style={styles.container}>
            {/* Main Hero Metric */}
            <Animated.View style={[
                styles.heroCard,
                riskStudentsCount > 0 && styles.heroCardDanger,
                glowStyle,
            ]}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroEmoji}>🔥</Text>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroLabel}>Bugün Riskli Öğrenci</Text>
                        <Text style={[
                            styles.heroNumber,
                            riskStudentsCount > 0 && styles.heroNumberDanger
                        ]}>
                            {riskStudentsCount}
                        </Text>
                    </View>
                </View>
                {riskStudentsCount > 0 && (
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>Acil Müdahale</Text>
                    </View>
                )}
            </Animated.View>

            {/* Small KPI Cards */}
            <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiEmoji}>👥</Text>
                    <Text style={[styles.kpiNumber, { color: PREMIUM_COLORS.info }]}>
                        {totalStudents}
                    </Text>
                    <Text style={styles.kpiLabel}>Toplam Öğrenci</Text>
                </View>

                <View style={styles.kpiCard}>
                    <Text style={styles.kpiEmoji}>✅</Text>
                    <Text style={[styles.kpiNumber, { color: PREMIUM_COLORS.success }]}>
                        {activeStudents}
                    </Text>
                    <Text style={styles.kpiLabel}>Son 7 Gün Aktif</Text>
                </View>

                <View style={styles.kpiCard}>
                    <Text style={styles.kpiEmoji}>📊</Text>
                    <Text style={[
                        styles.kpiNumber,
                        { color: weeklyCompletionRate >= 70 ? PREMIUM_COLORS.success : PREMIUM_COLORS.warning }
                    ]}>
                        %{weeklyCompletionRate}
                    </Text>
                    <Text style={styles.kpiLabel}>Haftalık Tamamlama</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: PREMIUM_SPACING.sectionGap,
    },
    heroCard: {
        backgroundColor: PREMIUM_COLORS.surface,
        borderRadius: PREMIUM_SPACING.borderRadiusLg,
        padding: PREMIUM_SPACING.paddingLg,
        marginBottom: PREMIUM_SPACING.gap,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
        ...PREMIUM_SHADOWS.md,
    },
    heroCardDanger: {
        borderColor: PREMIUM_COLORS.danger,
        backgroundColor: PREMIUM_COLORS.dangerSoft,
        shadowColor: PREMIUM_COLORS.danger,
        shadowOpacity: 0.3,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroEmoji: {
        fontSize: 40,
        marginRight: PREMIUM_SPACING.padding,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroLabel: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.heroLabel,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    heroNumber: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.heroNumber,
    },
    heroNumberDanger: {
        color: PREMIUM_COLORS.danger,
    },
    heroBadge: {
        position: 'absolute',
        top: PREMIUM_SPACING.padding,
        right: PREMIUM_SPACING.padding,
        backgroundColor: PREMIUM_COLORS.danger,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    heroBadgeText: {
        color: PREMIUM_COLORS.text,
        fontSize: 11,
        fontWeight: '700',
    },
    kpiRow: {
        flexDirection: 'row',
        gap: PREMIUM_SPACING.gap,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: PREMIUM_COLORS.surface,
        borderRadius: PREMIUM_SPACING.borderRadius,
        padding: PREMIUM_SPACING.padding,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
    },
    kpiEmoji: {
        fontSize: 20,
        marginBottom: 6,
    },
    kpiNumber: {
        ...PREMIUM_TYPOGRAPHY.kpiNumber,
        color: PREMIUM_COLORS.text,
    },
    kpiLabel: {
        ...PREMIUM_TYPOGRAPHY.kpiLabel,
        color: PREMIUM_COLORS.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
});
