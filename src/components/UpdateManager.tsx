import React, { useEffect } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

export const UpdateManager: React.FC = () => {
    const onFetchUpdateAsync = async () => {
        try {
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                Alert.alert(
                    'Güncelleme Mevcut 🚀',
                    'Uygulama için yeni özellikler ve iyileştirmeler hazır. Şimdi yüklemek ister misiniz?',
                    [
                        {
                            text: 'Daha Sonra',
                            style: 'cancel',
                        },
                        {
                            text: 'Şimdi Güncelle',
                            onPress: async () => {
                                try {
                                    await Updates.fetchUpdateAsync();
                                    await Updates.reloadAsync();
                                } catch (error) {
                                    Alert.alert('Hata', 'Güncelleme yüklenirken bir sorun oluştu.');
                                    console.error('Update fetch error:', error);
                                }
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            // Silently fail if check fails (e.g. offline or dev mode without updates)
            console.log('Update check skipped or failed:', error);
        }
    };

    useEffect(() => {
        // Initial check on mount
        if (!__DEV__) {
            onFetchUpdateAsync();
        }

        // Check when app comes to foreground
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && !__DEV__) {
                onFetchUpdateAsync();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return null; // This component doesn't render anything visually
};
