import { apiClient } from "./apiClient";

export type Wallet = {
  id: number;
  user_id: number;
  name: string;
  type: string;
  currency: string;
  balance: string | number;
  is_default: number | boolean;
  created_at?: string;
  updated_at?: string;
};

export async function listWallets(): Promise<Wallet[]> {
  const res = await apiClient.get("/wallets");
  return res.data as Wallet[];
}

export async function createWallet(input: {
  name: string;
  type: string;
  currency?: string;
  balance?: number;
  is_default?: number | boolean;
}): Promise<Wallet> {
  const res = await apiClient.post("/wallets", input);
  return res.data as Wallet;
}

export async function updateWallet(
  id: number,
  input: Partial<{
    name: string;
    type: string;
    currency: string;
    balance: number;
    is_default: number | boolean;
  }>,
): Promise<void> {
  await apiClient.put(`/wallets/${id}`, input);
}

export async function deleteWallet(id: number): Promise<void> {
  await apiClient.delete(`/wallets/${id}`);
}
