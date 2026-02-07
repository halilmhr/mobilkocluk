import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePremium } from '../context/PremiumContext';

export const FeatureComparisonCard: React.FC = () => {
    const { isPremium, showUpgradeModal } = usePremium();

    const freeFeatures = [
        { icon: '✓', title: 'Öğrenci listesi' },
        { icon: '✓', title: 'Manuel takip' },
        { icon: '✓', title: 'Temel istatistikler' },
    ];

    const premiumFeatures = [
        { icon: '🤖', title: 'AI haftalık içgörüler', locked: true },
        { icon: '⚠️', title: 'Otomatik risk algılama', locked: true },
        { icon: '📈', title: 'İlerleme tahmini', locked: true },
        { icon: '📄', title: 'PDF haftalık raporlar', locked: true },
        { icon: '📱', title: 'Toplu mesajlaşma', locked: true },
    ];

    if (isPremium) {
        return null; // Don't show comparison if already premium
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🚀 Özellik Karşılaştırması</Text>

            <View style={styles.columnsContainer}>
                {/* Free Column */}
                <View style={styles.column}>
                    <View style={styles.columnHeader}>
                        <Text style={styles.columnTitle}>Ücretsiz</Text>
                    </View>
                    <View style={styles.featuresList}>
                        {freeFeatures.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Text style={styles.freeCheck}>{feature.icon}</Text>
                                <Text style={styles.featureText}>{feature.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Premium Column */}
                <View style={[styles.column, styles.premiumColumn]}>
                    <View style={[styles.columnHeader, styles.premiumHeader]}>
                        <Text style={styles.premiumBadge}>⭐</Text>
                        <Text style={styles.premiumTitle}>Premium</Text>
                    </View>
                    <View style={styles.featuresList}>
                        {premiumFeatures.map((feature, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.featureItem}
                                onPress={showUpgradeModal}
                            >
                                <Text style={styles.premiumIcon}>{feature.icon}</Text>
                                <Text style={styles.premiumFeatureText}>{feature.title}</Text>
                                <Text style={styles.lockIcon}>🔒</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.unlockBtn} onPress={showUpgradeModal}>
                <Text style={styles.unlockBtnText}>Tüm Özellikleri Aç</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    columnsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    column: {
        flex: 1,
    },
    columnHeader: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    columnTitle: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    premiumColumn: {
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderRadius: 14,
        padding: 8,
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
    },
    premiumHeader: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    premiumBadge: {
        fontSize: 14,
        marginRight: 6,
    },
    premiumTitle: {
        color: '#A855F7',
        fontSize: 13,
        fontWeight: '700',
    },
    featuresList: {
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    freeCheck: {
        color: '#10b981',
        fontSize: 14,
        marginRight: 8,
        width: 20,
    },
    featureText: {
        color: '#94A3B8',
        fontSize: 12,
        flex: 1,
    },
    premiumIcon: {
        fontSize: 14,
        marginRight: 8,
        width: 20,
    },
    premiumFeatureText: {
        color: '#fff',
        fontSize: 12,
        flex: 1,
        opacity: 0.7,
    },
    lockIcon: {
        fontSize: 12,
        opacity: 0.6,
    },
    unlockBtn: {
        backgroundColor: '#A855F7',
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    unlockBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
