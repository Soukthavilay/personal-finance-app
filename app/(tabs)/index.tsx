import { CreditCard, DollarSign, TrendingUp, Wallet, Target, PiggyBank } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

import {
  RecentTransactions,
  Transaction,
  TransactionModal,
  TransactionType,
} from "@/components";
import {
  authService,
  budgetService,
  categoryService,
  notificationService,
  reportService,
  transactionService,
} from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useDataSync, SyncEvent } from "@/contexts/DataSyncContext";
import { formatDateYYYYMMDD } from "@/utils/date";
import { formatCurrency } from "@/utils/formatting";
import { useWalletStore } from "@/stores/walletStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const { subscribe, dashboardRefreshKey } = useDataSync();
  const defaultWalletId = useWalletStore((s) => s.defaultWalletId);
  const selectedWalletId = useWalletStore((s) => s.selectedWalletId);
  const setSelectedWalletId = useWalletStore((s) => s.setSelectedWalletId);
  const wallets = useWalletStore((s) => s.wallets);
  const refreshWallets = useWalletStore((s) => s.refreshWallets);
  const appCurrency = useSettingsStore((s) => s.settings.currency);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");
  const [error, setError] = useState<string>("");
  const [walletPickerVisible, setWalletPickerVisible] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [budgetUsed, setBudgetUsed] = useState<number>(0);
  const [budgetRemaining, setBudgetRemaining] = useState<number>(0);
  const [budgetUsedPercentage, setBudgetUsedPercentage] = useState<number>(0);
  const [lastBudgetWarning, setLastBudgetWarning] = useState<string>("");
  const lastBudgetWarningRef = useRef<string>("");
  const budgetWarningInFlightRef = useRef<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<categoryService.Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<
    Array<{ name: string; total: string }>
  >([]);
  const [categorySpending, setCategorySpending] = useState<
    Array<{ name: string; amount: number; percentage: number }>
  >([]);

  useEffect(() => {
    if (selectedWalletId === null && defaultWalletId) {
      setSelectedWalletId(defaultWalletId);
    }
  }, [defaultWalletId, selectedWalletId, setSelectedWalletId]);

  const categoryIdByTypeAndName = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((cat) => {
      map.set(`${cat.type}:${cat.name.toLowerCase()}`, cat.id);
    });
    return map;
  }, [categories]);

  const selectedWalletLabel = useMemo(() => {
    const resolvedWalletId = selectedWalletId ?? defaultWalletId;
    const w = wallets.find((x) => x.id === resolvedWalletId);
    return w?.name || "Ví";
  }, [defaultWalletId, selectedWalletId, wallets]);

  const displayCurrency = useMemo(() => {
    const resolvedWalletId = selectedWalletId ?? defaultWalletId;
    const w = wallets.find((x) => x.id === resolvedWalletId);
    return w?.currency || appCurrency || "USD";
  }, [appCurrency, defaultWalletId, selectedWalletId, wallets]);

  const walletBalanceFromStore = useMemo(() => {
    const resolvedWalletId = selectedWalletId ?? defaultWalletId;
    const w = wallets.find((x) => x.id === resolvedWalletId);
    return Number(w?.balance) || 0;
  }, [defaultWalletId, selectedWalletId, wallets]);

  useEffect(() => {
    if (transactions.length === 0) {
      setTotalBalance(walletBalanceFromStore);
    }
  }, [transactions.length, walletBalanceFromStore]);

  const checkBudgetWarnings = useCallback(async (usedPercentage: number, remaining: number) => {
    try {
      // Get notification preferences
      const prefs = await notificationService.getPreferences();
      
      if (!prefs.enabled || !prefs.budget_warning_enabled) {
        return;
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let level: "exceeded" | "90" | "75" | null = null;
      if (remaining < 0) {
        level = "exceeded";
      } else if (usedPercentage >= 90) {
        level = "90";
      } else if (usedPercentage >= 75) {
        level = "75";
      } else {
        return; // No warning needed
      }

      const warningKey = `${today}-${level}`;

      // Avoid duplicate warnings on same day (per warning level)
      // Use refs to avoid race conditions when loadDashboard triggers multiple times quickly.
      if (lastBudgetWarningRef.current === warningKey) {
        return;
      }

      if (budgetWarningInFlightRef.current.has(warningKey)) {
        return;
      }

      budgetWarningInFlightRef.current.add(warningKey);
      lastBudgetWarningRef.current = warningKey;
      setLastBudgetWarning(warningKey);

      let message = "";
      let title = "";
      
      // Check different warning levels
      if (level === "exceeded") {
        title = "⚠️ Budget Exceeded!";
        message = `You've gone over budget by ${formatCurrency(Math.abs(remaining), displayCurrency)}. Current spending: ${usedPercentage.toFixed(0)}% of budget.`;
      } else if (level === "90") {
        title = "🚨 Budget Warning!";
        message = `You've used ${usedPercentage.toFixed(0)}% of your budget. Only ${formatCurrency(remaining, displayCurrency)} remaining.`;
      } else if (level === "75") {
        title = "📊 Budget Alert";
        message = `You've used ${usedPercentage.toFixed(0)}% of your budget. ${formatCurrency(remaining, displayCurrency)} remaining.`;
      }

      try {
        // Show push notification
        await sendBudgetNotification(title, message);

        // Also show alert for immediate feedback
        Alert.alert(title, message, [{ text: "OK" }]);
      } finally {
        budgetWarningInFlightRef.current.delete(warningKey);
      }
      
    } catch (error) {
      // Silent fail for notifications
      console.log('Notification check failed:', error);
    }
  }, [displayCurrency]);

  const sendBudgetNotification = async (title: string, body: string) => {
    try {
      // Request permissions (iOS)
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Schedule immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'budget_warning' },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      console.log('Budget notification sent:', title);
    } catch (error) {
      console.log('Failed to send notification:', error);
    }
  };

  const loadDashboard = useCallback(async (options?: { skipBudgetWarnings?: boolean }) => {
    try {
      setError("");
      const currentPeriod = formatDateYYYYMMDD(new Date()).slice(0, 7);
      const [meRes, dashboardRes, categoriesRes, transactionsRes, budgetsRes] =
        await Promise.all([
          authService.me(),
          reportService.getDashboard({ walletId: selectedWalletId ?? undefined }),
          categoryService.listCategories(),
          transactionService.listTransactions({
            limit: 20,
            offset: 0,
            walletId: selectedWalletId ?? undefined,
          }),
          budgetService.listBudgets({
            period: currentPeriod,
            walletId: selectedWalletId ?? undefined,
          }) // Current period (local date)
        ]);

      setUserName(meRes.username || "");
      setCategoryStats(dashboardRes.categoryStats || []);
      setCategories(categoriesRes);

      const uiTx: Transaction[] = (transactionsRes || []).map((t) => {
        const amountNum =
          typeof t.amount === "string" ? Number(t.amount) : Number(t.amount);
        const txType =
          t.category_type === "income" || t.category_type === "expense"
            ? t.category_type
            : "expense";
        return {
          id: String(t.id),
          amount: amountNum,
          category: t.category_name || "Unknown",
          date: new Date(t.transaction_date),
          type: txType,
          description: t.description || "",
        };
      });

      setTransactions(uiTx);

      // If this wallet has no transactions yet, show the wallet's current balance
      // (user may have set it manually in Wallets screen).
      setTotalBalance(uiTx.length === 0 ? walletBalanceFromStore : Number(dashboardRes.balance) || 0);
      
      // Calculate total income and expenses
      const income = uiTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = uiTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const savings = income - expense;
      const savingsRatePercent = income > 0 ? (savings / income) * 100 : 0;
      
      setTotalIncome(income);
      setTotalExpense(expense);
      setTotalSavings(savings);
      setSavingsRate(savingsRatePercent);

      const resolvedWalletId = selectedWalletId ?? defaultWalletId;

      // Budgets are wallet-scoped.
      // Dashboard does not support "All wallets" (multi-currency ambiguity).
      if (!resolvedWalletId) {
        setMonthlyBudget(0);
        setBudgetUsed(0);
        setBudgetRemaining(0);
        setBudgetUsedPercentage(0);
      } else {
        // Calculate budget from real budgets or default
        const totalBudgetFromAPI = (budgetsRes || []).reduce(
          (sum: number, budget: any) => sum + Number(budget.amount),
          0,
        );

        // If no budgets set, use default (70% of income)
        const actualBudget = totalBudgetFromAPI > 0 ? totalBudgetFromAPI : income * 0.7;
        const used = expense;
        const remaining = actualBudget - used;
        const usedPercentage = actualBudget > 0 ? (used / actualBudget) * 100 : 0;

        setMonthlyBudget(actualBudget);
        setBudgetUsed(used);
        setBudgetRemaining(remaining);
        setBudgetUsedPercentage(usedPercentage);

        // Check for budget warnings
        if (!options?.skipBudgetWarnings) {
          checkBudgetWarnings(usedPercentage, remaining);
        }
      }
      
      // Calculate category spending
      const expenseByCategory = uiTx
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const existing = acc.find(item => item.name === t.category);
          if (existing) {
            existing.amount += t.amount;
          } else {
            acc.push({ name: t.category, amount: t.amount, percentage: 0 });
          }
          return acc;
        }, [] as Array<{ name: string; amount: number; percentage: number }>);
      
      // Calculate percentages
      const categoryWithPercentages = expenseByCategory.map(cat => ({
        ...cat,
        percentage: expense > 0 ? (cat.amount / expense) * 100 : 0
      }));
      
      // Sort by amount and take top 6
      const topCategories = categoryWithPercentages
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);
      
      setCategorySpending(topCategories);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  }, [checkBudgetWarnings, defaultWalletId, selectedWalletId, walletBalanceFromStore]);

  // Listen for sync events
  useEffect(() => {
    const unsubscribeTransactions = subscribe(
      SyncEvent.TRANSACTION_CREATED,
      (data) => {
        console.log('Transaction created, refreshing dashboard');
        const skipBudgetWarnings = data?.type === 'income';
        loadDashboard({ skipBudgetWarnings });
        refreshWallets().catch(() => undefined);
      }
    );

    const unsubscribeCategories = subscribe(
      SyncEvent.CATEGORY_CREATED,
      () => {
        console.log('Category created, refreshing dashboard');
        loadDashboard();
      }
    );

    const unsubscribeCategoriesUpdated = subscribe(
      SyncEvent.CATEGORY_UPDATED,
      () => {
        console.log('Category updated, refreshing dashboard');
        loadDashboard();
      }
    );

    const unsubscribeCategoriesDeleted = subscribe(
      SyncEvent.CATEGORY_DELETED,
      () => {
        console.log('Category deleted, refreshing dashboard');
        loadDashboard();
      }
    );

    return () => {
      unsubscribeTransactions?.();
      unsubscribeCategories?.();
      unsubscribeCategoriesUpdated?.();
      unsubscribeCategoriesDeleted?.();
    };
  }, [loadDashboard, subscribe]);

  // Refresh when dashboard refresh key changes
  useEffect(() => {
    loadDashboard();
  }, [dashboardRefreshKey, loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  // Handlers
  const handleOpenModal = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSaveTransaction = async (
    amount: number,
    category: string,
    date: Date,
    type: TransactionType,
  ) => {
    setError("");

    const walletIdToUse = selectedWalletId ?? defaultWalletId;
    if (!walletIdToUse) {
      setError(
        "Chưa có ví mặc định. Vui lòng tạo ví và đặt làm mặc định trước khi thêm giao dịch.",
      );
      return;
    }

    const categoryId = categoryIdByTypeAndName.get(
      `${type}:${category.toLowerCase()}`,
    );
    if (!categoryId) {
      setError(`Không tìm thấy danh mục trên hệ thống: ${category}`);
      return;
    }

    try {
      await transactionService.createTransaction({
        category_id: categoryId,
        wallet_id: walletIdToUse,
        amount,
        transaction_date: formatDateYYYYMMDD(date),
        description: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      await refreshWallets();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      const msg = getApiErrorMessage(e);
      if (msg.toLowerCase().includes("wallet_id is required")) {
        setError(
          "Thiếu ví. Vui lòng tạo ví và đặt làm mặc định, sau đó thử lại.",
        );
      } else {
        setError(msg);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const lineChartData = useMemo(() => {
    const top = (categoryStats || [])
      .slice()
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 6);

    if (top.length === 0) {
      return {
        labels: ["-"],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }

    return {
      labels: top.map((s) =>
        s.name.length > 6 ? `${s.name.slice(0, 6)}…` : s.name,
      ),
      datasets: [
        {
          data: top.map((s) => Number(s.total) || 0),
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [categoryStats]);

  const pieChartData = useMemo(() => {
    if (categorySpending.length === 0) {
      return [
        {
          name: "No data",
          population: 1,
          color: "#E5E7EB",
          legendFontColor: "#6B7280",
          legendFontSize: 12,
        },
      ];
    }

    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"
    ];

    return categorySpending.map((cat, index) => ({
      name: cat.name,
      population: cat.amount,
      color: colors[index % colors.length],
      legendFontColor: "#374151",
      legendFontSize: 12,
    }));
  }, [categorySpending]);

  const barChartData = useMemo(() => {
    if (categorySpending.length === 0) {
      return {
        labels: ["-"],
        datasets: [
          {
            data: [0],
          },
        ],
      };
    }

    return {
      labels: categorySpending.map(cat => 
        cat.name.length > 8 ? `${cat.name.slice(0, 8)}…` : cat.name
      ),
      datasets: [
        {
          data: categorySpending.map(cat => cat.amount),
        },
      ],
    };
  }, [categorySpending]);

  const chartConfig = {
    backgroundGradientFrom: "#3b82f6",
    backgroundGradientTo: "#2563eb",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "6", strokeWidth: "2", stroke: "#2563eb" },
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4 bg-white shadow-sm border-b border-gray-100 z-10">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500 font-medium">
                Xin chào
              </Text>
              <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                {userName || "-"}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-blue-100 px-3 py-2 rounded-full flex-row items-center"
              onPress={() => setWalletPickerVisible(true)}
            >
              <Wallet size={20} color="#2563eb" />
              <Text className="ml-2 text-blue-700 font-semibold">
                {selectedWalletLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={walletPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setWalletPickerVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-6"
            onPress={() => setWalletPickerVisible(false)}
          >
            <Pressable className="bg-white rounded-2xl overflow-hidden">
              <View className="px-5 py-4 border-b border-gray-100">
                <Text className="text-base font-bold text-gray-900">
                  Chọn ví
                </Text>
              </View>

              {(wallets || []).map((w) => (
                <TouchableOpacity
                  key={String(w.id)}
                  className="px-5 py-4 border-t border-gray-100 flex-row items-center justify-between"
                  onPress={() => {
                    setSelectedWalletId(w.id);
                    setWalletPickerVisible(false);
                  }}
                >
                  <View>
                    <Text className="text-gray-900 font-semibold">{w.name}</Text>
                    <Text className="text-gray-500 text-xs">
                      {formatCurrency(Number(w.balance) || 0, w.currency)}
                    </Text>
                  </View>
                  {selectedWalletId === w.id ? (
                    <Text className="text-blue-600 font-semibold">Đang chọn</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Financial Overview Cards */}
        <View className="px-6 py-6">
          <View className="grid grid-cols-2 gap-4 mb-6">
            {/* Total Balance Card */}
            <View className="col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 shadow-xl">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-black text-base font-medium">
                  Tổng số dư
                </Text>
                <Wallet size={20} />
              </View>
              <Text className="text-3xl font-bold mb-2">
                {formatCurrency(totalBalance, displayCurrency)}
              </Text>
              <View className="flex-row items-center">
                <TrendingUp size={16} color="#10B981" />
                <Text className="text-green-300 ml-2 text-sm font-medium">
                  +{savingsRate.toFixed(1)}% tỷ lệ tiết kiệm
                </Text>
              </View>
            </View>

            {/* Income Card */}
            <View className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <DollarSign size={20} color="#16a34a" />
                <Text className="text-xs text-green-600 font-medium">+12%</Text>
              </View>
              <Text className="text-green-900 text-xl font-bold">
                {formatCurrency(totalIncome, displayCurrency)}
              </Text>
              <Text className="text-green-700 text-sm mt-1">Thu nhập</Text>
            </View>

            {/* Expense Card */}
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <CreditCard size={20} color="#dc2626" />
                <Text className="text-xs text-red-600 font-medium">+8%</Text>
              </View>
              <Text className="text-red-900 text-xl font-bold">
                {formatCurrency(totalExpense, displayCurrency)}
              </Text>
              <Text className="text-red-700 text-sm mt-1">Chi tiêu</Text>
            </View>

            {/* Savings Card */}
            <View className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <PiggyBank size={20} color="#8B5CF6" />
                <Text className="text-xs text-purple-600 font-medium">
                  {savingsRate > 0 ? 'Tốt' : 'Thấp'}
                </Text>
              </View>
              <Text className="text-purple-900 text-xl font-bold">
                {formatCurrency(totalSavings, displayCurrency)}
              </Text>
              <Text className="text-purple-700 text-sm mt-1">Tiết kiệm</Text>
            </View>

            {/* Budget Card */}
            <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Target size={20} color="#F59E0B" />
                <Text className={`text-xs font-medium ${
                  budgetUsedPercentage > 90 ? 'text-red-600' : 
                  budgetUsedPercentage > 70 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {budgetUsedPercentage.toFixed(0)}% đã dùng
                </Text>
              </View>
              <Text className={`text-xl font-bold ${
                budgetRemaining < 0 ? 'text-red-900' : 'text-yellow-900'
              }`}>
                {formatCurrency(Math.abs(budgetRemaining), displayCurrency)}
              </Text>
              <Text className={`text-sm mt-1 ${
                budgetRemaining < 0 ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {budgetRemaining < 0 ? 'Vượt ngân sách' : 'Ngân sách còn lại'}
              </Text>
            </View>

            {/* Savings Rate Card */}
            <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Target size={20} color="#F59E0B" />
                <Text className="text-xs text-orange-600 font-medium">
                  {savingsRate >= 20 ? 'Rất tốt' : savingsRate >= 10 ? 'Tốt' : 'Cần cải thiện'}
                </Text>
              </View>
              <Text className="text-orange-900 text-xl font-bold">
                {savingsRate.toFixed(1)}%
              </Text>
              <Text className="text-orange-700 text-sm mt-1">Tỷ lệ tiết kiệm</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
              Thao tác nhanh
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => handleOpenModal("income")}
                className="flex-1 bg-white p-4 rounded-2xl shadow-sm mr-3 items-center border border-gray-100 active:bg-gray-50"
              >
                <View className="bg-green-100 p-3 rounded-full mb-3 shadow-sm">
                  <DollarSign size={24} color="#16a34a" />
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Thêm thu nhập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenModal("expense")}
                className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center border border-gray-100 active:bg-gray-50"
              >
                <View className="bg-red-100 p-3 rounded-full mb-3 shadow-sm">
                  <CreditCard size={24} color="#dc2626" />
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Thêm chi tiêu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spending by Category - Pie Chart */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
              Chi tiêu theo danh mục
            </Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 72}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
          </View>

          {/* Category Breakdown */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
              Danh mục nổi bật
            </Text>
            {categorySpending.slice(0, 4).map((cat, index) => (
              <View key={cat.name} className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"][index % 4] }}
                  />
                  <Text className="text-sm text-gray-700">{cat.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-gray-900">
                    {formatCurrency(cat.amount, displayCurrency)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {cat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recent Transactions */}
          <RecentTransactions transactions={transactions} currency={displayCurrency} />

          {!!error && (
            <View className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <Text className="text-red-700 text-sm font-medium">{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
        initialType={modalType}
        categories={categories}
      />
    </SafeAreaView>
  );
}
