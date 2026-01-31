import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { userService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { DateFormat, Language, useSettingsStore } from "@/stores/settingsStore";

export default function ProfileScreen() {
  const router = useRouter();
  const setFromProfile = useSettingsStore((s) => s.setFromProfile);

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string>("");

  const [profile, setProfile] = React.useState<userService.UserProfile | null>(
    null,
  );

  const [fullName, setFullName] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  const [language, setLanguage] = React.useState<Language>("vi");
  const [dateFormat, setDateFormat] = React.useState<DateFormat>("YYYY-MM-DD");
  const [weekStartDay, setWeekStartDay] = React.useState("1");
  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = React.useState("");

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

      if (p.language === "vi" || p.language === "en") setLanguage(p.language);
      if (
        p.date_format === "YYYY-MM-DD" ||
        p.date_format === "DD/MM/YYYY" ||
        p.date_format === "MM/DD/YYYY"
      ) {
        setDateFormat(p.date_format);
      }
      if (typeof p.week_start_day === "number") {
        setWeekStartDay(String(p.week_start_day));
      }
      if (typeof p.monthly_income_target === "number") {
        setMonthlyIncomeTarget(String(p.monthly_income_target));
      } else {
        setMonthlyIncomeTarget("");
      }

      setFromProfile(p);
      setStatus("Đã tải");
      return p;
    } catch (e) {
      setStatus(getApiErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setFromProfile]);

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
        language,
        date_format: dateFormat,
        week_start_day: Number(weekStartDay) || 1,
        monthly_income_target: monthlyIncomeTarget.trim()
          ? Number(monthlyIncomeTarget)
          : null,
      });
      setStatus(res.message || "Đã lưu");
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
          <Text className="text-2xl font-bold text-gray-900">Hồ sơ</Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => router.back()}
            className="px-3 py-2 rounded-xl bg-gray-100"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-gray-900 font-semibold text-xs">Quay lại</Text>
          </TouchableOpacity>
        </View>

        {!profile ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-2">
            <Text className="text-sm text-gray-600">Đang tải hồ sơ...</Text>
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
                Họ và tên
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="Họ và tên"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Tiền tệ
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
                Múi giờ
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
                Link ảnh đại diện
              </Text>
              <TextInput
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="https://..."
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Mục tiêu thu nhập tháng
              </Text>
              <TextInput
                value={monthlyIncomeTarget}
                onChangeText={setMonthlyIncomeTarget}
                keyboardType="numeric"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="vd: 10000000"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Ngôn ngữ
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setLanguage("vi")}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    language === "vi" ? "bg-gray-900" : "bg-gray-100"
                  }`}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      language === "vi" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Việt
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setLanguage("en")}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    language === "en" ? "bg-gray-900" : "bg-gray-100"
                  }`}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      language === "en" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Anh
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Định dạng ngày
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setDateFormat("YYYY-MM-DD")}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    dateFormat === "YYYY-MM-DD" ? "bg-gray-900" : "bg-gray-100"
                  }`}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      dateFormat === "YYYY-MM-DD"
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    YYYY-MM-DD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setDateFormat("DD/MM/YYYY")}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    dateFormat === "DD/MM/YYYY" ? "bg-gray-900" : "bg-gray-100"
                  }`}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      dateFormat === "DD/MM/YYYY"
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    DD/MM/YYYY
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                disabled={loading}
                onPress={() => setDateFormat("MM/DD/YYYY")}
                className={`rounded-xl px-4 py-3 ${
                  dateFormat === "MM/DD/YYYY" ? "bg-gray-900" : "bg-gray-100"
                }`}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text
                  className={`text-center font-semibold ${
                    dateFormat === "MM/DD/YYYY" ? "text-white" : "text-gray-900"
                  }`}
                >
                  MM/DD/YYYY
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Ngày bắt đầu tuần (1-7)
              </Text>
              <TextInput
                value={weekStartDay}
                onChangeText={setWeekStartDay}
                keyboardType="numeric"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="1"
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
                  {loading ? "Đang lưu..." : "Lưu"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={() => loadProfile()}
                className="flex-1 bg-gray-900 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  Tải lại
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
