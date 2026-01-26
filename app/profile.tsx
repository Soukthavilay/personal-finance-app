import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { userService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string>("");

  const [profile, setProfile] = React.useState<userService.UserProfile | null>(
    null,
  );

  const [fullName, setFullName] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const p = await userService.getMyProfile();
      setProfile(p);
      setFullName(p.full_name || "");
      setCurrency(p.currency || "");
      setTimezone(p.timezone || "");
      setAvatarUrl(p.avatar_url || "");
      setStatus("Loaded");
      return p;
    } catch (e) {
      setStatus(getApiErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onSave = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await userService.updateMyProfile({
        full_name: fullName.trim() ? fullName.trim() : null,
        currency: currency.trim(),
        timezone: timezone.trim(),
        avatar_url: avatarUrl.trim() ? avatarUrl.trim() : null,
      });
      setStatus(res.message || "Saved");
      await loadProfile();
    } catch (e) {
      setStatus(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 gap-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => router.back()}
            className="px-3 py-2 rounded-xl bg-gray-100"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-gray-900 font-semibold text-xs">Back</Text>
          </TouchableOpacity>
        </View>

        {!profile ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-2">
            <Text className="text-sm text-gray-600">Loading profile...</Text>
            {!!status && (
              <Text className="text-xs text-gray-500">{status}</Text>
            )}
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
            <View className="gap-1">
              <Text className="text-base font-bold text-gray-900">
                {profile.username}
              </Text>
              <Text className="text-sm text-gray-600">{profile.email}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Full name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="Full name"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Currency
              </Text>
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="VND"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Timezone
              </Text>
              <TextInput
                value={timezone}
                onChangeText={setTimezone}
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="Asia/Bangkok"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Avatar URL
              </Text>
              <TextInput
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="https://..."
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={loading}
                onPress={onSave}
                className="flex-1 bg-blue-600 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={() => loadProfile()}
                className="flex-1 bg-gray-900 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  Reload
                </Text>
              </TouchableOpacity>
            </View>

            {!!status && (
              <View className="border border-gray-200 rounded-xl p-4">
                <Text className="text-xs text-gray-800">{status}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
