import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePremium } from '../context/PremiumContext';

interface PremiumLockOverlayProps {
    children: React.ReactNode;
    message?: string;
    showButton?: boolean;
}

export const PremiumLockOverlay: React.FC<PremiumLockOverlayProps> = ({
    children,
    message = 'Premium özellik',
    showButton = true,
}) => {
    const { isPremium, showUpgradeModal } = usePremium();

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={showUpgradeModal}
            activeOpacity={0.9}
        >
            <View style={styles.blurredContent}>
                {children}
            </View>
            <View style={styles.overlay}>
                <View style={styles.lockBadge}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockText}>{message}</Text>
                </View>
                {showButton && (
                    <TouchableOpacity style={styles.unlockButton} onPress={showUpgradeModal}>
                        <Text style={styles.unlockButtonText}>Premium'a Geç</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    blurredContent: {
        opacity: 0.3,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
    },
    lockIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    lockText: {
        color: '#A855F7',
        fontSize: 13,
        fontWeight: '700',
    },
    unlockButton: {
        marginTop: 12,
        backgroundColor: '#A855F7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    unlockButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
