import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from './src/context/AppContext';
import { UpdateManager } from './src/components/UpdateManager';

const AppContent: React.FC = () => {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <PremiumProvider>
          <StatusBar style="light" />
          <UpdateManager />
          <AppContent />
        </PremiumProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
});
