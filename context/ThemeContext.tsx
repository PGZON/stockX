import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    colors: typeof Colors.professionalDark;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
    colors: Colors.professionalLight, // Default fallback
    isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>('light');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load persisted theme
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('user_theme');
                if (storedTheme) {
                    setThemeState(storedTheme as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme', e);
            } finally {
                setIsReady(true);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    const getActiveTheme = () => {
        if (theme === 'system') {
            return systemColorScheme === 'dark' ? 'dark' : 'light';
        }
        return theme;
    };

    const activeTheme = getActiveTheme();
    const isDark = activeTheme === 'dark';
    const colors = isDark ? Colors.professionalDark : Colors.professionalLight;

    if (!isReady) {
        return null; // Or a splash screen
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
