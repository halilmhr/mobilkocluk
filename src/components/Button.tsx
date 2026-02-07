/**
 * Button component - Reusable styled button
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    title?: string;
    children?: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    children,
    onPress,
    variant = 'primary',
    disabled = false,
    style,
    textStyle,
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondary;
            case 'outline':
                return styles.outline;
            default:
                return styles.primary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineText;
            default:
                return styles.text;
        }
    };

    // Support both title prop and children
    const content = title || children;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            {typeof content === 'string' ? (
                <Text style={[getTextStyle(), disabled && styles.disabledText, textStyle]}>
                    {content}
                </Text>
            ) : (
                content
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: '#A855F7',
    },
    secondary: {
        backgroundColor: '#1e293b',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#A855F7',
    },
    text: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineText: {
        color: '#A855F7',
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        color: '#94a3b8',
    },
});
