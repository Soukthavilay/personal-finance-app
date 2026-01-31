import { Bell, Clock, TrendingUp, AlertTriangle, Smartphone, Moon, Sun } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";

import { notificationService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  
  // Notification preferences
  const [preferences, setPreferences] = React.useState({
    enabled: false,
    daily_time: "08:00",
    timezone: "Asia/Bangkok",
    daily_reminder_enabled: false,
    daily_summary_enabled: false,
    budget_warning_enabled: false,
  });

  const normalizePreferences = React.useCallback((prefs: any) => {
    const toBool = (v: any) => v === true || v === 1 || v === "1";
    return {
      enabled: toBool(prefs.enabled),
      daily_time: prefs.daily_time || "08:00",
      timezone: prefs.timezone || "Asia/Bangkok",
      daily_reminder_enabled: toBool(prefs.daily_reminder_enabled),
      daily_summary_enabled: toBool(prefs.daily_summary_enabled),
      budget_warning_enabled: toBool(prefs.budget_warning_enabled),
    };
  }, []);

  const persistPreferences = React.useCallback(
    async (next: typeof preferences) => {
      await notificationService.updatePreferences(next);
      setPreferences(next);
    },
    [],
  );

  const handleToggleEnabled = React.useCallback(
    async (value: boolean) => {
      try {
        setLoading(true);
        setError("");

        const next = { ...preferences, enabled: value };

        if (value) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission Required",
              "Please enable notifications in your device settings to receive budget warnings.",
            );
            next.enabled = false;
            await persistPreferences(next);
            return;
          }

          try {
            const token = await Notifications.getExpoPushTokenAsync();
            await notificationService.upsertDeviceToken({
              token: token.data,
              platform: Platform.OS as "ios" | "android",
            });
          } catch (tokenError) {
            console.log("Failed to register device token:", tokenError);
          }
        }

        await persistPreferences(next);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [persistPreferences, preferences],
  );

  const handleTogglePreference = React.useCallback(
    async (partial: Partial<typeof preferences>) => {
      try {
        setLoading(true);
        setError("");
        const next = { ...preferences, ...partial };
        await persistPreferences(next);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [persistPreferences, preferences],
  );

  const loadPreferences = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Check current notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      const prefsRaw = await notificationService.getPreferences();
      const prefs = normalizePreferences(prefsRaw);
      
      // Update enabled state based on actual permissions
      if (status !== 'granted' && prefs.enabled) {
        // Permissions were revoked, update preferences
        await notificationService.updatePreferences({ enabled: false });
        prefs.enabled = false;
      }
      
      setPreferences(prefs);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [normalizePreferences]);

  React.useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleUpdatePreferences = async () => {
    try {
      setLoading(true);
      setError("");
      
      let finalPreferences = { ...preferences };
      
      // If enabling notifications, request permissions first
      if (preferences.enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert("Permission Required", "Please enable notifications in your device settings to receive budget warnings.");
          finalPreferences.enabled = false;
          setPreferences(finalPreferences);
          return;
        }
        
        // Register device token
        try {
          const token = await Notifications.getExpoPushTokenAsync();
          await notificationService.upsertDeviceToken({
            token: token.data,
            platform: Platform.OS as "ios" | "android"
          });
        } catch (tokenError) {
          console.log('Failed to register device token:', tokenError);
        }
      }
      
      await notificationService.updatePreferences(finalPreferences);
      setPreferences(finalPreferences);
      Alert.alert("Success", "Notification preferences updated successfully!");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, "0");
      const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
      setPreferences(prev => ({
        ...prev,
        daily_time: `${hours}:${minutes}`
      }));
    }
  };

  const getTimeForPicker = () => {
    const [hours, minutes] = preferences.daily_time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);
    return date;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="bg-white border-b border-gray-100 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        </View>

        <View className="p-4">
          <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Bell size={24} color="#3B82F6" className="mr-3" />
                <View>
                  <Text className="text-lg font-semibold text-gray-900">Enable Notifications</Text>
                  <Text className="text-sm text-gray-500">Manage all notification settings</Text>
                </View>
              </View>
              <Switch
                value={preferences.enabled}
                onValueChange={handleToggleEnabled}
                disabled={loading}
              />
            </View>
          </View>

          {preferences.enabled && (
            <>
              <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Clock size={20} color="#10B981" className="mr-3" />
                    <View>
                      <Text className="font-semibold text-gray-900">Daily Reminder</Text>
                      <Text className="text-sm text-gray-500">Get daily spending reminder</Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences.daily_reminder_enabled}
                    onValueChange={(value) =>
                      handleTogglePreference({ daily_reminder_enabled: value })
                    }
                    disabled={loading}
                  />
                </View>
                
                {preferences.daily_reminder_enabled && (
                  <View className="border-t border-gray-100 pt-3">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Reminder Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(true)}
                      className="border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <Text className="text-gray-900 font-medium">{preferences.daily_time}</Text>
                      <Clock size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <TrendingUp size={20} color="#8B5CF6" className="mr-3" />
                    <View>
                      <Text className="font-semibold text-gray-900">Daily Summary</Text>
                      <Text className="text-sm text-gray-500">Daily spending & income report</Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences.daily_summary_enabled}
                    onValueChange={(value) =>
                      handleTogglePreference({ daily_summary_enabled: value })
                    }
                    disabled={loading}
                  />
                </View>
              </View>

              <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <AlertTriangle size={20} color="#F59E0B" className="mr-3" />
                    <View>
                      <Text className="font-semibold text-gray-900">Budget Warnings</Text>
                      <Text className="text-sm text-gray-500">Alert when near budget limit</Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences.budget_warning_enabled}
                    onValueChange={(value) =>
                      handleTogglePreference({ budget_warning_enabled: value })
                    }
                    disabled={loading}
                  />
                </View>
              </View>

              <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                <View className="flex-row items-center">
                  <Smartphone size={20} color="#6B7280" className="mr-3" />
                  <View>
                    <Text className="font-semibold text-gray-900">Timezone</Text>
                    <Text className="text-sm text-gray-500">{preferences.timezone}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleUpdatePreferences}
                disabled={loading}
                className="bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
              >
                <Bell size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">
                  {loading ? "Saving..." : "Save Preferences"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start">
              <Bell size={20} color="#3B82F6" className="mr-3 mt-1" />
              <View className="flex-1">
                <Text className="font-semibold text-blue-900 mb-2">About Notifications</Text>
                <Text className="text-sm text-blue-800 leading-relaxed">
                  Stay on top of your finances with timely notifications. Get daily reminders, spending summaries, and budget alerts to help you manage your money better.
                </Text>
                <View className="mt-3 space-y-1">
                  <Text className="text-xs text-blue-700">• Daily reminders at your preferred time</Text>
                  <Text className="text-xs text-blue-700">• Spending summaries to track your habits</Text>
                  <Text className="text-xs text-blue-700">• Budget warnings before you overspend</Text>
                </View>
              </View>
            </View>
          </View>

          {!!error && (
            <View className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <Text className="text-red-700 text-sm font-medium">{error}</Text>
            </View>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={getTimeForPicker()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
