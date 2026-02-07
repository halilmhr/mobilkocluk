import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <Card style={styles.card}>
                <Text style={styles.title}>Platforma Hoş Geldiniz</Text>
                <Text style={styles.subtitle}>Lütfen giriş türünü seçin:</Text>

                <View style={styles.buttonContainer}>
                    <Button
                        onPress={() => navigation.navigate('Login', { role: 'coach' })}
                        style={styles.button}
                    >
                        🎓 Koç Girişi
                    </Button>

                    <Button
                        onPress={() => navigation.navigate('Login', { role: 'student' })}
                        variant="secondary"
                        style={styles.button}
                    >
                        📚 Öğrenci Girişi
                    </Button>
                </View>
            </Card>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#60a5fa',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 32,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
    },
});
