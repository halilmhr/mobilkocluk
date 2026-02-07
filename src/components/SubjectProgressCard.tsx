import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type TopicStatus = 'not_started' | 'in_progress' | 'completed';

interface Topic {
    id: string;
    name: string;
    status: TopicStatus;
}

interface Subject {
    name: string;
    topics: Topic[];
}

interface SubjectProgressCardProps {
    subjects: Subject[];
    onTopicStatusChange: (subject: string, topicId: string, status: TopicStatus) => void;
}

export const SubjectProgressCard: React.FC<SubjectProgressCardProps> = ({
    subjects,
    onTopicStatusChange,
}) => {
    const calculateProgress = (topics: Topic[]) => {
        if (topics.length === 0) return 0;
        const completed = topics.filter(t => t.status === 'completed').length;
        return Math.round((completed / topics.length) * 100);
    };

    const getStatusColor = (status: TopicStatus) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'in_progress': return '#f59e0b';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status: TopicStatus) => {
        switch (status) {
            case 'completed': return '✅';
            case 'in_progress': return '🔄';
            default: return '⚪';
        }
    };

    const cycleStatus = (currentStatus: TopicStatus): TopicStatus => {
        switch (currentStatus) {
            case 'not_started': return 'in_progress';
            case 'in_progress': return 'completed';
            case 'completed': return 'not_started';
        }
    };

    const [expandedSubject, setExpandedSubject] = React.useState<string | null>(null);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📚 Konu Takibi</Text>
            </View>

            <ScrollView style={styles.subjectList} nestedScrollEnabled>
                {subjects.map((subject) => {
                    const progress = calculateProgress(subject.topics);
                    const isExpanded = expandedSubject === subject.name;

                    return (
                        <View key={subject.name} style={styles.subjectItem}>
                            <TouchableOpacity
                                style={styles.subjectHeader}
                                onPress={() => setExpandedSubject(isExpanded ? null : subject.name)}
                            >
                                <View style={styles.subjectInfo}>
                                    <Text style={styles.subjectName}>{subject.name}</Text>
                                    <Text style={styles.subjectMeta}>
                                        {subject.topics.filter(t => t.status === 'completed').length} / {subject.topics.length} konu
                                    </Text>
                                </View>
                                <View style={styles.progressSection}>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${progress}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>{progress}%</Text>
                                </View>
                                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.topicList}>
                                    {subject.topics.map((topic) => (
                                        <TouchableOpacity
                                            key={topic.id}
                                            style={styles.topicItem}
                                            onPress={() => onTopicStatusChange(
                                                subject.name,
                                                topic.id,
                                                cycleStatus(topic.status)
                                            )}
                                        >
                                            <Text style={styles.topicIcon}>
                                                {getStatusIcon(topic.status)}
                                            </Text>
                                            <Text style={[
                                                styles.topicName,
                                                topic.status === 'completed' && styles.topicCompleted
                                            ]}>
                                                {topic.name}
                                            </Text>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: getStatusColor(topic.status) }
                                            ]} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
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
        borderColor: 'rgba(255, 255, 255, 0.08)',
        maxHeight: 400,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    subjectList: {
        flex: 1,
    },
    subjectItem: {
        marginBottom: 10,
    },
    subjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 14,
        borderRadius: 14,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    subjectMeta: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    progressSection: {
        alignItems: 'center',
        marginRight: 12,
    },
    progressBarBg: {
        width: 60,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 3,
    },
    progressText: {
        color: '#10b981',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
    },
    expandIcon: {
        color: '#64748b',
        fontSize: 12,
    },
    topicList: {
        paddingLeft: 16,
        paddingTop: 8,
        gap: 6,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        padding: 10,
        borderRadius: 10,
    },
    topicIcon: {
        fontSize: 14,
        marginRight: 10,
    },
    topicName: {
        color: '#E2E8F0',
        fontSize: 13,
        flex: 1,
    },
    topicCompleted: {
        color: '#64748b',
        textDecorationLine: 'line-through',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
