import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';

interface ActionCardProps {
    title: string;
    icon: React.ReactNode;
    colors: [string, string, ...string[]];
    onPress: () => void;
    style?: ViewStyle;
}

export const ActionCard: React.FC<ActionCardProps> = ({
    title,
    icon,
    colors,
    onPress,
    style,
}) => {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.overlay}>
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.15)', // Light dark overlay for contrast
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    iconContainer: {
        marginBottom: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 15, // Clear font size
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
