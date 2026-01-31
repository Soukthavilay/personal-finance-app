import { ArrowLeft, Plus, Star, Trash2, Pencil } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { walletService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/utils/formatting";

type WalletFormState = {
  id?: number;
  name: string;
  type: string;
  currency: string;
  balance: string;
};

const DEFAULT_FORM: WalletFormState = {
  name: "",
  type: "cash",
  currency: "VND",
  balance: "0",
};

export default function WalletsScreen() {
  const router = useRouter();

  const wallets = useWalletStore((s) => s.wallets);
  const defaultWalletId = useWalletStore((s) => s.defaultWalletId);
  const selectedWalletId = useWalletStore((s) => s.selectedWalletId);
  const setWallets = useWalletStore((s) => s.setWallets);
  const setSelectedWalletId = useWalletStore((s) => s.setSelectedWalletId);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState<WalletFormState>(DEFAULT_FORM);

  const reloadWallets = React.useCallback(async () => {
    const list = await walletService.listWallets();
    setWallets(list || []);
  }, [setWallets]);

  React.useEffect(() => {
    setLoading(true);
    setError("");
    reloadWallets()
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [reloadWallets]);

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setModalVisible(true);
  };

  const openEdit = (w: walletService.Wallet) => {
    setForm({
      id: w.id,
      name: w.name,
      type: w.type,
      currency: w.currency,
      balance: String(w.balance ?? 0),
    });
    setModalVisible(true);
  };

  const saveWallet = async () => {
    setError("");
    const name = form.name.trim();
    const type = form.type.trim();
    const currency = form.currency.trim();
    const balanceNum = Number(form.balance);

    if (!name) {
      setError("Wallet name is required");
      return;
    }
    if (!type) {
      setError("Wallet type is required");
      return;
    }
    if (!currency) {
      setError("Currency is required");
      return;
    }
    if (Number.isNaN(balanceNum)) {
      setError("Balance must be a number");
      return;
    }

    setLoading(true);
    try {
      if (form.id) {
        await walletService.updateWallet(form.id, {
          name,
          type,
          currency,
          balance: balanceNum,
        });
      } else {
        await walletService.createWallet({
          name,
          type,
          currency,
          balance: balanceNum,
        });
      }

      await reloadWallets();
      setModalVisible(false);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const setAsDefault = async (walletId: number) => {
    setError("");
    setLoading(true);
    try {
      await walletService.updateWallet(walletId, { is_default: 1 });
      await reloadWallets();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteWallet = async (walletId: number) => {
    Alert.alert("Xoá ví", "Bạn có chắc muốn xoá ví này không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          setError("");
          setLoading(true);
          try {
            await walletService.deleteWallet(walletId);
            await reloadWallets();

            if (selectedWalletId === walletId) {
              setSelectedWalletId(null);
            }
          } catch (e) {
            setError(getApiErrorMessage(e));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-100 px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ArrowLeft size={20} color="#111827" />
          <Text className="ml-2 text-base font-semibold text-gray-900">
            Quay lại
          </Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-900">Ví</Text>

        <TouchableOpacity
          onPress={openCreate}
          className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="ml-2 text-white font-semibold">Thêm</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="px-6 py-3">
          <Text className="text-red-600">{error}</Text>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Danh sách ví
          </Text>

          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {(wallets || []).length === 0 ? (
              <View className="px-4 py-6">
                <Text className="text-gray-600">Chưa có ví nào.</Text>
              </View>
            ) : null}

            {(wallets || []).map((w) => {
              const isDefault = w.id === defaultWalletId;
              return (
                <View
                  key={String(w.id)}
                  className="px-4 py-4 border-b border-gray-50"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold text-gray-900">
                          {w.name}
                        </Text>
                        {isDefault ? (
                          <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                            <Text className="text-green-700 text-xs font-semibold">
                              Mặc định
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-gray-500 text-xs mt-1">
                        {w.type} • {w.currency}
                      </Text>
                      <Text className="text-gray-900 font-bold mt-2">
                        {formatCurrency(Number(w.balance) || 0, w.currency)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <TouchableOpacity
                        disabled={loading}
                        onPress={() => openEdit(w)}
                        className="bg-gray-100 p-2 rounded-xl mr-2"
                        style={{ opacity: loading ? 0.6 : 1 }}
                      >
                        <Pencil size={18} color="#111827" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={loading}
                        onPress={() => setAsDefault(w.id)}
                        className="bg-yellow-100 p-2 rounded-xl mr-2"
                        style={{ opacity: loading ? 0.6 : 1 }}
                      >
                        <Star size={18} color="#B45309" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={loading}
                        onPress={() => deleteWallet(w.id)}
                        className="bg-red-100 p-2 rounded-xl"
                        style={{ opacity: loading ? 0.6 : 1 }}
                      >
                        <Trash2 size={18} color="#B91C1C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {loading ? (
            <Text className="text-gray-500 mt-4">Đang tải...</Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-2xl overflow-hidden">
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-base font-bold text-gray-900">
                {form.id ? "Chỉnh sửa ví" : "Thêm ví"}
              </Text>
            </View>

            <View className="px-5 py-4">
              <Text className="text-xs font-semibold text-gray-500 mb-1">
                Tên ví
              </Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((s) => ({ ...s, name: v }))}
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="Tiền mặt"
              />

              <Text className="text-xs font-semibold text-gray-500 mb-1 mt-4">
                Loại
              </Text>
              <TextInput
                value={form.type}
                onChangeText={(v) => setForm((s) => ({ ...s, type: v }))}
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="cash"
              />

              <Text className="text-xs font-semibold text-gray-500 mb-1 mt-4">
                Tiền tệ
              </Text>
              <TextInput
                value={form.currency}
                onChangeText={(v) => setForm((s) => ({ ...s, currency: v }))}
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="VND"
              />

              <Text className="text-xs font-semibold text-gray-500 mb-1 mt-4">
                Số dư
              </Text>
              <TextInput
                value={form.balance}
                onChangeText={(v) => setForm((s) => ({ ...s, balance: v }))}
                keyboardType="numeric"
                className="border border-gray-200 rounded-xl px-4 py-3"
                placeholder="0"
              />
            </View>

            <View className="px-5 py-4 border-t border-gray-100 flex-row justify-end">
              <TouchableOpacity
                disabled={loading}
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 mr-2"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-gray-900 font-semibold">Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={saveWallet}
                className="px-4 py-2 rounded-xl bg-blue-600"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white font-semibold">Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
