import { ChevronRight, Plus, Edit2, Trash2, AlertCircle, Tag } from "lucide-react-native";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { categoryService, transactionService } from "@/services";
import { getApiErrorMessage } from "@/services/apiClient";

type Category = {
  id: number;
  name: string;
  type: "income" | "expense";
  created_at?: string;
};

export default function CategoriesScreen() {
  const router = useRouter();
  
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = React.useState("");
  const [categoryType, setCategoryType] = React.useState<"income" | "expense">("expense");

  const loadCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const categoriesRes = await categoryService.listCategories();
      setCategories(categoriesRes || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const checkCategoryUsage = async (categoryId: number): Promise<boolean> => {
    try {
      const transactions = await transactionService.listTransactions({ limit: 1, offset: 0 });
      const hasUsage = (transactions || []).some((t: any) => t.category_id === categoryId);
      return hasUsage;
    } catch {
      return false;
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Please enter category name");
      return;
    }

    try {
      setLoading(true);
      await categoryService.createCategory({
        name: categoryName.trim(),
        type: categoryType,
      });

      setShowAddForm(false);
      setCategoryName("");
      setCategoryType("expense");
      loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) {
      Alert.alert("Error", "Please enter category name");
      return;
    }

    try {
      setLoading(true);
      await categoryService.updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        type: categoryType,
      });

      setEditingCategory(null);
      setCategoryName("");
      setCategoryType("expense");
      loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if category is being used
    const isUsed = await checkCategoryUsage(category.id);
    
    if (isUsed) {
      Alert.alert(
        "Cannot Delete",
        "This category is being used in transactions and cannot be deleted.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await categoryService.deleteCategory(category.id);
              loadCategories();
            } catch (err) {
              setError(getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("expense");
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Categories</Text>
        </View>

        <View className="p-4">
          {/* Add Category Button */}
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-blue-600 rounded-2xl p-4 mb-6 flex-row items-center justify-center"
          >
            <Plus size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Add New Category</Text>
          </TouchableOpacity>

          {/* Add/Edit Form */}
          {showAddForm && (
            <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </Text>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Category Name</Text>
                <TextInput
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholder="e.g. Coffee, Salary, Rent"
                  className="border border-gray-200 rounded-xl px-4 py-3"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setCategoryType("income")}
                    className={`flex-1 rounded-xl px-4 py-3 ${
                      categoryType === "income" ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-200"
                    } border`}
                  >
                    <Text className={`text-center font-semibold ${
                      categoryType === "income" ? "text-green-800" : "text-gray-700"
                    }`}>
                      Income
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCategoryType("expense")}
                    className={`flex-1 rounded-xl px-4 py-3 ${
                      categoryType === "expense" ? "bg-red-100 border-red-300" : "bg-gray-100 border-gray-200"
                    } border`}
                  >
                    <Text className={`text-center font-semibold ${
                      categoryType === "expense" ? "text-red-800" : "text-gray-700"
                    }`}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={cancelForm}
                  className="flex-1 bg-gray-200 rounded-xl px-4 py-3"
                >
                  <Text className="text-gray-800 text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={loading}
                  className="flex-1 bg-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-center font-semibold">
                    {editingCategory ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Income Categories */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Tag size={20} color="#10B981" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Income Categories</Text>
              <Text className="text-sm text-gray-500 ml-2">({incomeCategories.length})</Text>
            </View>
            
            {incomeCategories.length === 0 ? (
              <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center">
                <Text className="text-gray-500 text-center">No income categories yet</Text>
              </View>
            ) : (
              <View className="space-y-2">
                {incomeCategories.map((category) => (
                  <View key={category.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                        <View>
                          <Text className="font-semibold text-gray-900">{category.name}</Text>
                          <Text className="text-sm text-green-600">Income</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => startEdit(category)}
                          className="p-2 bg-blue-100 rounded-lg"
                        >
                          <Edit2 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(category)}
                          className="p-2 bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Expense Categories */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Tag size={20} color="#EF4444" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Expense Categories</Text>
              <Text className="text-sm text-gray-500 ml-2">({expenseCategories.length})</Text>
            </View>
            
            {expenseCategories.length === 0 ? (
              <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center">
                <Text className="text-gray-500 text-center">No expense categories yet</Text>
              </View>
            ) : (
              <View className="space-y-2">
                {expenseCategories.map((category) => (
                  <View key={category.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-3 h-3 rounded-full bg-red-500 mr-3" />
                        <View>
                          <Text className="font-semibold text-gray-900">{category.name}</Text>
                          <Text className="text-sm text-red-600">Expense</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => startEdit(category)}
                          className="p-2 bg-blue-100 rounded-lg"
                        >
                          <Edit2 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(category)}
                          className="p-2 bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

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
