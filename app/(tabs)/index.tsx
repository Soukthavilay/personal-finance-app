import { CreditCard, DollarSign, TrendingUp, Wallet } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import {
  RecentTransactions,
  Transaction,
  TransactionModal,
  TransactionType,
} from "@/components";
import {
  authService,
  categoryService,
  reportService,
  transactionService,
} from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useDataSync, SyncEvent } from "@/contexts/DataSyncContext";
import { formatDateYYYYMMDD } from "@/utils/date";
import { formatCurrency } from "@/utils/formatting";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;
  const { subscribe, dashboardRefreshKey } = useDataSync();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");
  const [error, setError] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<categoryService.Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<
    Array<{ name: string; total: string }>
  >([]);

  const categoryIdByTypeAndName = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((cat) => {
      map.set(`${cat.type}:${cat.name.toLowerCase()}`, cat.id);
    });
    return map;
  }, [categories]);

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const [meRes, dashboardRes, categoriesRes, transactionsRes] =
        await Promise.all([
          authService.me(),
          reportService.getDashboard(),
          categoryService.listCategories(),
          transactionService.listTransactions({ limit: 20, offset: 0 }),
        ]);

      setUserName(meRes.username || "");
      setTotalBalance(Number(dashboardRes.balance) || 0);
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  // Listen for sync events
  useEffect(() => {
    const unsubscribeTransactions = subscribe(
      SyncEvent.TRANSACTION_CREATED,
      () => {
        console.log('Transaction created, refreshing dashboard');
        loadDashboard();
      }
    );

    const unsubscribeCategories = subscribe(
      SyncEvent.CATEGORY_CREATED,
      () => {
        console.log('Category created, refreshing dashboard');
        loadDashboard();
      }
    );

    return () => {
      unsubscribeTransactions?.();
      unsubscribeCategories?.();
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

    const categoryId = categoryIdByTypeAndName.get(
      `${type}:${category.toLowerCase()}`,
    );
    if (!categoryId) {
      setError(`Category not found on backend: ${category}`);
      return;
    }

    try {
      await transactionService.createTransaction({
        category_id: categoryId,
        amount,
        transaction_date: formatDateYYYYMMDD(date),
        description: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const chartData = useMemo(() => {
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4 bg-white shadow-sm border-b border-gray-100 z-10">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500 font-medium">
                Welcome back
              </Text>
              <Text className="text-2xl font-bold text-gray-900 tracking-tight">
                {userName || "-"}
              </Text>
            </View>
            <View className="bg-blue-100 p-2 rounded-full">
              <Wallet size={24} color="#2563eb" />
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View className="m-6 p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-900/20">
          <Text className="text-blue-100 text-base font-medium">
            Total Balance
          </Text>
          <Text className="text-white text-4xl font-bold mt-2 tracking-tight">
            {formatCurrency(totalBalance)}
          </Text>
          <View className="flex-row items-center mt-4 bg-blue-500/50 self-start px-3 py-1.5 rounded-full border border-blue-400/30">
            <TrendingUp size={16} color="#fff" />
            <Text className="text-white ml-2 text-sm font-medium">
              +2.5% this month
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mx-6 mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => handleOpenModal("income")}
              className="flex-1 bg-white p-4 rounded-2xl shadow-sm mr-3 items-center border border-gray-100 active:bg-gray-50"
            >
              <View className="bg-green-100 p-3 rounded-full mb-3 shadow-sm">
                <DollarSign size={24} color="#16a34a" />
              </View>
              <Text className="font-semibold text-gray-700">Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenModal("expense")}
              className="flex-1 bg-white p-4 rounded-2xl shadow-sm ml-3 items-center border border-gray-100 active:bg-gray-50"
            >
              <View className="bg-red-100 p-3 rounded-full mb-3 shadow-sm">
                <CreditCard size={24} color="#dc2626" />
              </View>
              <Text className="font-semibold text-gray-700">Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <RecentTransactions transactions={transactions} />

        {!!error && (
          <View className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <Text className="text-red-700 text-sm font-medium">{error}</Text>
          </View>
        )}

        {/* Chart Section */}
        <View className="mx-6 mb-10">
          <Text className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
            Spending Analysis
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 24,
            }}
          />
        </View>
      </ScrollView>

      {/* Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
        initialType={modalType}
      />
    </SafeAreaView>
  );
}
