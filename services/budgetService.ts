import { apiClient } from "./apiClient";

export type BudgetDto = {
  id: number;
  user_id: number;
  wallet_id: number;
  category_id: number;
  amount: string | number;
  period: string;
  created_at?: string;
  category_name?: string;
};

export async function listBudgets(params?: {
  period?: string;
  walletId?: number;
}): Promise<BudgetDto[]> {
  const res = await apiClient.get("/budgets", { params });
  return res.data as BudgetDto[];
}

export async function createBudget(input: {
  wallet_id: number;
  category_id: number;
  amount: number;
  period: string;
}): Promise<BudgetDto> {
  const res = await apiClient.post("/budgets", input);
  return res.data as BudgetDto;
}

export async function updateBudget(
  id: number,
  input: { wallet_id: number; amount: number; category_id?: number },
): Promise<void> {
  await apiClient.put(`/budgets/${id}`, input);
}

export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
