import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  const onRegister = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authService.register(username, email, password);
      setSuccess("Đăng ký thành công. Vui lòng đăng nhập.");
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
            Tạo tài khoản
          </Text>
          <Text className="text-sm text-gray-600">
            Đăng ký để bắt đầu theo dõi tài chính của bạn.
          </Text>
        </View>

        <View className="gap-3">
          <View className="gap-2">
            <Text className="text-xs font-medium text-gray-600">Tên người dùng</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="tên người dùng"
            />
          </View>

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
            <Text className="text-xs font-medium text-gray-600">Mật khẩu</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="border border-gray-200 rounded-xl px-4 py-3"
              placeholder="mật khẩu"
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
            onPress={onRegister}
            className="bg-blue-600 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? "Đang tạo..." : "Đăng ký"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.replace("/login" as any)}
            className="bg-gray-900 rounded-xl px-4 py-3"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-center font-semibold">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
