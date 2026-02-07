import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { usePremium } from '../context/PremiumContext';
import { getStudentAnalysis, getCoachGlobalAnalysis, StudentAnalysisData, CoachGlobalAnalysisData } from '../lib/aiService';

interface AICoachAssistantProps {
    studentData?: StudentAnalysisData | null;
    globalData?: CoachGlobalAnalysisData | null;
}

export const AICoachAssistant: React.FC<AICoachAssistantProps> = ({ studentData, globalData }) => {
    const { isPremium, showUpgradeModal } = usePremium();
    const [dynamicInsights, setDynamicInsights] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        const fetchInsights = async () => {
            if (!isPremium) return;

            // Only fetch if we have data to analyze
            if (!studentData && !globalData) {
                setDynamicInsights([]);
                return;
            }

            setIsLoading(true);
            setHasError(false);
            try {
                if (studentData) {
                    console.log('[AI] Fetching student analysis for:', studentData.name);
                    const result = await getStudentAnalysis(studentData);
                    console.log('[AI] Student analysis result:', result);
                    setDynamicInsights(result);
                } else if (globalData) {
                    console.log('[AI] Fetching global analysis for coach with', globalData.totalStudents, 'students');
                    const result = await getCoachGlobalAnalysis(globalData);
                    console.log('[AI] Global analysis result:', result);
                    setDynamicInsights(result);
                }
            } catch (error) {
                console.error("[AI] Analysis error:", error);
                setHasError(true);
                // Provide contextual fallback based on available data
                if (studentData) {
                    setDynamicInsights([
                        `${studentData.name} için analiz yüklenemedi.`,
                        'Öğrencinin son aktivitelerini manuel olarak kontrol edebilirsiniz.',
                        'İnternet bağlantınızı kontrol edin ve yeniden deneyin.'
                    ]);
                } else if (globalData) {
                    setDynamicInsights([
                        `${globalData.totalStudents} öğrenci için genel analiz yüklenemedi.`,
                        `Bugün ${globalData.activeToday} öğrenci aktif görünüyor.`,
                        'Detaylı analiz için öğrenci seçin.'
                    ]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, [studentData, globalData, isPremium]);

    // Show placeholder if no data provided
    const noDataInsights = [
        'Analiz için öğrenci verisi bekleniyor...',
        'Bir öğrenci seçin veya dashboard\'a dönün.',
        'AI analizi için veri gereklidir.'
    ];

    const displayInsights = dynamicInsights.length > 0 ? dynamicInsights : noDataInsights;

    // Dynamic subtitle based on context
    const getSubtitle = () => {
        if (isLoading) return 'Analiz yapılıyor...';
        if (hasError) return 'Analiz yüklenemedi';
        if (studentData) return `${studentData.name} için özel analiz`;
        if (globalData) return `${globalData.totalStudents} öğrenci analizi`;
        return 'Öğrencilerinizi bu hafta analiz ettim';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.aiIcon}>
                    <Text style={styles.aiEmoji}>🤖</Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>AI Koçluk Asistanı</Text>
                    <Text style={styles.subtitle}>{getSubtitle()}</Text>
                </View>
                <View style={[styles.glowDot, hasError && { backgroundColor: '#ef4444' }]} />
            </View>

            {/* Insights Section */}
            <View style={styles.insightsContainer}>
                {isLoading ? (
                    <ActivityIndicator color="#A855F7" size="small" style={{ marginVertical: 20 }} />
                ) : (
                    displayInsights.map((insight, index) => (
                        <View key={index} style={styles.insightRow}>
                            <Text style={styles.insightBullet}>•</Text>
                            {isPremium ? (
                                <Text style={styles.insightText}>{insight}</Text>
                            ) : (
                                <Text style={styles.blurredText}>
                                    {'█'.repeat(20 + Math.floor(Math.random() * 15))}
                                </Text>
                            )}
                        </View>
                    ))
                )}
            </View>

            {/* CTA Section */}
            {!isPremium ? (
                <TouchableOpacity style={styles.ctaSection} onPress={showUpgradeModal}>
                    <View style={styles.lockBadge}>
                        <Text style={styles.lockIcon}>🔒</Text>
                        <Text style={styles.lockText}>AI raporunuz hazır</Text>
                    </View>
                    <View style={styles.ctaButton}>
                        <Text style={styles.ctaButtonText}>Tam Raporu Gör – Premium</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.viewReportBtn}>
                    <Text style={styles.viewReportBtnText}>📊 Haftalık AI Raporunu Görüntüle</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    aiEmoji: {
        fontSize: 24,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 2,
    },
    glowDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    insightsContainer: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    insightRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    insightBullet: {
        color: '#A855F7',
        fontSize: 14,
        marginRight: 10,
    },
    insightText: {
        color: '#E2E8F0',
        fontSize: 13,
        flex: 1,
        lineHeight: 20,
    },
    blurredText: {
        color: '#475569',
        fontSize: 13,
        flex: 1,
    },
    ctaSection: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    lockIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    lockText: {
        color: '#A855F7',
        fontSize: 13,
        fontWeight: '600',
    },
    ctaButton: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    viewReportBtn: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    viewReportBtnText: {
        color: '#A855F7',
        fontSize: 14,
        fontWeight: '600',
    },
});
