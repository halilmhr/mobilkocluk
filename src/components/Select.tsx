import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface SelectProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, value, onValueChange, children }) => (
    <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={value}
                onValueChange={onValueChange}
                style={styles.picker}
                dropdownIconColor="#9ca3af"
            >
                {children}
            </Picker>
        </View>
    </View>
);

export const SelectItem = Picker.Item;

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
    pickerContainer: {
        backgroundColor: '#374151',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4b5563',
        overflow: 'hidden',
    },
    picker: {
        color: '#e5e7eb',
        height: 50,
    },
});
