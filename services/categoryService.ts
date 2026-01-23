import { apiClient } from "./apiClient";

export type Category = {
  id: number;
  user_id: number;
  name: string;
  type: "income" | "expense";
  created_at?: string;
};

export async function listCategories(): Promise<Category[]> {
  const res = await apiClient.get("/categories");
  return res.data as Category[];
}

export async function createCategory(input: {
  name: string;
  type: "income" | "expense";
}): Promise<Category> {
  const res = await apiClient.post("/categories", input);
  return res.data as Category;
}

export async function updateCategory(
  id: number,
  input: { name: string; type: "income" | "expense" },
): Promise<void> {
  await apiClient.put(`/categories/${id}`, input);
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
