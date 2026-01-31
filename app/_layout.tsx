import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";
import "../global.css";

import { authService, userService } from "@/services";
import { onUnauthorized } from "@/services/authEvents";
import { useSettingsStore } from "@/stores/settingsStore";
import { useColorScheme } from "../hooks/use-color-scheme";
import { DataSyncProvider } from "@/contexts/DataSyncContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Setup device token registration
const setupDeviceToken = async () => {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Device token:', token.data);
    
    // Register device token with backend
    // This will be called when user enables notifications
    return token.data;
  } catch (error) {
    console.log('Failed to get device token:', error);
    return null;
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments() as string[];
  const setFromProfile = useSettingsStore((s) => s.setFromProfile);
  const resetSettings = useSettingsStore((s) => s.reset);

  const inAuth =
    segments[0] === "login" ||
    segments[0] === "register" ||
    segments[0] === "forgot-password" ||
    segments[0] === "reset-password";

  // Setup notification listeners
  React.useEffect(() => {
    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    // Listen for user interactions with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped notification:', response);
      // You can add navigation logic here based on notification data
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  React.useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      resetSettings();
      router.replace("/login" as any);
    });
    return unsubscribe;
  }, [resetSettings, router]);

  React.useEffect(() => {
    if (inAuth) return;
    let cancelled = false;

    (async () => {
      try {
        await authService.me();

        try {
          const profile = await userService.getMyProfile();
          setFromProfile(profile);
        } catch {
          // ignore settings sync error
        }
      } catch {
        if (!cancelled) {
          router.replace("/login" as any);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inAuth, router, setFromProfile]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <DataSyncProvider>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </DataSyncProvider>
    </ThemeProvider>
  );
}
