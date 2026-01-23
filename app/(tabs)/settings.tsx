import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  authService,
  budgetService,
  categoryService,
  notificationService,
} from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatCurrency } from "@/utils/formatting";

type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export default function SettingsScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const [user, setUser] = React.useState<AuthUser | null>(null);

  const [budgetPeriod, setBudgetPeriod] = React.useState("2026-01");
  const [budgetAmount, setBudgetAmount] = React.useState("1000");

  const [budgets, setBudgets] = React.useState<budgetService.BudgetDto[]>([]);

  const [prefs, setPrefs] =
    React.useState<notificationService.NotificationPreferences | null>(null);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      const result = await fn();
      setStatus(JSON.stringify(result, null, 2));
    } catch (e) {
      setStatus(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

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

  const getDefaultExpenseCategoryId = async (): Promise<number> => {
    const categories = await categoryService.listCategories();
    const expense =
      categories.find((c) => c.type === "expense") || categories[0];
    if (!expense) throw new Error("No categories found");
    return expense.id;
  };

  const loadBudgets = async () => {
    const rows = await budgetService.listBudgets({ period: budgetPeriod });
    setBudgets(rows);
    return rows;
  };

  const loadPrefs = async () => {
    const p = await notificationService.getPreferences();
    setPrefs(p);
    return p;
  };

  const updatePrefs = async () => {
    if (!prefs) throw new Error("Preferences not loaded");
    await notificationService.updatePreferences({
      enabled: prefs.enabled,
      daily_time: prefs.daily_time,
      daily_reminder_enabled: prefs.daily_reminder_enabled,
      daily_summary_enabled: prefs.daily_summary_enabled,
      budget_warning_enabled: prefs.budget_warning_enabled,
      timezone: prefs.timezone,
    });
    return { message: "Updated" };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="p-6 gap-5">
          <Text className="text-2xl font-bold">Settings</Text>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-2">
            <Text className="text-sm font-semibold text-gray-900">
              Environment
            </Text>
            <Text className="text-xs text-gray-500">API Base URL</Text>
            <Text className="text-xs text-gray-700">
              {process.env.EXPO_PUBLIC_API_BASE_URL ||
                "(default) http://localhost:3000"}
            </Text>
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                Account
              </Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => run(loadMe)}
                className="px-3 py-2 rounded-xl bg-gray-100"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-gray-800 font-semibold text-xs">
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>

            {user ? (
              <View className="gap-1">
                <Text className="text-base font-bold text-gray-900">
                  {user.username}
                </Text>
                <Text className="text-sm text-gray-600">{user.email}</Text>
              </View>
            ) : (
              <Text className="text-sm text-gray-600">
                You are not logged in.
              </Text>
            )}

            {!user && (
              <View className="gap-3">
                <View className="gap-2">
                  <Text className="text-xs font-medium text-gray-600">
                    Email
                  </Text>
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
                  <Text className="text-xs font-medium text-gray-600">
                    Password
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className="border border-gray-200 rounded-xl px-4 py-3"
                    placeholder="password"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    disabled={loading}
                    onPress={() =>
                      run(async () => {
                        const u = await authService.login(email, password);
                        setUser(u as AuthUser);
                        return u;
                      })
                    }
                    className="flex-1 bg-blue-600 rounded-xl px-4 py-3"
                    style={{ opacity: loading ? 0.6 : 1 }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => run(() => authService.me())}
                    className="flex-1 bg-gray-900 rounded-xl px-4 py-3"
                    style={{ opacity: loading ? 0.6 : 1 }}
                  >
                    <Text className="text-white text-center font-semibold">
                      Me
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!!user && (
              <TouchableOpacity
                disabled={loading}
                onPress={() =>
                  run(async () => {
                    await authService.logout();
                    setUser(null);
                    return { message: "Logged out" };
                  })
                }
                className="bg-red-600 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  Logout
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                Budgets
              </Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => run(loadBudgets)}
                className="px-3 py-2 rounded-xl bg-gray-100"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-gray-800 font-semibold text-xs">
                  Load
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">
                Period (YYYY-MM)
              </Text>
              <TextInput
                value={budgetPeriod}
                onChangeText={setBudgetPeriod}
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="2026-01"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-medium text-gray-600">Amount</Text>
              <TextInput
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="1000"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={loading}
                onPress={() =>
                  run(async () => {
                    const categoryId = await getDefaultExpenseCategoryId();
                    const created = await budgetService.createBudget({
                      category_id: categoryId,
                      amount: Number(budgetAmount) || 0,
                      period: budgetPeriod,
                    });
                    await loadBudgets();
                    return created;
                  })
                }
                className="flex-1 bg-blue-600 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  Create
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                onPress={() => run(loadBudgets)}
                className="flex-1 bg-gray-900 rounded-xl px-4 py-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-semibold">
                  Reload
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-1">
              {budgets.length === 0 ? (
                <Text className="text-xs text-gray-500">
                  No budgets loaded.
                </Text>
              ) : (
                <View className="gap-2">
                  {budgets.slice(0, 5).map((b) => (
                    <View
                      key={String(b.id)}
                      className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <View>
                        <Text className="text-sm font-semibold text-gray-900">
                          {b.category_name || `Category ${b.category_id}`}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {b.period}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-gray-900">
                        {formatCurrency(Number(b.amount) || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                Notifications
              </Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => run(loadPrefs)}
                className="px-3 py-2 rounded-xl bg-gray-100"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-gray-800 font-semibold text-xs">
                  Load
                </Text>
              </TouchableOpacity>
            </View>

            {!prefs ? (
              <Text className="text-sm text-gray-600">
                Load preferences to edit.
              </Text>
            ) : (
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-800 font-medium">
                    Enabled
                  </Text>
                  <Switch
                    value={prefs.enabled}
                    onValueChange={(v) => setPrefs({ ...prefs, enabled: v })}
                    disabled={loading}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-800 font-medium">
                    Daily reminder
                  </Text>
                  <Switch
                    value={prefs.daily_reminder_enabled}
                    onValueChange={(v) =>
                      setPrefs({ ...prefs, daily_reminder_enabled: v })
                    }
                    disabled={loading}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-800 font-medium">
                    Daily summary
                  </Text>
                  <Switch
                    value={prefs.daily_summary_enabled}
                    onValueChange={(v) =>
                      setPrefs({ ...prefs, daily_summary_enabled: v })
                    }
                    disabled={loading}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-800 font-medium">
                    Budget warning
                  </Text>
                  <Switch
                    value={prefs.budget_warning_enabled}
                    onValueChange={(v) =>
                      setPrefs({ ...prefs, budget_warning_enabled: v })
                    }
                    disabled={loading}
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-medium text-gray-600">
                    Daily time
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    disabled={loading}
                    className="border border-gray-200 rounded-xl px-4 py-3"
                    style={{ opacity: loading ? 0.6 : 1 }}
                  >
                    <Text className="text-gray-900 font-semibold">
                      {prefs.daily_time}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={() => run(updatePrefs)}
                  className="bg-blue-600 rounded-xl px-4 py-3"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <Text className="text-white text-center font-semibold">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!!prefs && showTimePicker && (
            <DateTimePicker
              value={(() => {
                const [hh, mm] = String(prefs.daily_time || "08:00")
                  .split(":")
                  .map((n) => Number(n));
                const d = new Date();
                d.setHours(Number.isFinite(hh) ? hh : 8);
                d.setMinutes(Number.isFinite(mm) ? mm : 0);
                d.setSeconds(0);
                d.setMilliseconds(0);
                return d;
              })()}
              mode="time"
              display="default"
              onChange={(_, selectedDate) => {
                setShowTimePicker(false);
                if (!selectedDate || !prefs) return;
                const hh = String(selectedDate.getHours()).padStart(2, "0");
                const mm = String(selectedDate.getMinutes()).padStart(2, "0");
                setPrefs({ ...prefs, daily_time: `${hh}:${mm}` });
              }}
            />
          )}

          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-2">
            <Text className="text-sm font-semibold text-gray-900">Debug</Text>
            <Text className="text-xs text-gray-500">
              Latest response / error
            </Text>
            <View className="border border-gray-200 rounded-xl p-4 min-h-[120px]">
              <Text className="text-xs text-gray-800">{status}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
