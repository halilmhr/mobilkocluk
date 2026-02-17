/**
 * Premium Login Screen - Education App Style
 * Clean, modern, and professional with subtle premium touches
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const insets = useSafeAreaInsets();
    const { role: initialRole } = route.params;
    const { login } = useApp();

    const [role, setRole] = useState<'student' | 'coach'>(initialRole);
    const isCoach = role === 'coach';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    // Load saved credentials for current role
    const loadCredentialsForRole = async (targetRole: 'student' | 'coach') => {
        try {
            const saved = await AsyncStorage.getItem(`rememberedCredentials_${targetRole}`);
            if (saved) {
                const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
                setEmail(savedEmail);
                setPassword(savedPassword);
                setRememberMe(true);
            } else {
                setEmail('');
                setPassword('');
                setRememberMe(false);
            }
        } catch (_) {
            setEmail('');
            setPassword('');
            setRememberMe(false);
        }
    };

    // Load on mount
    useEffect(() => {
        loadCredentialsForRole(role);
    }, []);

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
        loadCredentialsForRole(newRole);
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
                // Save or clear credentials based on Remember Me (role-specific)
                if (rememberMe) {
                    await AsyncStorage.setItem(`rememberedCredentials_${role}`, JSON.stringify({ email, password }));
                } else {
                    await AsyncStorage.removeItem(`rememberedCredentials_${role}`);
                }
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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Background Gradient */}
            <View style={[styles.bgGradient, { backgroundColor: isCoach ? 'rgba(168, 85, 247, 0.08)' : 'rgba(59, 130, 246, 0.08)' }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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

                        {/* Remember Me */}
                        <TouchableOpacity
                            style={styles.rememberMeRow}
                            onPress={() => setRememberMe(!rememberMe)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, rememberMe && [styles.checkboxActive, { backgroundColor: accentColor, borderColor: accentColor }]]}>
                                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.rememberMeText}>Beni Hatırla</Text>
                        </TouchableOpacity>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2024 Koçluk Platformu</Text>
                    </View>
                </ScrollView>
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
        flexGrow: 1,
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
    rememberMeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 11,
        color: '#334155',
    },
});
