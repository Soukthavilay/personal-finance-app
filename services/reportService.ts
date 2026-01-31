import { apiClient } from "./apiClient";

export type DashboardStats = {
  income: number;
  expense: number;
  balance: number;
  monthly_income: number;
  monthly_expense: number;
  categoryStats: Array<{ name: string; total: string }>;
};

export async function getDashboard(params?: {
  month?: number;
  year?: number;
  walletId?: number;
}): Promise<DashboardStats> {
  const res = await apiClient.get("/reports/dashboard", { params });
  return res.data as DashboardStats;
}
