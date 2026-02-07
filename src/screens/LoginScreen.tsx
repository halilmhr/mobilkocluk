/**
 * Premium Login Screen - Education App Style
 * Clean, modern, and professional with subtle premium touches
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
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
    route: RouteProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
    const { role: initialRole } = route.params;
    const { login } = useApp();

    const [role, setRole] = useState<'student' | 'coach'>(initialRole);
    const isCoach = role === 'coach';

    const [email, setEmail] = useState(isCoach ? 'halilay45@gmail.com' : '');
    const [password, setPassword] = useState(isCoach ? '123456' : '');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRoleChange = (newRole: 'student' | 'coach') => {
        if (role === newRole) return;
        setRole(newRole);
        if (newRole === 'coach') {
            setEmail('halilay45@gmail.com');
            setPassword('123456');
        } else {
            setEmail('');
            setPassword('');
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
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
                Alert.alert('Hata', 'E-posta veya şifre hatalı.');
            }
        } catch (error) {
            Alert.alert('Hata', 'Giriş yapılırken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic colors based on role
    const accentColor = isCoach ? '#a855f7' : '#3b82f6';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Background Gradient */}
            <View style={[styles.bgGradient, { backgroundColor: isCoach ? 'rgba(168, 85, 247, 0.08)' : 'rgba(59, 130, 246, 0.08)' }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Logo & Brand */}
                <Animated.View style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={[styles.logoContainer, { borderColor: accentColor }]}>
                        <Text style={styles.logoEmoji}>📚</Text>
                    </View>
                    <Text style={styles.brandName}>Koçluk Platformu</Text>
                    <Text style={styles.brandTagline}>Başarıya giden yolda yanınızdayız</Text>
                </Animated.View>

                {/* Role Selector */}
                <Animated.View style={[
                    styles.roleSelector,
                    { opacity: fadeAnim }
                ]}>
                    <TouchableOpacity
                        style={[
                            styles.roleBtn,
                            role === 'student' && [styles.roleBtnActive, { borderColor: '#3b82f6' }]
                        ]}
                        onPress={() => handleRoleChange('student')}
                    >
                        <Text style={styles.roleBtnIcon}>🎓</Text>
                        <Text style={[
                            styles.roleBtnText,
                            role === 'student' && { color: '#3b82f6', fontWeight: '700' }
                        ]}>Öğrenci</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roleBtn,
                            role === 'coach' && [styles.roleBtnActive, { borderColor: '#a855f7' }]
                        ]}
                        onPress={() => handleRoleChange('coach')}
                    >
                        <Text style={styles.roleBtnIcon}>👨‍🏫</Text>
                        <Text style={[
                            styles.roleBtnText,
                            role === 'coach' && { color: '#a855f7', fontWeight: '700' }
                        ]}>Koç</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Login Card */}
                <Animated.View style={[
                    styles.loginCard,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Text style={styles.loginTitle}>
                        {isCoach ? 'Koç Girişi' : 'Öğrenci Girişi'}
                    </Text>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>E-posta</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'email' && [styles.inputFocused, { borderColor: accentColor }]
                        ]}>
                            <Text style={styles.inputIcon}>📧</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@email.com"
                                placeholderTextColor="#64748b"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Şifre</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'password' && [styles.inputFocused, { borderColor: accentColor }]
                        ]}>
                            <Text style={styles.inputIcon}>🔒</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginBtn,
                            { backgroundColor: accentColor },
                            loading && styles.loginBtnLoading
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.loginBtnText}>
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </Text>
                        {!loading && <Text style={styles.loginBtnArrow}>→</Text>}
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Demo Info */}
                <Animated.View style={[styles.demoSection, { opacity: fadeAnim }]}>
                    <View style={styles.demoHeader}>
                        <View style={[styles.demoDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.demoLabel}>Demo Hesap</Text>
                    </View>
                    <Text style={styles.demoText}>
                        {isCoach ? 'halilay45@gmail.com / 123456' : 'Koç seçerek demo hesabı kullanın'}
                    </Text>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Koçluk Platformu</Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    bgGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.5,
        borderBottomLeftRadius: 100,
        borderBottomRightRadius: 100,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#1e293b',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 36,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f1f5f9',
        marginBottom: 4,
    },
    brandTagline: {
        fontSize: 14,
        color: '#64748b',
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1e293b',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roleBtnActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    roleBtnIcon: {
        fontSize: 20,
    },
    roleBtnText: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
    },
    loginCard: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#334155',
        paddingHorizontal: 14,
    },
    inputFocused: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#f1f5f9',
        fontSize: 15,
    },
    eyeBtn: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 16,
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    loginBtnLoading: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loginBtnArrow: {
        color: '#fff',
        fontSize: 18,
    },
    forgotBtn: {
        alignItems: 'center',
        marginTop: 16,
    },
    forgotText: {
        color: '#64748b',
        fontSize: 13,
    },
    demoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    demoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    demoLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    demoText: {
        fontSize: 12,
        color: '#475569',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#334155',
    },
});
