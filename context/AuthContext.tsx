import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
    id: string;
    name?: string;
    email: string;
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (token: string, userData: User) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check for stored session
                const token = await SecureStore.getItemAsync('auth_token');
                const userData = await SecureStore.getItemAsync('user_data');

                if (token && userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to home if authenticated and trying to access login
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const signIn = async (token: string, userData: User) => {
        try {
            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('user_data');
            setUser(null);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
