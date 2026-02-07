import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface BentoGridProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

interface BentoItemProps {
    children: React.ReactNode;
    span?: number;
    height?: number;
    style?: ViewStyle;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, style }) => {
    return <View style={[styles.grid, style]}>{children}</View>;
};

export const BentoItem: React.FC<BentoItemProps> = ({ children, span = 1, height = 150, style }) => {
    const flexBasis = span === 2 ? '100%' : '48%';
    return (
        <View style={[styles.item, { flexBasis, height }, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    item: {
        marginBottom: 12,
    },
});
