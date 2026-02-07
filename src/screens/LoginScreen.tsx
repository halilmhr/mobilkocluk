import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useApp } from '../context/AppContext';

type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
    route: RouteProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
    const { role } = route.params;
    const { login } = useApp();

    const isCoach = role === 'coach';
    const [email, setEmail] = useState(isCoach ? 'halilay45@gmail.com' : '');
    const [password, setPassword] = useState(isCoach ? '123456' : '');
    const [loading, setLoading] = useState(false);

    const title = isCoach ? '🎓 Koç Girişi' : '📚 Öğrenci Girişi';

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            const user = await login(email, password);
            if (user && user.role === role) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: role === 'coach' ? 'CoachDashboard' : 'StudentDashboard' }],
                });
            } else {
                Alert.alert('Hata', 'Geçersiz e-posta veya şifre.');
            }
        } catch (error) {
            Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Card style={styles.card}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>

                <Text style={styles.title}>{title}</Text>

                <View style={styles.form}>
                    <Input
                        label="E-posta"
                        placeholder="E-posta adresinizi girin"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Şifre"
                        placeholder="Şifrenizi girin"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        onPress={handleLogin}
                        disabled={loading}
                        style={styles.loginButton}
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </Button>
                </View>

                <View style={styles.demoInfo}>
                    <Text style={styles.demoLabel}>Demo Bilgileri:</Text>
                    <Text style={styles.demoText}>
                        {isCoach ? 'halilay45@gmail.com' : 'ogrenci@example.com'}
                    </Text>
                    <Text style={styles.demoText}>Şifre: {isCoach ? '123456' : 'sifre'}</Text>
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
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        color: '#60a5fa',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#60a5fa',
        marginBottom: 24,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    loginButton: {
        marginTop: 8,
        width: '100%',
    },
    demoInfo: {
        marginTop: 24,
        padding: 12,
        backgroundColor: '#374151',
        borderRadius: 8,
        alignItems: 'center',
    },
    demoLabel: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 4,
    },
    demoText: {
        color: '#d1d5db',
        fontSize: 14,
    },
});
