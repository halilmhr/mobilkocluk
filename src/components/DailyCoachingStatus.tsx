/**
 * Daily Coaching Status - With Integrated Modals
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal, ScrollView, Pressable } from 'react-native';
import { PREMIUM_COLORS } from '../styles/premiumStyles';

interface CoachingItem {
    name: string;
    detail: string;
}

interface DailyCoachingStatusProps {
    behindCount: number;
    overdueCount: number;
    inactiveCount: number;
    behindStudents: CoachingItem[];
    overdueItems: CoachingItem[];
    inactiveStudents: CoachingItem[];
}

export const DailyCoachingStatus: React.FC<DailyCoachingStatusProps> = ({
    behindCount,
    overdueCount,
    inactiveCount,
    behindStudents = [],
    overdueItems = [],
    inactiveStudents = [],
}) => {
    const [showBehindModal, setShowBehindModal] = useState(false);
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [showInactiveModal, setShowInactiveModal] = useState(false);

    const totalWarnings = behindCount + overdueCount + inactiveCount;

    const renderModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        icon: string,
        items: CoachingItem[],
        emptyText: string
    ) => (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalIcon}>{icon}</Text>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {items.length === 0 ? (
                            <Text style={styles.emptyText}>{emptyText}</Text>
                        ) : (
                            items.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemDetail}>{item.detail}</Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </RNModal>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.icon}>🎯</Text>
                    <Text style={styles.title}>Günlük Koçluk Durumu</Text>
                </View>
                {totalWarnings > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{totalWarnings} Uyarı</Text>
                    </View>
                )}
            </View>

            {/* Stats Rows */}
            <View style={styles.statsContainer}>
                <TouchableOpacity style={styles.statRow} onPress={() => setShowBehindModal(true)} activeOpacity={0.7}>
                    <Text style={styles.statIcon}>⚠️</Text>
                    <Text style={styles.statNumber}>{behindCount}</Text>
                    <Text style={styles.statLabel}>öğrenci geride kalıyor</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statRow} onPress={() => setShowOverdueModal(true)} activeOpacity={0.7}>
                    <Text style={styles.statIcon}>📋</Text>
                    <Text style={styles.statNumber}>{overdueCount}</Text>
                    <Text style={styles.statLabel}>görev gecikmiş</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statRow} onPress={() => setShowInactiveModal(true)} activeOpacity={0.7}>
                    <Text style={styles.statIcon}>😴</Text>
                    <Text style={styles.statNumber}>{inactiveCount}</Text>
                    <Text style={styles.statLabel}>öğrenci 3 gündür inaktif</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {renderModal(
                showBehindModal,
                () => setShowBehindModal(false),
                'Geride Kalan Öğrenciler',
                '⚠️',
                behindStudents,
                'Geride kalan öğrenci yok'
            )}
            {renderModal(
                showOverdueModal,
                () => setShowOverdueModal(false),
                'Geciken Görevler',
                '📋',
                overdueItems,
                'Geciken görev yok'
            )}
            {renderModal(
                showInactiveModal,
                () => setShowInactiveModal(false),
                'İnaktif Öğrenciler',
                '😴',
                inactiveStudents,
                'İnaktif öğrenci yok'
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: { fontSize: 18 },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    badge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    statsContainer: { gap: 8 },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    statIcon: { fontSize: 18, marginRight: 12 },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#60a5fa',
        marginRight: 8,
        minWidth: 24,
    },
    statLabel: {
        flex: 1,
        fontSize: 14,
        color: '#9ca3af',
    },
    arrow: { fontSize: 16, color: '#6b7280' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalIcon: { fontSize: 20, marginRight: 10 },
    modalTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: { color: '#9ca3af', fontSize: 14 },
    modalBody: { padding: 16 },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    listItem: {
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 2,
    },
    itemDetail: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
