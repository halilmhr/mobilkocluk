/**
 * AI Recommendation Card - Premium Coach Dashboard
 * 
 * Maksimum 2 satır AI önerisi + 2 aksiyon butonu
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PREMIUM_COLORS, PREMIUM_SPACING, PREMIUM_TYPOGRAPHY, PREMIUM_SHADOWS } from '../styles/premiumStyles';
import { usePremium } from '../context/PremiumContext';

export interface AIRecommendation {
    studentName: string;
    message: string; // Maksimum 2 satır
    riskScore: number;
    suggestedActions: ('message' | 'updatePlan')[];
}

interface AIRecommendationCardProps {
    recommendation: AIRecommendation | null;
    isLoading?: boolean;
    onSendMessage?: (studentName: string) => void;
    onUpdatePlan?: (studentName: string) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
    recommendation,
    isLoading = false,
    onSendMessage,
    onUpdatePlan,
}) => {
    const { isPremium, showUpgradeModal } = usePremium();

    const handleSendMessage = () => {
        if (!isPremium) {
            showUpgradeModal();
            return;
        }
        if (recommendation && onSendMessage) {
            onSendMessage(recommendation.studentName);
        }
    };

    const handleUpdatePlan = () => {
        if (!isPremium) {
            showUpgradeModal();
            return;
        }
        if (recommendation && onUpdatePlan) {
            onUpdatePlan(recommendation.studentName);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.aiIcon}>
                    <Text style={styles.aiEmoji}>🤖</Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>AI Önerisi</Text>
                    <Text style={styles.subtitle}>
                        {isLoading ? 'Analiz ediliyor...' : 'Öncelikli aksiyon önerisi'}
                    </Text>
                </View>
                <View style={[styles.glowDot, isLoading && styles.glowDotLoading]} />
            </View>

            {/* Content */}
            <View style={styles.contentCard}>
                {isLoading ? (
                    <ActivityIndicator color={PREMIUM_COLORS.accent} size="small" style={{ marginVertical: 20 }} />
                ) : recommendation ? (
                    <>
                        {isPremium ? (
                            <Text style={styles.recommendationText} numberOfLines={2}>
                                "{recommendation.message}"
                            </Text>
                        ) : (
                            <Text style={styles.blurredText}>
                                {'█'.repeat(40)}
                            </Text>
                        )}
                    </>
                ) : (
                    <Text style={styles.emptyText}>
                        Tüm öğrenciler yolunda görünüyor. 🎉
                    </Text>
                )}
            </View>

            {/* Action Buttons */}
            {recommendation && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleSendMessage}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionButtonIcon}>💬</Text>
                        <Text style={styles.actionButtonText}>Hazır Mesaj Gönder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={handleUpdatePlan}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionButtonIcon}>📋</Text>
                        <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                            Program Güncelle
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Premium Lock */}
            {!isPremium && recommendation && (
                <TouchableOpacity style={styles.premiumLock} onPress={showUpgradeModal}>
                    <Text style={styles.premiumLockIcon}>🔒</Text>
                    <Text style={styles.premiumLockText}>AI önerileri için Premium'a geç</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: PREMIUM_COLORS.surface,
        borderRadius: PREMIUM_SPACING.borderRadiusLg,
        padding: PREMIUM_SPACING.cardPadding,
        marginBottom: PREMIUM_SPACING.sectionGap,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.accentGlow,
        ...PREMIUM_SHADOWS.md,
        shadowColor: PREMIUM_COLORS.accent,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: PREMIUM_SPACING.gap,
    },
    aiIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: PREMIUM_COLORS.accentSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: PREMIUM_SPACING.gap,
    },
    aiEmoji: {
        fontSize: 22,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.h3,
    },
    subtitle: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    glowDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: PREMIUM_COLORS.accent,
        shadowColor: PREMIUM_COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    glowDotLoading: {
        backgroundColor: PREMIUM_COLORS.warning,
        shadowColor: PREMIUM_COLORS.warning,
    },
    contentCard: {
        backgroundColor: PREMIUM_COLORS.background,
        borderRadius: PREMIUM_SPACING.borderRadius,
        padding: PREMIUM_SPACING.padding,
        marginBottom: PREMIUM_SPACING.gap,
    },
    recommendationText: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.body,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    blurredText: {
        color: PREMIUM_COLORS.textDark,
        fontSize: 14,
    },
    emptyText: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.body,
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: PREMIUM_SPACING.gapSm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PREMIUM_COLORS.surfaceLight,
        paddingVertical: PREMIUM_SPACING.paddingSm,
        paddingHorizontal: PREMIUM_SPACING.paddingSm,
        borderRadius: PREMIUM_SPACING.borderRadiusSm,
    },
    actionButtonPrimary: {
        backgroundColor: PREMIUM_COLORS.accent,
    },
    actionButtonIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    actionButtonText: {
        color: PREMIUM_COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtonTextPrimary: {
        color: PREMIUM_COLORS.text,
    },
    premiumLock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: PREMIUM_SPACING.gap,
        padding: PREMIUM_SPACING.paddingSm,
        backgroundColor: PREMIUM_COLORS.accentSoft,
        borderRadius: 10,
    },
    premiumLockIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    premiumLockText: {
        color: PREMIUM_COLORS.accent,
        fontSize: 12,
    },
});
