import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext'; // Import new AuthProvider
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  // Ensure splash screen matches
  React.useEffect(() => {
    // Prevent white flash on dark mode or vice versa by setting root background
    // SystemUI.setBackgroundColorAsync("#ffffff"); 
  }, []);

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false, // clean
          headerTitleStyle: { fontWeight: 'bold' },
          animation: 'slide_from_right' // Smooth back animations
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Add Trade',
            headerShown: true
          }}
        />
        <Stack.Screen name="profit-history" options={{ headerShown: false }} />
        <Stack.Screen name="trade/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </ConvexProvider>
  );
}
