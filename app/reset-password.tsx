import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [token, setToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await authService.resetPassword({
        email,
        token,
        newPassword,
      });
      setSuccess(res.message || "Password reset successfully");
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
          <Text className="text-3xl font-bold text-gray-900">
            Reset password
          </Text>
          <Text className="text-sm text-gray-600">
            Paste the reset token and set a new password.
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
            <Text className="text-xs font-medium text-gray-600">Token</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="reset token"
            />
          </View>

          <View className="gap-2">
            <Text className="text-xs font-medium text-gray-600">
              New password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="new password"
            />
          </View>

          {!!error && (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}

          {!!success && (
            <View className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <Text className="text-sm text-green-700">{success}</Text>
            </View>
          )}

          <TouchableOpacity
            disabled={loading}
            onPress={onSubmit}
            className="bg-blue-600 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? "Submitting..." : "Reset password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/login" as any)}
            className="bg-gray-900 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              Back to login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/forgot-password" as any)}
            className="bg-gray-100 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-gray-900 text-center font-semibold">
              Back to forgot password
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
