/**
 * Live Indicator - Real-time status dot
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PREMIUM_COLORS, PREMIUM_SPACING } from '../styles/premiumStyles';

interface LiveIndicatorProps {
    lastUpdate?: Date;
    isLive?: boolean;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
    lastUpdate,
    isLive = true,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isLive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.4,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isLive]);

    const formatTime = (date?: Date) => {
        if (!date) return 'Şimdi';
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

        if (diff < 1) return 'Şimdi';
        if (diff === 1) return '1 dk önce';
        if (diff < 60) return `${diff} dk önce`;

        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Text style={styles.text}>
                Son analiz: {formatTime(lastUpdate)} • {isLive ? 'Canlı' : 'Pasif'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    text: {
        fontSize: 11,
        color: PREMIUM_COLORS.textMuted,
        fontWeight: '500',
    },
});
