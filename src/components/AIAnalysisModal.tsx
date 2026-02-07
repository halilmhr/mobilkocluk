/**
 * AI Analysis Modal - Comprehensive Student Analytics
 * Shows detailed AI-powered insights about student performance
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Pressable,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface StudentStats {
    name: string;
    lastActive: string;
    overdueCount: number;
    completionRate: number;
}

interface AIAnalysisModalProps {
    visible: boolean;
    onClose: () => void;
    weeklyActivityChange: number;
    totalOverdueTasks: number;
    studentCount: number;
    criticalCount: number;
    activeStudents: number;
    avgCompletionRate: number;
    topStudents: StudentStats[];
    atRiskStudents: StudentStats[];
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
    visible,
    onClose,
    weeklyActivityChange,
    totalOverdueTasks,
    studentCount,
    criticalCount,
    activeStudents,
    avgCompletionRate,
    topStudents = [],
    atRiskStudents = [],
}) => {
    const isPositive = weeklyActivityChange >= 0;

    const getHealthScore = () => {
        let score = 100;
        score -= criticalCount * 15;
        score -= totalOverdueTasks * 5;
        score -= (100 - avgCompletionRate) * 0.3;
        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const healthScore = getHealthScore();
    const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#fbbf24' : '#ef4444';
    const healthLabel = healthScore >= 70 ? 'Mükemmel' : healthScore >= 40 ? 'Orta' : 'Kritik';

    const renderStudentTable = (students: StudentStats[]) => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { flex: 2 }]}>Öğrenci</Text>
                <Text style={styles.columnHeader}>Son Giriş</Text>
                <Text style={styles.columnHeader}>Geciken</Text>
                <Text style={styles.columnHeader}>Başarı</Text>
            </View>
            {students.map((student, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.studentName, { flex: 2 }]} numberOfLines={1}>
                        {student.name}
                    </Text>
                    <Text style={styles.tableValue}>{student.lastActive}</Text>
                    <Text style={[styles.tableValue, { color: student.overdueCount > 0 ? '#ef4444' : '#9ca3af' }]}>
                        {student.overdueCount}
                    </Text>
                    <Text style={[styles.tableValue, { color: student.completionRate >= 70 ? '#10b981' : '#fbbf24' }]}>
                        %{Math.round(student.completionRate)}
                    </Text>
                </View>
            ))}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerIcon}>🤖</Text>
                            <View>
                                <Text style={styles.headerTitle}>AI Analizi</Text>
                                <Text style={styles.headerSubtitle}>Detaylı Performans Raporu</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Health Score Card */}
                        <View style={[styles.healthCard, { borderColor: healthColor }]}>
                            <View style={styles.healthHeader}>
                                <Text style={styles.healthLabel}>Genel Sağlık Skoru</Text>
                                <View style={[styles.healthBadge, { backgroundColor: `${healthColor}20` }]}>
                                    <Text style={[styles.healthBadgeText, { color: healthColor }]}>{healthLabel}</Text>
                                </View>
                            </View>
                            <View style={styles.healthScoreRow}>
                                <Text style={[styles.healthScore, { color: healthColor }]}>{healthScore}</Text>
                                <Text style={styles.healthMax}>/100</Text>
                            </View>
                            <View style={styles.healthBar}>
                                <View style={[styles.healthFill, { width: `${healthScore}%`, backgroundColor: healthColor }]} />
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.quickStats}>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickIcon}>👥</Text>
                                <Text style={styles.quickValue}>{studentCount}</Text>
                                <Text style={styles.quickLabel}>Öğrenci</Text>
                            </View>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickIcon}>✅</Text>
                                <Text style={[styles.quickValue, { color: '#10b981' }]}>{activeStudents}</Text>
                                <Text style={styles.quickLabel}>Aktif</Text>
                            </View>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickIcon}>⚠️</Text>
                                <Text style={[styles.quickValue, { color: '#ef4444' }]}>{criticalCount}</Text>
                                <Text style={styles.quickLabel}>Riskli</Text>
                            </View>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickIcon}>📊</Text>
                                <Text style={[styles.quickValue, { color: isPositive ? '#10b981' : '#ef4444' }]}>
                                    {isPositive ? '+' : ''}{weeklyActivityChange}%
                                </Text>
                                <Text style={styles.quickLabel}>Haftalık</Text>
                            </View>
                        </View>

                        {/* Section: Top Performers */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>⭐</Text>
                                <Text style={styles.sectionTitle}>En Başarılı Öğrenciler</Text>
                            </View>
                            {topStudents.length > 0 ? (
                                renderStudentTable(topStudents.slice(0, 5))
                            ) : (
                                <Text style={styles.emptyText}>Henüz yeterli veri yok</Text>
                            )}
                        </View>

                        {/* Section: At Risk */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>🔥</Text>
                                <Text style={styles.sectionTitle}>Dikkat Gerektiren Öğrenciler</Text>
                            </View>
                            {atRiskStudents.length > 0 ? (
                                renderStudentTable(atRiskStudents.slice(0, 5))
                            ) : (
                                <View style={styles.successRow}>
                                    <Text style={styles.successIcon}>✅</Text>
                                    <Text style={styles.successText}>Tüm öğrenciler yolunda!</Text>
                                </View>
                            )}
                        </View>

                        {/* AI Recommendations */}
                        <View style={[styles.section, styles.aiSection]}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionIcon}>💡</Text>
                                <Text style={styles.sectionTitle}>AI Önerileri</Text>
                            </View>

                            {criticalCount > 0 && (
                                <View style={styles.recommendation}>
                                    <Text style={styles.recIcon}>📞</Text>
                                    <Text style={styles.recText}>
                                        {criticalCount} kritik öğrenci var. Bugün mesaj göndermeyi düşünün.
                                    </Text>
                                </View>
                            )}

                            {totalOverdueTasks > 0 && (
                                <View style={styles.recommendation}>
                                    <Text style={styles.recIcon}>📋</Text>
                                    <Text style={styles.recText}>
                                        {totalOverdueTasks} geciken görev mevcut. Hatırlatma gönderin.
                                    </Text>
                                </View>
                            )}

                            {avgCompletionRate < 50 && (
                                <View style={styles.recommendation}>
                                    <Text style={styles.recIcon}>📉</Text>
                                    <Text style={styles.recText}>
                                        Ortalama tamamlanma oranı düşük. Görev zorluklarını gözden geçirin.
                                    </Text>
                                </View>
                            )}

                            {criticalCount === 0 && totalOverdueTasks === 0 && avgCompletionRate >= 50 && (
                                <View style={styles.recommendation}>
                                    <Text style={styles.recIcon}>🎉</Text>
                                    <Text style={styles.recText}>
                                        Harika gidiyorsunuz! Öğrencileriniz düzenli çalışıyor.
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Summary Stats */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>📈 Haftalık Özet</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Ortalama Tamamlanma:</Text>
                                <Text style={[styles.summaryValue, {
                                    color: avgCompletionRate >= 70 ? '#10b981' :
                                        avgCompletionRate >= 40 ? '#fbbf24' : '#ef4444'
                                }]}>%{avgCompletionRate}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Geciken Görevler:</Text>
                                <Text style={[styles.summaryValue, {
                                    color: totalOverdueTasks === 0 ? '#10b981' : '#ef4444'
                                }]}>{totalOverdueTasks}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Aktiflik Değişimi:</Text>
                                <Text style={[styles.summaryValue, {
                                    color: isPositive ? '#10b981' : '#ef4444'
                                }]}>{isPositive ? '+' : ''}{weeklyActivityChange}%</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Button */}
                    <TouchableOpacity style={styles.footerButton} onPress={onClose}>
                        <Text style={styles.footerButtonText}>Tamam</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.85,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f3f4f6',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#9ca3af',
        fontSize: 18,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 10,
    },
    healthCard: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
    },
    healthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    healthLabel: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    healthBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    healthBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    healthScoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    healthScore: {
        fontSize: 48,
        fontWeight: '800',
    },
    healthMax: {
        fontSize: 20,
        color: '#6b7280',
        marginLeft: 4,
    },
    healthBar: {
        height: 8,
        backgroundColor: '#374151',
        borderRadius: 4,
        overflow: 'hidden',
    },
    healthFill: {
        height: '100%',
        borderRadius: 4,
    },
    quickStats: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    quickStat: {
        flex: 1,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    quickIcon: {
        fontSize: 18,
        marginBottom: 6,
    },
    quickValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f3f4f6',
    },
    quickLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 4,
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#1f2937',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },
    aiSection: {
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f3f4f6',
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fbbf24',
    },
    studentName: {
        flex: 1,
        fontSize: 14,
        color: '#e5e7eb',
        fontWeight: '500',
    },
    studentRate: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    riskRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    riskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginTop: 6,
        marginRight: 12,
    },
    riskContent: {
        flex: 1,
    },
    riskName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    riskReason: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    successIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    successText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
    },
    recommendation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    recIcon: {
        fontSize: 16,
        marginRight: 12,
        marginTop: 2,
    },
    recText: {
        flex: 1,
        fontSize: 13,
        color: '#d1d5db',
        lineHeight: 20,
    },
    summaryCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.15)',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#a78bfa',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#9ca3af',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyText: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    tableContainer: {
        marginTop: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 8,
    },
    columnHeader: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    },
    tableValue: {
        flex: 1,
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
        fontWeight: '600',
    },
    footerButton: {
        backgroundColor: '#8b5cf6',
        marginHorizontal: 20,
        marginBottom: 30,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
