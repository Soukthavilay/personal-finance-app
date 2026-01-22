import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
// Using inline colors for simplicity if theme constant isn't fully defined yet, or fallback

export type TransactionType = "income" | "expense";

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    amount: number,
    category: string,
    date: Date,
    type: TransactionType,
  ) => void;
  initialType: TransactionType;
}

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Rent",
    "Shopping",
    "Utilities",
    "Health",
    "Entertainment",
  ],
};

export function TransactionModal({
  visible,
  onClose,
  onSave,
  initialType,
}: TransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset fields when modal opens (handled by useEffect in parent or just let basic persist)
  // For better UX, we might want to reset locally when visible changes to true.
  React.useEffect(() => {
    if (visible) {
      setAmount("");
      setCategory("");
      setDate(new Date());
    }
  }, [visible]);

  const handleSave = () => {
    if (!amount || !category) return;
    onSave(parseFloat(amount), category, date, initialType);
    onClose();
  };

  const isExpense = initialType === "expense";
  const themeColor = isExpense ? "bg-red-500" : "bg-green-500";
  const textColor = isExpense ? "text-red-500" : "text-green-500";
  const buttonColor = isExpense ? "#ef4444" : "#22c55e";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 min-h-[500px]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-2xl font-bold ${textColor}`}>
                {isExpense ? "Add Expense" : "Add Income"}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <Text className="text-gray-500 text-sm font-medium mb-2">
                AMOUNT
              </Text>
              <View className="flex-row items-center border-b border-gray-200 py-2">
                <Text className={`text-3xl font-bold mr-2 ${textColor}`}>
                  $
                </Text>
                <TextInput
                  className="flex-1 text-4xl font-bold text-gray-900"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Category Selector */}
            <View className="mb-6">
              <Text className="text-gray-500 text-sm font-medium mb-3">
                CATEGORY
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES[initialType].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full border ${
                      category === cat
                        ? `${themeColor} border-transparent`
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        category === cat ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Picker */}
            <View className="mb-8">
              <Text className="text-gray-500 text-sm font-medium mb-3">
                DATE
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200"
              >
                <Calendar size={20} color="#6b7280" className="mr-3" />
                <Text className="text-gray-900 font-medium">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  themeVariant="light"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                  accentColor={buttonColor}
                />
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              className={`w-full py-4 rounded-xl ${themeColor} shadow-lg shadow-black/20`}
              disabled={!amount || !category}
              style={{ opacity: !amount || !category ? 0.7 : 1 }}
            >
              <Text className="text-white text-center font-bold text-lg">
                Save Transaction
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
