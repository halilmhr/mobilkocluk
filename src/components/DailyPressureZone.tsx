import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { usePremium } from '../context/PremiumContext';

interface Student {
    id: string;
    name: string;
    assignments?: any[];
    dailyLogs?: any[];
    lastActive?: string;
}

interface DailyPressureZoneProps {
    studentsAtRisk: number;
    overdueTasksCount: number;
    inactiveStudentsCount: number;
    inactiveDays?: number;
    // New: actual data for details
    behindStudents?: Student[];
    overdueAssignments?: { studentName: string; title: string; dueDate: string }[];
    inactiveStudents?: { name: string; lastActive: string }[];
}

export const DailyPressureZone: React.FC<DailyPressureZoneProps> = ({
    studentsAtRisk,
    overdueTasksCount,
    inactiveStudentsCount,
    inactiveDays = 4,
    behindStudents = [],
    overdueAssignments = [],
    inactiveStudents = [],
}) => {
    const { isPremium, showUpgradeModal } = usePremium();
    const [modalType, setModalType] = useState<'behind' | 'overdue' | 'inactive' | null>(null);

    const handleItemPress = (type: 'behind' | 'overdue' | 'inactive') => {
        if (!isPremium) {
            showUpgradeModal();
            return;
        }
        setModalType(type);
    };

    const totalIssues = studentsAtRisk + overdueTasksCount + inactiveStudentsCount;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Bilinmiyor';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Bugün';
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerIcon}>🎯</Text>
                    <Text style={styles.headerTitle}>Günlük Koçluk Durumu</Text>
                </View>
                {totalIssues > 0 && (
                    <View style={[styles.alertBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                        <Text style={styles.alertBadgeText}>{totalIssues} Uyarı</Text>
                    </View>
                )}
            </View>

            {/* Pressure Items - Now Clickable */}
            <View style={styles.itemsContainer}>
                {studentsAtRisk > 0 && (
                    <TouchableOpacity
                        style={styles.pressureItem}
                        onPress={() => handleItemPress('behind')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.pressureIcon}>⚠️</Text>
                        <Text style={[styles.pressureCount, { color: '#ef4444' }]}>{studentsAtRisk}</Text>
                        <Text style={styles.pressureLabel}>öğrenci geride kalıyor</Text>
                        <Text style={styles.chevron}>→</Text>
                    </TouchableOpacity>
                )}

                {overdueTasksCount > 0 && (
                    <TouchableOpacity
                        style={styles.pressureItem}
                        onPress={() => handleItemPress('overdue')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.pressureIcon}>📋</Text>
                        <Text style={[styles.pressureCount, { color: '#f59e0b' }]}>{overdueTasksCount}</Text>
                        <Text style={styles.pressureLabel}>görev gecikmiş</Text>
                        <Text style={styles.chevron}>→</Text>
                    </TouchableOpacity>
                )}

                {inactiveStudentsCount > 0 && (
                    <TouchableOpacity
                        style={styles.pressureItem}
                        onPress={() => handleItemPress('inactive')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.pressureIcon}>😴</Text>
                        <Text style={[styles.pressureCount, { color: '#6366f1' }]}>{inactiveStudentsCount}</Text>
                        <Text style={styles.pressureLabel}>{`öğrenci ${inactiveDays} gündür inaktif`}</Text>
                        <Text style={styles.chevron}>→</Text>
                    </TouchableOpacity>
                )}

                {totalIssues === 0 && (
                    <View style={styles.allGood}>
                        <Text style={styles.allGoodIcon}>✅</Text>
                        <Text style={styles.allGoodText}>Tüm öğrenciler yolunda!</Text>
                    </View>
                )}
            </View>

            {/* Premium Lock for non-premium users */}
            {!isPremium && totalIssues > 0 && (
                <View style={styles.premiumHint}>
                    <Text style={styles.premiumHintIcon}>🔒</Text>
                    <Text style={styles.premiumHintText}>Detayları görmek için Premium'a geç</Text>
                </View>
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
                                {modalType === 'behind' && '⚠️ Geride Kalan Öğrenciler'}
                                {modalType === 'overdue' && '📋 Gecikmiş Ödevler'}
                                {modalType === 'inactive' && '😴 İnaktif Öğrenciler'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalType(null)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {modalType === 'behind' && (
                                behindStudents.length > 0 ? (
                                    behindStudents.map((student, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: '#ef4444' }]}>
                                                <Text style={styles.modalItemAvatarText}>{student.name.charAt(0)}</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{student.name}</Text>
                                                <Text style={styles.modalItemSub}>
                                                    {student.assignments?.filter((a: any) => !a.isCompleted).length || 0} tamamlanmamış ödev
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>Geride kalan öğrenci yok</Text>
                                )
                            )}

                            {modalType === 'overdue' && (
                                overdueAssignments.length > 0 ? (
                                    overdueAssignments.map((item, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: '#f59e0b' }]}>
                                                <Text style={styles.modalItemAvatarText}>📋</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{item.studentName}</Text>
                                                <Text style={styles.modalItemSub}>{item.title}</Text>
                                                <Text style={styles.modalItemDate}>Bitiş: {formatDate(item.dueDate)}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>Gecikmiş ödev yok</Text>
                                )
                            )}

                            {modalType === 'inactive' && (
                                inactiveStudents.length > 0 ? (
                                    inactiveStudents.map((student, idx) => (
                                        <View key={idx} style={styles.modalItem}>
                                            <View style={[styles.modalItemAvatar, { backgroundColor: '#6366f1' }]}>
                                                <Text style={styles.modalItemAvatarText}>{student.name.charAt(0)}</Text>
                                            </View>
                                            <View style={styles.modalItemInfo}>
                                                <Text style={styles.modalItemName}>{student.name}</Text>
                                                <Text style={styles.modalItemSub}>Son aktivite: {formatDate(student.lastActive)}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.modalEmpty}>İnaktif öğrenci yok</Text>
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
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
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    alertBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    alertBadgeText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    itemsContainer: {
        gap: 10,
    },
    pressureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 14,
        borderRadius: 12,
    },
    pressureIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    pressureCount: {
        fontSize: 20,
        fontWeight: '800',
        marginRight: 8,
    },
    pressureLabel: {
        color: '#94A3B8',
        fontSize: 14,
        flex: 1,
    },
    chevron: {
        color: '#64748b',
        fontSize: 16,
    },
    allGood: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    allGoodIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    allGoodText: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: '600',
    },
    premiumHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        padding: 10,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderRadius: 10,
    },
    premiumHintIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    premiumHintText: {
        color: '#A855F7',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalClose: {
        color: '#94a3b8',
        fontSize: 24,
    },
    modalScroll: {
        padding: 16,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    modalItemAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalItemAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalItemInfo: {
        flex: 1,
    },
    modalItemName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    modalItemSub: {
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 2,
    },
    modalItemDate: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 2,
    },
    modalEmpty: {
        color: '#64748b',
        textAlign: 'center',
        padding: 20,
    },
});
