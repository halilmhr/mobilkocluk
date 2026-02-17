import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({ label, style, inputStyle, ...props }) => (
    <View style={[styles.container, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
            style={[styles.input, inputStyle]}
            placeholderTextColor="#9ca3af"
            {...props}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#f3f4f6',
        fontSize: 16,
    },
});
