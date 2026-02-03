import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider value={Colors.professional.background ? DarkTheme : (colorScheme === 'dark' ? DarkTheme : DefaultTheme)}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: Colors.professional.background },
            headerStyle: { backgroundColor: Colors.professional.card },
            headerTintColor: Colors.professional.text,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Add Trade' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </ConvexProvider>
  );
}
