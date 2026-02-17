import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if registration fails or device is not physical.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '61e87170-0dfb-4cf3-aff5-b9663624641c',
        });

        const token = tokenData.data;

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Varsayılan',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10b981',
                sound: 'default',
            });
        }

        return token;
    } catch (error) {
        console.error('[Notifications] Error registering:', error);
        return null;
    }
}

/**
 * Save push token to Supabase for the given user.
 * Uses upsert to avoid duplicate tokens.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('push_tokens')
            .upsert(
                {
                    user_id: userId,
                    token: token,
                    device_type: Platform.OS,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,token' }
            );

        if (error) {
            console.error('[Notifications] Error saving token:', error);
        } else {
            console.log('[Notifications] Token saved for user:', userId);
        }
    } catch (error) {
        console.error('[Notifications] Error saving token:', error);
    }
}

/**
 * Remove push token when user logs out.
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('push_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('token', token);

        if (error) {
            console.error('[Notifications] Error removing token:', error);
        }
    } catch (error) {
        console.error('[Notifications] Error removing token:', error);
    }
}

/**
 * Send a coach message as a push notification to a student.
 * Calls the Supabase DB function and logs the notification.
 */
export async function sendCoachMessage(
    recipientId: string,
    senderId: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Call the DB function to send push notification
        const { error: rpcError } = await supabase.rpc('send_expo_push_notification', {
            p_recipient_id: recipientId,
            p_title: '💬 Koçunuzdan Mesaj',
            p_body: message,
            p_data: { type: 'coach_message', sender_id: senderId },
        });

        if (rpcError) {
            console.error('[Notifications] RPC error:', rpcError);
            // Even if RPC fails, try to log the notification
        }

        // Log notification in the notifications table
        const { error: logError } = await supabase
            .from('notifications')
            .insert({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'coach_message',
                title: '💬 Koçunuzdan Mesaj',
                body: message,
                data: { type: 'coach_message', sender_id: senderId },
                is_sent: !rpcError,
            });

        if (logError) {
            console.error('[Notifications] Log error:', logError);
        }

        if (rpcError) {
            return { success: false, error: rpcError.message };
        }

        console.log('[Notifications] Coach message sent to:', recipientId);
        return { success: true };
    } catch (error: any) {
        console.error('[Notifications] Error sending coach message:', error);
        return { success: false, error: error?.message || 'Bilinmeyen hata' };
    }
}

/**
 * Set up notification listeners for foreground and tap handling.
 * Returns a cleanup function.
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
    // Listener for notifications received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notifications] Received:', notification.request.content.title);
        onNotificationReceived?.(notification);
    });

    // Listener for when user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Notifications] Tapped:', response.notification.request.content.data);
        onNotificationTapped?.(response);
    });

    // Return cleanup function
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}
