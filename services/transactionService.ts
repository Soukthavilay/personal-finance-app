import { apiClient } from "./apiClient";

export type TransactionDto = {
  id: number;
  user_id: number;
  category_id: number;
  wallet_id?: number;
  amount: string | number;
  transaction_date: string;
  description?: string | null;
  created_at?: string;
  category_name?: string;
  category_type?: "income" | "expense";
};

export type ListTransactionsParams = {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  walletId?: number;
  limit?: number;
  offset?: number;
};

export async function listTransactions(
  params: ListTransactionsParams = {},
): Promise<TransactionDto[]> {
  const query: Record<string, string | number> = {};
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  if (params.categoryId !== undefined) query.categoryId = params.categoryId;
  if (params.walletId !== undefined) query.walletId = params.walletId;
  if (params.limit !== undefined) query.limit = params.limit;
  if (params.offset !== undefined) query.offset = params.offset;

  const res = await apiClient.get("/transactions", { params: query });
  return res.data as TransactionDto[];
}

export async function getTransaction(id: number): Promise<TransactionDto> {
  const res = await apiClient.get(`/transactions/${id}`);
  return res.data as TransactionDto;
}

export async function createTransaction(input: {
  category_id: number;
  wallet_id: number;
  amount: number;
  transaction_date: string;
  description?: string;
}): Promise<TransactionDto> {
  const res = await apiClient.post("/transactions", input);
  return res.data as TransactionDto;
}

export async function updateTransaction(
  id: number,
  input: {
    category_id: number;
    wallet_id: number;
    amount: number;
    transaction_date: string;
    description?: string;
  },
): Promise<void> {
  await apiClient.put(`/transactions/${id}`, input);
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
