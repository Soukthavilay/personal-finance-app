import { apiClient } from "./apiClient";

export type TransferDto = {
  id: number;
  user_id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  amount: string | number;
  transfer_date: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;

  from_wallet_name?: string;
  to_wallet_name?: string;
};

export type ListTransfersParams = {
  walletId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export async function listTransfers(
  params: ListTransfersParams = {},
): Promise<TransferDto[]> {
  const query: Record<string, string | number> = {};
  if (params.walletId !== undefined) query.walletId = params.walletId;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  if (params.limit !== undefined) query.limit = params.limit;
  if (params.offset !== undefined) query.offset = params.offset;

  const res = await apiClient.get("/transfers", { params: query });
  return res.data as TransferDto[];
}

export async function createTransfer(input: {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  transfer_date: string;
  description?: string;
}): Promise<TransferDto> {
  const res = await apiClient.post("/transfers", input);
  return res.data as TransferDto;
}

export async function updateTransfer(
  id: number,
  input: {
    from_wallet_id: number;
    to_wallet_id: number;
    amount: number;
    transfer_date: string;
    description?: string;
  },
): Promise<void> {
  await apiClient.put(`/transfers/${id}`, input);
}

export async function deleteTransfer(id: number): Promise<void> {
  await apiClient.delete(`/transfers/${id}`);
}
