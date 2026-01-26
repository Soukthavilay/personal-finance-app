import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import "../global.css";

import { authService, userService } from "@/services";
import { onUnauthorized } from "@/services/authEvents";
import { useSettingsStore } from "@/stores/settingsStore";
import { useColorScheme } from "../hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
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
    </ThemeProvider>
  );
}
