import { ChevronRight, LogOut, User, Wallet, Bell, CreditCard, Settings, Globe, Shield, HelpCircle, Target, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { notificationService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import * as Notifications from "expo-notifications";
import { authService } from "@/services";
import { useSettingsStore } from "@/stores/settingsStore";

type AuthUser = {
  id: number;
  username: string;
  email: string;
};

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

function SettingsItem({ icon, title, subtitle, onPress, showArrow = true, rightComponent }: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3 px-4 bg-white border-b border-gray-50"
    >
      <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-500">{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && <ChevronRight size={20} color="#9CA3AF" />)}
    </TouchableOpacity>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
        {title}
      </Text>
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.settings.currency);
  const resetSettings = useSettingsStore((s) => s.reset);

  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadMe = React.useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me as AuthUser);
    } catch {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [loadMe]);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await authService.logout();
              setUser(null);
              resetSettings();
              router.replace("/login" as any);
            } catch (error) {
              console.error("Logout error:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  const navigateToBudgets = () => {
    router.push("/budgets" as any);
  };

  const testNotification = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please enable notifications in settings");
        return;
      }

      // Send test notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test Notification",
          body: "This is a test to verify notifications are working!",
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      Alert.alert("Success", "Test notification sent! Check your notification center.");
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Cài đặt</Text>
        </View>

        <View className="p-4">
          {/* Account Section */}
          <SettingsSection title="Tài khoản">
            {user ? (
              <>
                <SettingsItem
                  icon={<User size={20} color="#3B82F6" />}
                  title={user.username}
                  subtitle={user.email}
                  onPress={() => navigateTo("/profile")}
                />
                <SettingsItem
                  icon={<Wallet size={20} color="#10B981" />}
                  title="Quản lý ví"
                  subtitle="Xem và quản lý các tài khoản"
                  onPress={() => navigateTo("/wallets")}
                />
                                <SettingsItem
                  icon={<LogOut size={20} color="#EF4444" />}
                  title="Đăng xuất"
                  onPress={handleLogout}
                  showArrow={false}
                />
              </>
            ) : (
              <SettingsItem
                icon={<User size={20} color="#3B82F6" />}
                title="Đăng nhập"
                subtitle="Đăng nhập để sử dụng đầy đủ tính năng"
                onPress={() => navigateTo("/login")}
              />
            )}
          </SettingsSection>

          {/* App Settings Section */}
          <SettingsSection title="Cài đặt ứng dụng">
            <SettingsItem
              icon={<Bell size={20} color="#EC4899" />}
              title="Thông báo"
              subtitle="Quản lý thông báo đẩy"
              onPress={() => router.push("/notifications" as any)}
            />
            <SettingsItem
              icon={<AlertCircle size={20} color="#8B5CF6" />}
              title="Test Notification"
              subtitle="Gửi thông báo kiểm tra"
              onPress={testNotification}
            />
          </SettingsSection>

          {/* Data Management Section */}
          <SettingsSection title="Quản lý dữ liệu">
            <SettingsItem
              icon={<CreditCard size={20} color="#8B5CF6" />}
              title="Danh mục"
              subtitle="Quản lý danh mục thu chi"
              onPress={() => router.push("/categories" as any)}
            />
            <SettingsItem
              icon={<Wallet size={20} color="#10B981" />}
              title="Ngân sách"
              subtitle="Đặt và theo dõi ngân sách"
              onPress={navigateToBudgets}
            />
                      </SettingsSection>
          {/* App Info */}
          <View className="items-center py-6">
            <Text className="text-sm text-gray-500">Phiên bản 1.0.0</Text>
            <Text className="text-xs text-gray-400 mt-1">© 2026 Finance App</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
