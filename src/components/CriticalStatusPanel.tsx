/**
 * Critical Status Panel - Premium Coach Dashboard
 * 
 * Action required items with red accent bars and glow effects
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { PREMIUM_COLORS, PREMIUM_SPACING, PREMIUM_TYPOGRAPHY, PREMIUM_SHADOWS } from '../styles/premiumStyles';
import { usePremium } from '../context/PremiumContext';

interface CriticalItem {
    type: 'passive' | 'overdue' | 'declining';
    count: number;
    label: string;
    icon: string;
    color: string;
}

interface PassiveStudent {
    name: string;
    lastActive: string;
    passiveDays: number;
}

interface OverdueTask {
    studentName: string;
    title: string;
    dueDate: string;
    daysOverdue: number;
}

interface DecliningStudent {
    name: string;
    weeklyChange: number;
    previousWeek: number;
    currentWeek: number;
}

interface CriticalStatusPanelProps {
    passiveStudentsCount: number;
    overdueTasksCount: number;
    decliningStudentsCount: number;
    passiveStudents?: PassiveStudent[];
    overdueTasks?: OverdueTask[];
    decliningStudents?: DecliningStudent[];
    onPassivePress?: () => void;
    onOverduePress?: () => void;
    onDecliningPress?: () => void;
}

export const CriticalStatusPanel: React.FC<CriticalStatusPanelProps> = ({
    passiveStudentsCount,
    overdueTasksCount,
    decliningStudentsCount,
    passiveStudents = [],
    overdueTasks = [],
    decliningStudents = [],
}) => {
    const { isPremium, showUpgradeModal } = usePremium();
    const [modalType, setModalType] = useState<'passive' | 'overdue' | 'declining' | null>(null);

    const totalIssues = passiveStudentsCount + overdueTasksCount + decliningStudentsCount;

    const criticalItems: CriticalItem[] = [
        {
            type: 'passive' as const,
            count: passiveStudentsCount,
            label: '3+ gündür pasif öğrenci',
            icon: '⚠️',
            color: PREMIUM_COLORS.danger,
        },
        {
            type: 'overdue' as const,
            count: overdueTasksCount,
            label: 'Geciken görev',
            icon: '⏳',
            color: PREMIUM_COLORS.warning,
        },
        {
            type: 'declining' as const,
            count: decliningStudentsCount,
            label: 'Performans düşüşü yaşayan',
            icon: '📉',
            color: PREMIUM_COLORS.accent,
        },
    ].filter(item => item.count > 0);

    const handleItemPress = (type: 'passive' | 'overdue' | 'declining') => {
        if (!isPremium) {
            showUpgradeModal();
            return;
        }
        setModalType(type);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Bilinmiyor';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    if (totalIssues === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>🎯</Text>
                    <Text style={styles.headerTitle}>Kritik Durumlar</Text>
                </View>
                <View style={styles.allGoodCard}>
                    <Text style={styles.allGoodEmoji}>✅</Text>
                    <Text style={styles.allGoodText}>Tüm öğrenciler yolunda!</Text>
                    <Text style={styles.allGoodSubtext}>Kritik durum yok</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerIcon}>🎯</Text>
                    <Text style={styles.headerTitle}>Kritik Durumlar</Text>
                </View>
                <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{totalIssues} Uyarı</Text>
                </View>
            </View>

            {/* Critical Items */}
            <View style={styles.itemsContainer}>
                {criticalItems.map((item, index) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[
                            styles.criticalCard,
                            { borderLeftColor: item.color },
                            index === 0 && styles.criticalCardFirst,
                        ]}
                        onPress={() => handleItemPress(item.type)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.accentBar, { backgroundColor: item.color }]} />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardIcon}>{item.icon}</Text>
                            <View style={styles.cardTextContainer}>
                                <Text style={[styles.cardCount, { color: item.color }]}>
                                    {item.count}
                                </Text>
                                <Text style={styles.cardLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.detailButton}>
                                <Text style={styles.detailButtonText}>Detay</Text>
                                <Text style={styles.detailArrow}>→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Premium Lock Hint */}
            {!isPremium && (
                <TouchableOpacity style={styles.premiumHint} onPress={showUpgradeModal}>
                    <Text style={styles.premiumHintIcon}>🔒</Text>
                    <Text style={styles.premiumHintText}>Detayları görmek için Premium'a geç</Text>
                </TouchableOpacity>
            )}

            {/* Detail Modals */}
            <Modal
                visible={modalType !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalType(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'passive' && '⚠️ Pasif Öğrenciler'}
                                {modalType === 'overdue' && '⏳ Geciken Görevler'}
                                {modalType === 'declining' && '📉 Performans Düşüşü'}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setModalType(null)}
                            >
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {modalType === 'passive' && (
                                passiveStudents.length > 0 ? (
                                    passiveStudents.map((student, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: PREMIUM_COLORS.danger }]}>
                                                <Text style={styles.modalItemAvatarText}>{student.name.charAt(0)}</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{student.name}</Text>
                                                <Text style={styles.modalItemSub}>
                                                    {student.passiveDays} gündür giriş yapmadı
                                                </Text>
                                            </View>
                                            <TouchableOpacity style={styles.actionBtn}>
                                                <Text style={styles.actionBtnText}>Mesaj</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>Pasif öğrenci yok</Text>
                                )
                            )}

                            {modalType === 'overdue' && (
                                overdueTasks.length > 0 ? (
                                    overdueTasks.map((task, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: PREMIUM_COLORS.warning }]}>
                                                <Text style={styles.modalItemAvatarText}>📋</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{task.studentName}</Text>
                                                <Text style={styles.modalItemSub}>{task.title}</Text>
                                                <Text style={styles.modalItemDate}>
                                                    {task.daysOverdue} gün gecikmiş
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>Geciken görev yok</Text>
                                )
                            )}

                            {modalType === 'declining' && (
                                decliningStudents.length > 0 ? (
                                    decliningStudents.map((student, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: PREMIUM_COLORS.accent }]}>
                                                <Text style={styles.modalItemAvatarText}>{student.name.charAt(0)}</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{student.name}</Text>
                                                <Text style={styles.modalItemSub}>
                                                    Geçen hafta: {student.previousWeek} soru → Bu hafta: {student.currentWeek} soru
                                                </Text>
                                                <Text style={[styles.modalItemDate, { color: PREMIUM_COLORS.danger }]}>
                                                    %{Math.abs(student.weeklyChange)} düşüş
                                                </Text>
                                            </View>
                                            <TouchableOpacity style={styles.actionBtn}>
                                                <Text style={styles.actionBtnText}>Plan</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>Performans düşüşü yok</Text>
                                )
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: PREMIUM_SPACING.sectionGap,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: PREMIUM_SPACING.gap,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    headerTitle: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.h3,
    },
    alertBadge: {
        backgroundColor: PREMIUM_COLORS.dangerSoft,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    alertBadgeText: {
        color: PREMIUM_COLORS.danger,
        fontSize: 12,
        fontWeight: '700',
    },
    itemsContainer: {
        gap: PREMIUM_SPACING.gapSm,
    },
    criticalCard: {
        backgroundColor: PREMIUM_COLORS.surface,
        borderRadius: PREMIUM_SPACING.borderRadius,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
        borderLeftWidth: 4,
        overflow: 'hidden',
        ...PREMIUM_SHADOWS.sm,
    },
    criticalCardFirst: {
        shadowColor: PREMIUM_COLORS.danger,
        shadowOpacity: 0.15,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: PREMIUM_SPACING.padding,
        paddingLeft: PREMIUM_SPACING.padding + 4,
    },
    cardIcon: {
        fontSize: 24,
        marginRight: PREMIUM_SPACING.gap,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardCount: {
        fontSize: 24,
        fontWeight: '800',
    },
    cardLabel: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PREMIUM_COLORS.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    detailButtonText: {
        color: PREMIUM_COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginRight: 4,
    },
    detailArrow: {
        color: PREMIUM_COLORS.textMuted,
        fontSize: 14,
    },
    allGoodCard: {
        backgroundColor: PREMIUM_COLORS.successSoft,
        borderRadius: PREMIUM_SPACING.borderRadius,
        padding: PREMIUM_SPACING.paddingLg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.success,
    },
    allGoodEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    allGoodText: {
        color: PREMIUM_COLORS.success,
        ...PREMIUM_TYPOGRAPHY.h3,
    },
    allGoodSubtext: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginTop: 4,
    },
    premiumHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: PREMIUM_SPACING.gap,
        padding: PREMIUM_SPACING.paddingSm,
        backgroundColor: PREMIUM_COLORS.accentSoft,
        borderRadius: 10,
    },
    premiumHintIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    premiumHintText: {
        color: PREMIUM_COLORS.accent,
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: PREMIUM_COLORS.surface,
        borderTopLeftRadius: PREMIUM_SPACING.borderRadiusXl,
        borderTopRightRadius: PREMIUM_SPACING.borderRadiusXl,
        maxHeight: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: PREMIUM_SPACING.paddingLg,
        borderBottomWidth: 1,
        borderBottomColor: PREMIUM_COLORS.surfaceLight,
    },
    modalTitle: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.h2,
    },
    modalCloseBtn: {
        padding: 8,
    },
    modalClose: {
        color: PREMIUM_COLORS.textSecondary,
        fontSize: 24,
    },
    modalScroll: {
        padding: PREMIUM_SPACING.padding,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PREMIUM_COLORS.background,
        padding: PREMIUM_SPACING.padding,
        borderRadius: PREMIUM_SPACING.borderRadius,
        marginBottom: PREMIUM_SPACING.gapSm,
    },
    modalItemAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: PREMIUM_SPACING.gap,
    },
    modalItemAvatarText: {
        color: PREMIUM_COLORS.text,
        fontSize: 18,
        fontWeight: '700',
    },
    modalItemInfo: {
        flex: 1,
    },
    modalItemName: {
        color: PREMIUM_COLORS.text,
        ...PREMIUM_TYPOGRAPHY.body,
        fontWeight: '600',
    },
    modalItemSub: {
        color: PREMIUM_COLORS.textSecondary,
        ...PREMIUM_TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    modalItemDate: {
        color: PREMIUM_COLORS.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    actionBtn: {
        backgroundColor: PREMIUM_COLORS.accent,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        color: PREMIUM_COLORS.text,
        fontSize: 13,
        fontWeight: '600',
    },
    modalEmpty: {
        color: PREMIUM_COLORS.textMuted,
        textAlign: 'center',
        padding: PREMIUM_SPACING.paddingLg,
    },
});
