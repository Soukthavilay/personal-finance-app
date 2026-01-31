import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  RecentTransactions,
  Transaction,
} from "@/components/RecentTransactions";
import {
  TransactionModal,
  TransactionType,
} from "@/components/TransactionModal";
import { categoryService, transactionService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";
import { useDataSync, SyncEvent } from "@/contexts/DataSyncContext";
import { formatDateYYYYMMDD } from "@/utils/date";
import { useWalletStore } from "@/stores/walletStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function TransactionsScreen() {
  const { subscribe, transactionRefreshKey } = useDataSync();
  const defaultWalletId = useWalletStore((s) => s.defaultWalletId);
  const selectedWalletId = useWalletStore((s) => s.selectedWalletId);
  const wallets = useWalletStore((s) => s.wallets);
  const refreshWallets = useWalletStore((s) => s.refreshWallets);
  const appCurrency = useSettingsStore((s) => s.settings.currency);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState<TransactionType>("expense");
  const [categories, setCategories] = React.useState<
    categoryService.Category[]
  >([]);

  const categoryIdByTypeAndName = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) {
      map.set(`${c.type}:${c.name.toLowerCase()}`, c.id);
    }
    return map;
  }, [categories]);

  const fetchData = React.useCallback(async () => {
    setError("");
    const [categoriesRes, transactionsRes] = await Promise.all([
      categoryService.listCategories(),
      transactionService.listTransactions({
        limit: 50,
        offset: 0,
        walletId: selectedWalletId ?? undefined,
      }),
    ]);
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
  }, [selectedWalletId]);

  const displayCurrency = React.useMemo(() => {
    const resolvedWalletId = selectedWalletId ?? defaultWalletId;
    const w = wallets.find((x) => x.id === resolvedWalletId);
    return w?.currency || appCurrency || "USD";
  }, [appCurrency, defaultWalletId, selectedWalletId, wallets]);

  // Listen for sync events
  React.useEffect(() => {
    const unsubscribeTransactionCreated = subscribe(
      SyncEvent.TRANSACTION_CREATED,
      () => {
        console.log("Transaction created, refreshing transactions list");
        fetchData();
        refreshWallets().catch(() => undefined);
      },
    );

    const unsubscribeCategoryCreated = subscribe(
      SyncEvent.CATEGORY_CREATED,
      () => {
        console.log("Category created, refreshing categories list");
        fetchData();
      },
    );

    const unsubscribeCategoryUpdated = subscribe(
      SyncEvent.CATEGORY_UPDATED,
      () => {
        console.log("Category updated, refreshing categories list");
        fetchData();
      },
    );

    const unsubscribeCategoryDeleted = subscribe(
      SyncEvent.CATEGORY_DELETED,
      () => {
        console.log("Category deleted, refreshing categories list");
        fetchData();
      },
    );

    return () => {
      unsubscribeTransactionCreated?.();
      unsubscribeCategoryCreated?.();
      unsubscribeCategoryUpdated?.();
      unsubscribeCategoryDeleted?.();
    };
  }, [fetchData, subscribe]);

  // Refresh when transaction refresh key changes
  React.useEffect(() => {
    fetchData();
  }, [transactionRefreshKey, fetchData]);

  React.useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const openModal = (type: TransactionType) => {
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
        "No default wallet found. Please create a wallet and set it as default before adding transactions.",
      );
      return;
    }
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
        wallet_id: walletIdToUse,
        amount,
        transaction_date: formatDateYYYYMMDD(date),
        description: "",
      });
      setModalVisible(false);
      await fetchData();
      await refreshWallets();
    } catch (e) {
      const msg = getApiErrorMessage(e);
      if (msg.toLowerCase().includes("wallet_id is required")) {
        setError(
          "Missing wallet. Please create a wallet and set it as default, then try again.",
        );
      } else {
        setError(msg);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4 bg-white shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              Transactions
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              disabled={loading || refreshing}
              className="px-3 py-2 rounded-xl bg-gray-100"
              style={{ opacity: loading || refreshing ? 0.6 : 1 }}
            >
              <Text className="text-gray-800 font-semibold">
                {refreshing ? "Refreshing" : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => openModal("income")}
              className="flex-1 bg-green-600 rounded-xl px-4 py-3"
            >
              <Text className="text-white text-center font-semibold">
                Add Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openModal("expense")}
              className="flex-1 bg-red-600 rounded-xl px-4 py-3"
            >
              <Text className="text-white text-center font-semibold">
                Add Expense
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <Text className="text-sm text-gray-500 mt-3">Loading...</Text>
          )}
          {!!error && (
            <Text className="text-sm text-red-600 mt-3">{error}</Text>
          )}
        </View>

        {!loading && transactions.length === 0 ? (
          <View className="mx-6 my-6 p-6 bg-white rounded-2xl border border-gray-100">
            <Text className="text-gray-900 font-semibold text-base">
              No transactions yet
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Add your first income/expense to see it here.
            </Text>
          </View>
        ) : (
          <RecentTransactions transactions={transactions} currency={displayCurrency} />
        )}
      </ScrollView>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
        initialType={modalType}
        categories={categories}
        currency={displayCurrency}
      />
    </SafeAreaView>
  );
}
