import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useApp } from './src/context/AppContext';
import { UpdateManager } from './src/components/UpdateManager';
import {
  setupNotificationListeners,
  registerForPushNotifications,
  savePushToken,
} from './src/lib/notificationService';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // Register push notifications after user is available
  useEffect(() => {
    if (!currentUser) return;

    const timer = setTimeout(async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(currentUser.id, token);
          console.log('[App] Push token registered for', currentUser.name);
        } else {
          console.log('[App] Push token is null - permission denied or not physical device');
        }
      } catch (err) {
        console.error('[App] Push registration error:', err);
      }
    }, 2000); // 2 second delay for Android activity to be ready

    return () => clearTimeout(timer);
  }, [currentUser]);

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
