import {
    CreditCard,
    DollarSign,
    TrendingUp,
    Wallet,
} from "lucide-react-native";
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
import React, { useState } from "react";

import {
    RecentTransactions,
    Transaction,
} from "@/components/RecentTransactions";
import {
    TransactionModal,
    TransactionType,
} from "@/components/TransactionModal";
import { formatCurrency } from "@/utils/formatting";

export default function HomeScreen() {
  const screenWidth = Dimensions.get("window").width;

  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      category: "Food",
      amount: 45.0,
      date: new Date(2023, 5, 20),
      type: "expense",
    },
    {
      id: "2",
      category: "Salary",
      amount: 3500.0,
      date: new Date(2023, 5, 18),
      type: "income",
    },
    {
      id: "3",
      category: "Shopping",
      amount: 120.5,
      date: new Date(2023, 5, 15),
      type: "expense",
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("expense");

  // Derived State: Total Balance (Mock starting balance + transactions)
  const startingBalance = 24562.0;
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === "income" ? acc + curr.amount : acc - curr.amount;
  }, startingBalance);

  // Handlers
  const handleOpenModal = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSaveTransaction = (
    amount: number,
    category: string,
    date: Date,
    type: TransactionType,
  ) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      category,
      amount,
      date,
      type,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

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
                John Doe
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
