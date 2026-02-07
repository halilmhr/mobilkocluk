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
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#374151',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4b5563',
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#e5e7eb',
        fontSize: 16,
    },
});
