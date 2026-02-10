import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeftRight, Calendar, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useDataSync, SyncEvent } from "@/contexts/DataSyncContext";
import { formatCurrency } from "@/utils/formatting";

type WalletLite = {
  id: number;
  name: string;
  currency?: string;
};

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    fromWalletId: number;
    toWalletId: number;
    amount: number;
    date: Date;
    description?: string;
  }) => void;
  wallets: WalletLite[];
  defaultFromWalletId?: number | null;
  currency?: string;
}

export function TransferModal({
  visible,
  onClose,
  onSave,
  wallets,
  defaultFromWalletId,
  currency,
}: TransferModalProps) {
  const { triggerSync } = useDataSync();

  const [fromWalletId, setFromWalletId] = useState<number | null>(null);
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");

  React.useEffect(() => {
    if (!visible) return;

    const initFrom =
      typeof defaultFromWalletId === "number" ? defaultFromWalletId : null;

    const fallbackFrom =
      initFrom ?? (wallets && wallets[0] ? wallets[0].id : null);

    const fallbackTo =
      wallets && wallets.length > 1
        ? wallets.find((w) => w.id !== fallbackFrom)?.id ?? null
        : null;

    setFromWalletId(fallbackFrom);
    setToWalletId(fallbackTo);
    setAmount("");
    setDate(new Date());
    setDescription("");
  }, [defaultFromWalletId, visible, wallets]);

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const displayCurrency =
    fromWallet?.currency || toWallet?.currency || currency || "VND";

  const handleSave = () => {
    const amountNum = Number(amount);
    if (!fromWalletId || !toWalletId || !Number.isFinite(amountNum) || amountNum <= 0) {
      return;
    }
    if (fromWalletId === toWalletId) return;

    onSave({
      fromWalletId,
      toWalletId,
      amount: amountNum,
      date,
      description: description.trim() ? description.trim() : undefined,
    });

    triggerSync(SyncEvent.TRANSACTION_CREATED, {
      type: "transfer",
      fromWalletId,
      toWalletId,
      amount: amountNum,
      date,
    });

    onClose();
  };

  const chipClass = (active: boolean) =>
    `px-4 py-2 rounded-full border ${
      active ? "bg-blue-600 border-transparent" : "bg-white border-gray-300"
    }`;

  const chipTextClass = (active: boolean) =>
    `font-medium ${active ? "text-white" : "text-gray-700"}`;

  const isValid =
    !!fromWalletId &&
    !!toWalletId &&
    fromWalletId !== toWalletId &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 min-h-[560px]">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <ArrowLeftRight size={22} color="#2563EB" />
                <Text className="text-2xl font-bold text-blue-600 ml-2">
                  Chuyển tiền
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-500 text-sm font-medium mb-2">TỪ VÍ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={`from-${w.id}`}
                    onPress={() => {
                      setFromWalletId(w.id);
                      if (toWalletId === w.id) {
                        const next = wallets.find((x) => x.id !== w.id);
                        setToWalletId(next ? next.id : null);
                      }
                    }}
                    className={chipClass(fromWalletId === w.id)}
                  >
                    <Text className={chipTextClass(fromWalletId === w.id)}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text className="text-gray-500 text-sm font-medium mb-2">ĐẾN VÍ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <View className="flex-row gap-2">
                {wallets
                  .filter((w) => w.id !== fromWalletId)
                  .map((w) => (
                    <TouchableOpacity
                      key={`to-${w.id}`}
                      onPress={() => setToWalletId(w.id)}
                      className={chipClass(toWalletId === w.id)}
                    >
                      <Text className={chipTextClass(toWalletId === w.id)}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>

            <Text className="text-gray-500 text-sm font-medium mb-2">SỐ TIỀN</Text>
            <View className="flex-row items-center border-b border-gray-200 py-2 mb-2">
              <Text className="text-3xl font-bold mr-2 text-blue-600">₫</Text>
              <TextInput
                className="flex-1 text-4xl font-bold text-gray-900"
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
            <Text className="text-xs text-gray-500 mb-6">
              Sẽ chuyển {formatCurrency(Number(amount) || 0, displayCurrency)}
            </Text>

            <Text className="text-gray-500 text-sm font-medium mb-3">NGÀY</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6"
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
              />
            )}

            <Text className="text-gray-500 text-sm font-medium mb-2">GHI CHÚ (TÙY CHỌN)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-6"
              placeholder="Ví dụ: chuyển sang ví chi tiêu"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              onPress={handleSave}
              className="w-full py-4 rounded-xl bg-blue-600 shadow-lg shadow-black/20"
              disabled={!isValid}
              style={{ opacity: isValid ? 1 : 0.7 }}
            >
              <Text className="text-white text-center font-bold text-lg">
                Xác nhận chuyển
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
