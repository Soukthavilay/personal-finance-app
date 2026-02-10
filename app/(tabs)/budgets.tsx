import { ChevronRight, Plus, Target, TrendingUp, TrendingDown, AlertCircle, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart } from "react-native-chart-kit";

import { authService, budgetService, categoryService, transactionService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/utils/formatting";
import { useDataSync, SyncEvent } from "@/contexts/DataSyncContext";

type Budget = {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  period: string;
  spent: number;
  remaining: number;
  percentage: number;
};

export default function BudgetsScreen() {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.settings.currency);
  const selectedWalletId = useWalletStore((s) => s.selectedWalletId);
  const wallets = useWalletStore((s) => s.wallets);
  const screenWidth = Dimensions.get("window").width;
  const { subscribe, transactionRefreshKey, budgetRefreshKey } = useDataSync();
  
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showAddBudget, setShowAddBudget] = React.useState(false);
  
  // Form states
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [budgetPeriod, setBudgetPeriod] = React.useState(
    new Date().toISOString().slice(0, 7),
  );

  const displayCurrency = React.useMemo(() => {
    if (!selectedWalletId) return currency;
    const w = wallets.find((x) => x.id === selectedWalletId);
    return w?.currency || currency;
  }, [currency, selectedWalletId, wallets]);

  const loadBudgets = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!selectedWalletId) {
        setBudgets([]);
        setCategories([]);
        setError("Please select a wallet to manage budgets.");
        return;
      }
      
      const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
        budgetService.listBudgets({ period: budgetPeriod, walletId: selectedWalletId }),
        categoryService.listCategories(),
        transactionService.listTransactions({
          limit: 1000,
          offset: 0,
          walletId: selectedWalletId,
        }) // Get all transactions
      ]);
      
      setCategories(categoriesRes);
      
      // Filter transactions for current period and expense type only
      const currentPeriodTransactions = (transactionsRes || []).filter((t: any) => {
        // Extract period from transaction_date (format: 2026-01-25)
        const transactionDate = t.transaction_date;
        const transactionPeriod = transactionDate.slice(0, 7); // YYYY-MM
        return transactionPeriod === budgetPeriod && t.category_type === 'expense';
      });
      
      // Calculate spent amount for each budget using real transactions
      const budgetsWithSpending = (budgetsRes || []).map((budget: any) => {
        // Find transactions for this budget's category
        const categoryTransactions = currentPeriodTransactions.filter((t: any) => 
          t.category_id === budget.category_id
        );
        
        // Calculate actual spent amount
        const spent = categoryTransactions.reduce((sum: number, t: any) => {
          const amount = typeof t.amount === 'string' ? Number(t.amount) : t.amount;
          return sum + amount;
        }, 0);
        
        // Ensure budget.amount is a number
        const budgetAmount = typeof budget.amount === 'string' ? Number(budget.amount) : budget.amount;
        const remaining = budgetAmount - spent;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        return {
          ...budget,
          spent,
          remaining,
          percentage,
          amount: budgetAmount // Ensure amount is number
        };
      });
      
      setBudgets(budgetsWithSpending);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [budgetPeriod, selectedWalletId]);

  React.useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Refresh when transactions or budgets change
  React.useEffect(() => {
    const unsubscribeTransactionCreated = subscribe(
      SyncEvent.TRANSACTION_CREATED,
      () => {
        loadBudgets();
      },
    );

    const unsubscribeTransactionUpdated = subscribe(
      SyncEvent.TRANSACTION_UPDATED,
      () => {
        loadBudgets();
      },
    );

    const unsubscribeTransactionDeleted = subscribe(
      SyncEvent.TRANSACTION_DELETED,
      () => {
        loadBudgets();
      },
    );

    const unsubscribeBudgetCreated = subscribe(
      SyncEvent.BUDGET_CREATED,
      () => {
        loadBudgets();
      },
    );

    const unsubscribeBudgetUpdated = subscribe(
      SyncEvent.BUDGET_UPDATED,
      () => {
        loadBudgets();
      },
    );

    const unsubscribeBudgetDeleted = subscribe(
      SyncEvent.BUDGET_DELETED,
      () => {
        loadBudgets();
      },
    );

    return () => {
      unsubscribeTransactionCreated?.();
      unsubscribeTransactionUpdated?.();
      unsubscribeTransactionDeleted?.();
      unsubscribeBudgetCreated?.();
      unsubscribeBudgetUpdated?.();
      unsubscribeBudgetDeleted?.();
    };
  }, [loadBudgets, subscribe]);

  React.useEffect(() => {
    loadBudgets();
  }, [transactionRefreshKey, budgetRefreshKey, loadBudgets]);

  const handleAddBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục và nhập số tiền");
      return;
    }

    if (!selectedWalletId) {
      Alert.alert("Lỗi", "Vui lòng chọn ví trước");
      return;
    }

    try {
      setLoading(true);
      const category = categories.find(c => c.name === selectedCategory);
      if (!category) {
        throw new Error("Không tìm thấy danh mục");
      }

      await budgetService.createBudget({
        wallet_id: selectedWalletId,
        category_id: category.id,
        amount: Number(budgetAmount),
        period: budgetPeriod,
      });

      setShowAddBudget(false);
      setSelectedCategory("");
      setBudgetAmount("");
      loadBudgets();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    Alert.alert(
      "Xoá ngân sách",
      "Bạn có chắc muốn xoá ngân sách này không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await budgetService.deleteBudget(budgetId);
              loadBudgets();
            } catch (err) {
              setError(getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const totalBudget = budgets.reduce((sum, b) => {
    const amount = typeof b.amount === 'string' ? Number(b.amount) : b.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const chartData = {
    labels: budgets.slice(0, 5).map(b => b.category_name.slice(0, 8)),
    datasets: [
      {
        data: budgets.slice(0, 5).map(b => {
          const amount = typeof b.amount === 'string' ? Number(b.amount) : b.amount;
          return isNaN(amount) ? 0 : amount;
        }),
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#3B82F6" },
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Quản lý ngân sách</Text>
        </View>

        <View className="p-4">
          {/* Overview Cards */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Target size={20} color="#3B82F6" />
                <Text className="text-xs text-blue-600 font-medium">
                  {overallPercentage.toFixed(0)}% đã dùng
                </Text>
              </View>
              <Text className="text-blue-900 text-xl font-bold">
                {formatCurrency(isNaN(totalBudget) ? 0 : totalBudget, displayCurrency)}
              </Text>
              <Text className="text-blue-700 text-sm mt-1">Tổng ngân sách</Text>
            </View>

            <View className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <TrendingUp size={20} color="#10B981" />
                <Text className="text-xs text-green-600 font-medium">
                  {totalRemaining >= 0 ? 'Đúng kế hoạch' : 'Vượt ngân sách'}
                </Text>
              </View>
              <Text className={`text-xl font-bold ${
                totalRemaining < 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {formatCurrency(
                  Math.abs(isNaN(totalRemaining) ? 0 : totalRemaining),
                  displayCurrency,
                )}
              </Text>
              <Text className={`text-sm mt-1 ${
                totalRemaining < 0 ? 'text-red-700' : 'text-green-700'
              }`}>
                {totalRemaining < 0 ? 'Vượt ngân sách' : 'Còn lại'}
              </Text>
            </View>
          </View>

          {/* Add Budget Button */}
          <TouchableOpacity
            onPress={() => setShowAddBudget(true)}
            className="bg-blue-600 rounded-2xl p-4 mb-6 flex-row items-center justify-center"
          >
            <Plus size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Thêm ngân sách mới</Text>
          </TouchableOpacity>

          {/* Add Budget Form */}
          {showAddBudget && (
            <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Tạo ngân sách mới</Text>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Danh mục</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-full border ${
                          selectedCategory === cat.name
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          selectedCategory === cat.name ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Số tiền ngân sách</Text>
                <TextInput
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền"
                  className="border border-gray-200 rounded-xl px-4 py-3"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Kỳ</Text>
                <TextInput
                  value={budgetPeriod}
                  onChangeText={setBudgetPeriod}
                  placeholder="2026-01"
                  className="border border-gray-200 rounded-xl px-4 py-3"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowAddBudget(false)}
                  className="flex-1 bg-gray-200 rounded-xl px-4 py-3"
                >
                  <Text className="text-gray-800 text-center font-semibold">Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddBudget}
                  disabled={loading}
                  className="flex-1 bg-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-center font-semibold">Tạo ngân sách</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Budget Chart */}
          {budgets.length > 0 && (
            <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Tổng quan chi tiêu</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                style={{ borderRadius: 16 }}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>
          )}

          {/* Budget List */}
          <View className="space-y-3">
            {budgets.map((budget) => (
              <View key={budget.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="font-semibold text-gray-900">{budget.category_name}</Text>
                    <Text className="text-sm text-gray-500">{budget.period}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteBudget(budget.id)}
                    className="text-red-500"
                  >
                    <Text className="text-sm font-medium">Xoá</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-2">
                  <View className="flex-row justify-between text-sm mb-1">
                    <Text className="text-gray-600">Đã chi: {formatCurrency(budget.spent, displayCurrency)}</Text>
                    <Text className="text-gray-600">{formatCurrency(budget.amount, displayCurrency)}</Text>
                  </View>
                  <View className="w-full bg-gray-200 rounded-full h-2">
                    <View
                      className={`h-2 rounded-full ${
                        budget.percentage > 90 ? 'bg-red-500' :
                        budget.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </View>
                  <Text className={`text-xs mt-2 font-medium ${
                    budget.percentage > 90 ? 'text-red-600' :
                    budget.percentage > 70 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {budget.percentage.toFixed(0)}% đã dùng • Còn {formatCurrency(budget.remaining, displayCurrency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {budgets.length === 0 && !loading && (
            <View className="items-center py-12">
              <Target size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-4">
                Chưa có ngân sách. Hãy tạo ngân sách đầu tiên để theo dõi chi tiêu!
              </Text>
            </View>
          )}

          {!!error && (
            <View className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <Text className="text-red-700 text-sm font-medium">{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
