import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
} from 'react-native';
import { usePremium } from '../context/PremiumContext';

export const UpgradeModal: React.FC = () => {
    const { isUpgradeModalVisible, hideUpgradeModal, setIsPremium } = usePremium();

    const features = [
        { icon: '🤖', title: 'AI Haftalık Analiz', desc: 'Her öğrenci için kişiselleştirilmiş içgörüler' },
        { icon: '⚠️', title: 'Otomatik Risk Algılama', desc: 'Geride kalan öğrencileri anında tespit' },
        { icon: '📈', title: 'İlerleme Tahmini', desc: 'Başarı olasılığını önceden görün' },
        { icon: '📄', title: 'PDF Haftalık Raporlar', desc: 'Velilerle paylaşılabilir profesyonel raporlar' },
        { icon: '📱', title: 'Toplu Mesajlaşma', desc: 'Tüm öğrencilere tek tıkla ulaşın' },
        { icon: '🎯', title: 'Öncelik Önerileri', desc: 'Hangi öğrenciye odaklanmanız gerektiğini bilin' },
    ];

    const handleUpgrade = () => {
        // In production, this would trigger payment flow
        setIsPremium(true);
        hideUpgradeModal();
    };

    return (
        <Modal
            visible={isUpgradeModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={hideUpgradeModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeBtn} onPress={hideUpgradeModal}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>⭐ PREMIUM</Text>
                        </View>
                        <Text style={styles.headerTitle}>Koçluğunuzu Güçlendirin</Text>
                        <Text style={styles.headerSubtitle}>
                            Haftada 3-5 saat tasarruf edin, hiçbir öğrenciyi kaçırmayın
                        </Text>
                    </View>

                    {/* Features */}
                    <ScrollView style={styles.featuresList}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                                </View>
                                <Text style={styles.featureCheck}>✓</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pricing */}
                    <View style={styles.pricingSection}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceAmount}>₺249</Text>
                            <Text style={styles.pricePeriod}>/ay</Text>
                        </View>
                        <Text style={styles.priceNote}>İstediğiniz zaman iptal edin</Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
                        <Text style={styles.upgradeBtnText}>Premium'a Yükselt</Text>
                    </TouchableOpacity>

                    <Text style={styles.guarantee}>7 gün içinde memnun kalmazsanız iade garantisi</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0F172A',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#94A3B8',
        fontSize: 16,
    },
    headerBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    headerBadgeText: {
        color: '#A855F7',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    featuresList: {
        paddingHorizontal: 20,
        paddingTop: 16,
        maxHeight: 280,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    featureDesc: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
    },
    featureCheck: {
        color: '#10b981',
        fontSize: 18,
        fontWeight: '700',
    },
    pricingSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        marginHorizontal: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceAmount: {
        color: '#fff',
        fontSize: 42,
        fontWeight: '900',
    },
    pricePeriod: {
        color: '#94A3B8',
        fontSize: 18,
        marginLeft: 4,
    },
    priceNote: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 4,
    },
    upgradeBtn: {
        backgroundColor: '#A855F7',
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    guarantee: {
        color: '#6b7280',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 12,
    },
});
