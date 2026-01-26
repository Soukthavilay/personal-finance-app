import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService, userService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useSettingsStore } from "@/stores/settingsStore";

export default function LoginScreen() {
  const router = useRouter();
  const setFromProfile = useSettingsStore((s) => s.setFromProfile);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const onLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await authService.login(email, password);

      try {
        const profile = await userService.getMyProfile();
        setFromProfile(profile);
      } catch {
        // ignore settings sync error
      }

      router.replace("/(tabs)");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 justify-center gap-5">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
          <Text className="text-sm text-gray-600">
            Sign in to continue managing your finances.
          </Text>
        </View>

        <View className="gap-3">
          <View className="gap-2">
            <Text className="text-xs font-medium text-gray-600">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="email"
            />
          </View>

          <View className="gap-2">
            <Text className="text-xs font-medium text-gray-600">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="password"
            />
          </View>

          {!!error && (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            disabled={loading}
            onPress={onLogin}
            className="bg-blue-600 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? "Signing in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/forgot-password" as any)}
            className="bg-gray-100 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-gray-900 text-center font-semibold">
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/register" as any)}
            className="bg-gray-900 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              Register
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-xs text-gray-500">
            If your session expires, you will be redirected here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
