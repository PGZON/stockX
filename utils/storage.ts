import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Platform-specific storage that works on both web and native
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            // Use localStorage for web
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.error('localStorage getItem error:', error);
                return null;
            }
        } else {
            // Use SecureStore for native
            try {
                return await SecureStore.getItemAsync(key);
            } catch (error) {
                console.error('SecureStore getItem error:', error);
                return null;
            }
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            // Use localStorage for web
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.error('localStorage setItem error:', error);
                throw error;
            }
        } else {
            // Use SecureStore for native
            try {
                await SecureStore.setItemAsync(key, value);
            } catch (error) {
                console.error('SecureStore setItem error:', error);
                throw error;
            }
        }
    },

    async removeItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            // Use localStorage for web
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('localStorage removeItem error:', error);
            }
        } else {
            // Use SecureStore for native
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                console.error('SecureStore removeItem error:', error);
            }
        }
    }
};

export default storage;
