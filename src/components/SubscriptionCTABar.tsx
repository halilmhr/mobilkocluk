import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePremium } from '../context/PremiumContext';

export const SubscriptionCTABar: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { isPremium, showUpgradeModal } = usePremium();

    if (isPremium) {
        return null;
    }

    return (
        <View style={[styles.container, { bottom: 70 + insets.bottom }]}>
            <View style={styles.content}>
                <View style={styles.textSection}>
                    <Text style={styles.headline}>⚡ Premium</Text>
                    <Text style={styles.subtext}>Haftada 3-5 saat tasarruf</Text>
                </View>
                <TouchableOpacity style={styles.upgradeBtn} onPress={showUpgradeModal}>
                    <Text style={styles.upgradeBtnText}>Yükselt</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 70,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    textSection: {
        flex: 1,
    },
    headline: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    subtext: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
    },
    upgradeBtn: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
