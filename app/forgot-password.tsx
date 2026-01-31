import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [resetToken, setResetToken] = React.useState<string>("");

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setResetToken("");

    try {
      const res = await authService.forgotPassword(email);
      setSuccess(res.message || "Đã gửi yêu cầu");
      if (typeof res.resetToken === "string" && res.resetToken) {
        setResetToken(res.resetToken);
      }
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
            Quên mật khẩu
          </Text>
          <Text className="text-sm text-gray-600">
            Nhập email để tạo mã đặt lại mật khẩu.
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

          {!!resetToken && (
            <View className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 gap-2">
              <Text className="text-xs text-gray-500">
                Mã (copy/paste vào màn hình Đặt lại mật khẩu)
              </Text>
              <Text className="text-sm font-semibold text-gray-900">
                {resetToken}
              </Text>
            </View>
          )}

          <TouchableOpacity
            disabled={loading}
            onPress={onSubmit}
            className="bg-blue-600 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? "Đang gửi..." : "Tạo mã đặt lại"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/reset-password" as any)}
            className="bg-gray-900 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              Đi tới đặt lại mật khẩu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/login" as any)}
            className="bg-gray-100 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-gray-900 text-center font-semibold">
              Quay lại đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
