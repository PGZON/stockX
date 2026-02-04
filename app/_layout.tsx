import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext'; // Import new AuthProvider
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://f0a92c12c769c0ba384121f6026a0cdf@o4510827583569920.ingest.de.sentry.io/4510827585142864',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AppThemeProvider>
        <CurrencyProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </CurrencyProvider>
      </AppThemeProvider>
    </ConvexProvider>
  );
});