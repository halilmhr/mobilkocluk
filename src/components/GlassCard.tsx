import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 40,
    tint = 'dark',
    borderRadius = 24,
    borderWidth = 1,
    borderColor = 'rgba(255, 255, 255, 0.1)',
}) => {
    // Extract padding from style if present
    const {
        padding,
        paddingHorizontal,
        paddingVertical,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        ...containerStyle
    } = StyleSheet.flatten(style || {});

    const paddingStyles = {
        padding,
        paddingHorizontal,
        paddingVertical,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
    };

    return (
        <View style={[styles.container, { borderRadius }, containerStyle]}>
            <BlurView
                intensity={intensity}
                tint={tint}
                style={[
                    styles.blur,
                    {
                        borderRadius,
                        borderWidth,
                        borderColor,
                    },
                    paddingStyles,
                ]}
            >
                {children}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'android' ? 'rgba(26, 29, 35, 0.8)' : 'transparent',
    },
    blur: {
        padding: 16,
        overflow: 'hidden',
    },
});
