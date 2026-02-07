/**
 * Premium Login Screen - CoreHub Style
 * Modern dark theme with aura effects, role selection, and gradient styling
 * Matching the giris.html design
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
    const auraAnim = useRef(new Animated.Value(1)).current;
    const formSlideAnim = useRef(new Animated.Value(0)).current;

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

        // Aura pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(auraAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(auraAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Role change animation
    const handleRoleChange = (newRole: 'student' | 'coach') => {
        if (role === newRole) return;

        // Animate form
        Animated.sequence([
            Animated.timing(formSlideAnim, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(formSlideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        setRole(newRole);
        // Update credentials based on role
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

    // Dynamic colors based on role
    const colors = isCoach
        ? {
            primary: '#d946ef',
            secondary: '#ec4899',
            glow: 'rgba(147, 51, 234, 0.3)',
            gradient: ['#9333ea', '#d946ef', '#ec4899'],
        }
        : {
            primary: '#22d3ee',
            secondary: '#3b82f6',
            glow: 'rgba(30, 58, 138, 0.3)',
            gradient: ['#3b82f6', '#22d3ee', '#6366f1'],
        };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#010103" />

            {/* Aura Background */}
            <Animated.View
                style={[
                    styles.auraBg,
                    {
                        backgroundColor: colors.glow,
                        transform: [{ scale: auraAnim }]
                    }
                ]}
            />

            {/* Grid Background */}
            <View style={styles.gridBg} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Header */}
                <Animated.View style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={styles.logoWrapper}>
                        <View style={[styles.logoGlow, { backgroundColor: colors.primary }]} />
                        <View style={styles.logoContainer}>
                            <Text style={[styles.logoIcon, { color: colors.primary }]}>◉</Text>
                        </View>
                    </View>
                    <Text style={styles.appTitle}>
                        CORE<Text style={[styles.appTitleAccent, { color: colors.primary }]}>HUB</Text>
                    </Text>
                </Animated.View>

                {/* Role Selector */}
                <Animated.View style={[
                    styles.roleSelector,
                    { opacity: fadeAnim }
                ]}>
                    {/* Student Button */}
                    <TouchableOpacity
                        style={[
                            styles.roleBtn,
                            role === 'student' && styles.roleBtnActive,
                            role !== 'student' && styles.roleBtnInactive,
                        ]}
                        onPress={() => handleRoleChange('student')}
                        activeOpacity={0.8}
                    >
                        {role === 'student' && (
                            <View style={styles.roleBtnGradient}>
                                <View style={[styles.gradientInner, { backgroundColor: '#3b82f6' }]} />
                            </View>
                        )}
                        <View style={styles.roleBtnContent}>
                            <Text style={[
                                styles.roleIcon,
                                { color: role === 'student' ? '#000' : '#22d3ee' }
                            ]}>🎓</Text>
                            <Text style={[
                                styles.roleLabel,
                                { color: role === 'student' ? '#000' : '#fff' }
                            ]}>ÖĞRENCİ</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Coach Button */}
                    <TouchableOpacity
                        style={[
                            styles.roleBtn,
                            role === 'coach' && styles.roleBtnActive,
                            role !== 'coach' && styles.roleBtnInactive,
                        ]}
                        onPress={() => handleRoleChange('coach')}
                        activeOpacity={0.8}
                    >
                        {role === 'coach' && (
                            <View style={styles.roleBtnGradient}>
                                <View style={[styles.gradientInner, { backgroundColor: '#9333ea' }]} />
                            </View>
                        )}
                        <View style={styles.roleBtnContent}>
                            <Text style={[
                                styles.roleIcon,
                                { color: role === 'coach' ? '#000' : '#d946ef' }
                            ]}>👥</Text>
                            <Text style={[
                                styles.roleLabel,
                                { color: role === 'coach' ? '#000' : '#fff' }
                            ]}>KOÇ</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Login Form Card */}
                <Animated.View style={[
                    styles.formCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { translateX: formSlideAnim }
                        ]
                    }
                ]}>
                    {/* Top Gradient Border */}
                    <View style={[styles.topBorder, { backgroundColor: colors.primary }]} />

                    {/* Form Content */}
                    <View style={styles.formContent}>
                        {/* Title */}
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>
                                {isCoach ? 'Koç' : 'Giriş'}{' '}
                                <Text style={[styles.formTitleAccent, { color: colors.primary }]}>PANELİ</Text>
                            </Text>
                            <Text style={styles.formSubtitle}>// AUTH_READY</Text>
                        </View>

                        {/* Inputs */}
                        <View style={styles.inputsContainer}>
                            {/* Email */}
                            <View style={[
                                styles.inputWrapper,
                                focusedField === 'email' && styles.inputFocused
                            ]}>
                                <View style={[
                                    styles.inputIconContainer,
                                    focusedField === 'email' && styles.inputIconFocused
                                ]}>
                                    <Text style={[styles.inputIcon, { color: colors.primary }]}>👤</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder={isCoach ? 'Koç ID veya e-posta' : 'Kullanıcı adı veya e-posta'}
                                    placeholderTextColor="#6b7280"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            {/* Password */}
                            <View style={[
                                styles.inputWrapper,
                                focusedField === 'password' && styles.inputFocused
                            ]}>
                                <View style={[
                                    styles.inputIconContainer,
                                    focusedField === 'password' && styles.inputIconFocused
                                ]}>
                                    <Text style={[styles.inputIcon, { color: colors.primary }]}>🔒</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifre"
                                    placeholderTextColor="#6b7280"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.loginBtnGradient, { backgroundColor: colors.primary }]} />
                            <View style={styles.loginBtnInner}>
                                <Text style={styles.loginBtnText}>
                                    {loading ? 'GİRİŞ YAPILIYOR...' : 'OTURUM AÇ'}
                                </Text>
                                {!loading && (
                                    <Text style={[styles.loginBtnArrow, { color: colors.primary }]}>→</Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Footer Links */}
                        <View style={styles.footerLinks}>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>DESTEK</Text>
                            </TouchableOpacity>
                            <View style={styles.registerContainer}>
                                <Text style={[styles.sparkle, { color: colors.primary }]}>✦</Text>
                                <TouchableOpacity>
                                    <Text style={styles.registerLink}>KAYIT OL</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Bottom Actions */}
                <Animated.View style={[
                    styles.bottomActions,
                    { opacity: fadeAnim }
                ]}>
                    <TouchableOpacity style={styles.bottomBtn}>
                        <Text style={styles.bottomBtnIcon}>🔐</Text>
                        <Text style={styles.bottomBtnLabel}>BIOMETRIC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomBtn}>
                        <Text style={styles.bottomBtnIcon}>✉️</Text>
                        <Text style={styles.bottomBtnLabel}>İLETİŞİM</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={[styles.footerIcon, { color: colors.primary }]}>⚡</Text>
                    <Text style={styles.footerText}>FAST_CORE_v2.1</Text>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#010103',
    },
    auraBg: {
        position: 'absolute',
        top: '-25%',
        left: '-25%',
        width: width * 1.5,
        height: height * 0.8,
        borderRadius: 9999,
        opacity: 0.6,
    },
    gridBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    logoGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 24,
        opacity: 0.3,
    },
    logoContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoIcon: {
        fontSize: 28,
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 6,
        fontStyle: 'italic',
    },
    appTitleAccent: {
        fontWeight: '900',
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        padding: 2,
    },
    roleBtnActive: {
        transform: [{ scale: 1.02 }],
    },
    roleBtnInactive: {
        opacity: 0.4,
    },
    roleBtnGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
        overflow: 'hidden',
    },
    gradientInner: {
        flex: 1,
    },
    roleBtnContent: {
        backgroundColor: '#0a0a0f',
        borderRadius: 22,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 8,
    },
    roleIcon: {
        fontSize: 24,
    },
    roleLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    topBorder: {
        height: 4,
        width: '100%',
    },
    formContent: {
        padding: 32,
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: 28,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        fontStyle: 'italic',
        letterSpacing: -1,
    },
    formTitleAccent: {
        fontWeight: '900',
    },
    formSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#4b5563',
        letterSpacing: 4,
        marginTop: 4,
        opacity: 0.5,
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    inputIconContainer: {
        opacity: 0.3,
        marginRight: 12,
    },
    inputIconFocused: {
        opacity: 1,
    },
    inputIcon: {
        fontSize: 18,
    },
    input: {
        flex: 1,
        height: 54,
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 18,
        opacity: 0.5,
    },
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 2,
        marginBottom: 24,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginBtnGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    loginBtnInner: {
        backgroundColor: '#050508',
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 3,
    },
    loginBtnArrow: {
        fontSize: 18,
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLink: {
        fontSize: 9,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 2,
    },
    registerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sparkle: {
        fontSize: 12,
    },
    registerLink: {
        fontSize: 9,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 24,
    },
    bottomBtn: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: 16,
        alignItems: 'center',
        gap: 8,
    },
    bottomBtnIcon: {
        fontSize: 24,
        opacity: 0.5,
    },
    bottomBtnLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#6b7280',
        letterSpacing: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 24,
        gap: 8,
        opacity: 0.3,
    },
    footerIcon: {
        fontSize: 12,
    },
    footerText: {
        fontSize: 7,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
    },
});
