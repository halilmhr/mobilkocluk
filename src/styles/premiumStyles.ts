/**
 * Premium Styles - Elite Coach Control Center
 * 
 * Dark mode varsayılan, Linear/Stripe/Vercel hissi
 * Sadece 2 ana vurgu rengi: mor (accent) + kırmızı (danger)
 */

export const PREMIUM_COLORS = {
    // Base - Deep dark tones
    background: '#0a0f1a',
    backgroundAlt: '#0f172a',
    surface: '#1a2332',
    surfaceLight: '#242e3f',
    surfaceHover: '#2d3a4f',

    // Primary Accent - Purple
    accent: '#A855F7',
    accentLight: '#C084FC',
    accentGlow: 'rgba(168, 85, 247, 0.25)',
    accentSoft: 'rgba(168, 85, 247, 0.12)',

    // Critical/Danger - Red (Primary warning color)
    danger: '#ef4444',
    dangerLight: '#f87171',
    dangerGlow: 'rgba(239, 68, 68, 0.3)',
    dangerSoft: 'rgba(239, 68, 68, 0.12)',
    dangerDeep: 'rgba(239, 68, 68, 0.08)',

    // Secondary states (minimal use)
    warning: '#f59e0b',
    warningGlow: 'rgba(245, 158, 11, 0.2)',
    warningSoft: 'rgba(245, 158, 11, 0.1)',

    success: '#10b981',
    successGlow: 'rgba(16, 185, 129, 0.2)',
    successSoft: 'rgba(16, 185, 129, 0.1)',

    // Text - High contrast
    text: '#ffffff',
    textSecondary: '#a1adc4',
    textMuted: '#6b7a94',
    textDark: '#4a5568',

    // Border
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    borderAccent: 'rgba(168, 85, 247, 0.3)',
    borderDanger: 'rgba(239, 68, 68, 0.3)',
};

export const PREMIUM_SPACING = {
    // Border Radius
    borderRadiusSm: 12,
    borderRadius: 16,
    borderRadiusLg: 20,
    borderRadiusXl: 24,

    // Padding
    paddingSm: 12,
    padding: 16,
    paddingLg: 20,
    paddingXl: 24,

    // Gaps
    gapSm: 8,
    gap: 12,
    gapLg: 16,
    gapXl: 20,

    // Section
    sectionGap: 16,
    cardPadding: 18,
};

export const PREMIUM_SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    }),
};

export const PREMIUM_TYPOGRAPHY = {
    // Hero
    heroNumber: {
        fontSize: 48,
        fontWeight: '800' as const,
        lineHeight: 56,
    },
    heroLabel: {
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
    },

    // Headings
    h1: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
    },
    h2: {
        fontSize: 20,
        fontWeight: '700' as const,
        lineHeight: 28,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600' as const,
        lineHeight: 24,
    },

    // Body
    body: {
        fontSize: 15,
        fontWeight: '400' as const,
        lineHeight: 22,
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
    },

    // Label
    label: {
        fontSize: 12,
        fontWeight: '500' as const,
        letterSpacing: 0.3,
    },
    labelSmall: {
        fontSize: 11,
        fontWeight: '500' as const,
        letterSpacing: 0.3,
    },

    // Number (KPI)
    kpiNumber: {
        fontSize: 28,
        fontWeight: '800' as const,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '500' as const,
    },
};

export const PREMIUM_ANIMATION = {
    // Durations
    fast: 150,
    normal: 250,
    slow: 400,

    // Scale
    tapScale: 0.97,
    hoverScale: 1.02,
};
