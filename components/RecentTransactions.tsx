import { formatCurrency } from "@/utils/formatting";
import {
    Briefcase,
    Coffee,
    DollarSign,
    Film,
    Gift,
    Heart,
    Home,
    ShoppingBag,
    Zap
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { TransactionType } from "./TransactionModal";

export interface Transaction {
  id: string;
  category: string;
  amount: number;
  date: Date;
  type: TransactionType;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const getIconForCategory = (category: string) => {
  switch (category) {
    case "Shopping":
      return <ShoppingBag size={20} color="#6366f1" />;
    case "Food":
      return <Coffee size={20} color="#f59e0b" />;
    case "Rent":
    case "Housing":
      return <Home size={20} color="#3b82f6" />;
    case "Utilities":
      return <Zap size={20} color="#eab308" />;
    case "Health":
      return <Heart size={20} color="#ec4899" />;
    case "Entertainment":
      return <Film size={20} color="#8b5cf6" />;
    case "Salary":
    case "Freelance":
      return <Briefcase size={20} color="#10b981" />;
    case "Gift":
      return <Gift size={20} color="#f43f5e" />;
    default:
      return <DollarSign size={20} color="#6b7280" />;
  }
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <View className="mx-6 mb-6 p-6 bg-white rounded-2xl items-center justify-center border border-gray-100 border-dashed">
        <Text className="text-gray-400 font-medium">
          No recent transactions
        </Text>
      </View>
    );
  }

  return (
    <View className="mx-6 mb-6">
      <Text className="text-lg font-bold text-gray-800 mb-4">
        Recent Transactions
      </Text>
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.map((transaction, index) => {
          const isExpense = transaction.type === "expense";
          const isLast = index === transactions.length - 1;

          return (
            <View
              key={transaction.id}
              className={`flex-row items-center justify-between p-4 ${!isLast ? "border-b border-gray-50" : ""}`}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isExpense ? "bg-orange-50" : "bg-green-50"}`}
                >
                  {getIconForCategory(transaction.category)}
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold">
                    {transaction.category}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {transaction.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text
                  className={`font-bold ${isExpense ? "text-red-500" : "text-green-600"}`}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
