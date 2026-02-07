/**
 * Premium Login Screen - Elite Coach Control Center
 * Modern dark theme with glassmorphism and premium styling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

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
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0a0f1a" />

            {/* Background Gradient Orbs */}
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />
            <View style={styles.bgOrb3} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Animated.View style={[
                    styles.mainCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                        <Text style={styles.backText}>Geri</Text>
                    </TouchableOpacity>

                    {/* Logo Section */}
                    <Animated.View style={[styles.logoSection, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>{isCoach ? '🎓' : '📚'}</Text>
                        </View>
                        <Text style={styles.appName}>Elite Coach</Text>
                        <Text style={styles.subtitle}>
                            {isCoach ? 'Koç Kontrol Merkezi' : 'Öğrenci Paneli'}
                        </Text>
                    </Animated.View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={[
                            styles.inputContainer,
                            focusedField === 'email' && styles.inputFocused
                        ]}>
                            <Text style={styles.inputIcon}>📧</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta adresiniz"
                                placeholderTextColor="#6b7280"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={[
                            styles.inputContainer,
                            focusedField === 'password' && styles.inputFocused
                        ]}>
                            <Text style={styles.inputIcon}>🔐</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Şifreniz"
                                placeholderTextColor="#6b7280"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                            </Text>
                            {!loading && <Text style={styles.loginButtonArrow}>→</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Demo Info */}
                    <View style={styles.demoSection}>
                        <View style={styles.demoHeader}>
                            <View style={styles.demoDot} />
                            <Text style={styles.demoLabel}>Demo Hesabı</Text>
                        </View>
                        <Text style={styles.demoText}>
                            {isCoach ? 'halilay45@gmail.com' : 'ogrenci@example.com'}
                        </Text>
                        <Text style={styles.demoText}>
                            Şifre: {isCoach ? '123456' : 'sifre'}
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Powered by</Text>
                        <Text style={styles.footerBrand}>Elite Coach AI</Text>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1a',
    },
    bgOrb1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        top: -100,
        left: -100,
    },
    bgOrb2: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        bottom: 100,
        right: -80,
    },
    bgOrb3: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        bottom: -50,
        left: 50,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    mainCard: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backIcon: {
        color: '#60a5fa',
        fontSize: 20,
        marginRight: 6,
    },
    backText: {
        color: '#60a5fa',
        fontSize: 14,
        fontWeight: '500',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    logoIcon: {
        fontSize: 36,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#f3f4f6',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    form: {
        gap: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputFocused: {
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#e5e7eb',
        fontSize: 15,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 6,
    },
    loginButtonDisabled: {
        backgroundColor: '#6b7280',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginButtonArrow: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 8,
    },
    demoSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
    },
    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    demoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    demoLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    demoText: {
        color: '#9ca3af',
        fontSize: 13,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 4,
    },
    footerText: {
        fontSize: 11,
        color: '#4b5563',
    },
    footerBrand: {
        fontSize: 11,
        color: '#8b5cf6',
        fontWeight: '600',
    },
});
