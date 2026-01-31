import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { walletService } from "@/services";

type WalletState = {
  wallets: walletService.Wallet[];
  defaultWalletId: number | null;
  selectedWalletId: number | null;
  setWallets: (wallets: walletService.Wallet[]) => void;
  setDefaultWalletId: (id: number | null) => void;
  setSelectedWalletId: (id: number | null) => void;
  refreshWallets: () => Promise<void>;
  reset: () => void;
};

const DEFAULT_STATE: Pick<
  WalletState,
  "wallets" | "defaultWalletId" | "selectedWalletId"
> = {
  wallets: [],
  defaultWalletId: null,
  selectedWalletId: null,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setWallets: (wallets) =>
        set((state) => {
          const toBool = (v: any) => v === true || v === 1 || v === "1";
          const defaultWallet = wallets.find((w) => toBool(w.is_default));
          const defaultWalletId = defaultWallet?.id ?? null;

          const currentSelected = state.selectedWalletId;
          const isFirstLoad = state.wallets.length === 0 && currentSelected === null;
          const nextSelectedWalletId =
            isFirstLoad
              ? defaultWalletId
              : currentSelected === null
                ? null
              : wallets.some((w) => w.id === currentSelected)
                ? currentSelected
                : defaultWalletId;

          return {
            wallets,
            defaultWalletId,
            selectedWalletId: nextSelectedWalletId,
          };
        }),
      setDefaultWalletId: (id) => set(() => ({ defaultWalletId: id })),
      setSelectedWalletId: (id) => set(() => ({ selectedWalletId: id })),
      refreshWallets: async () => {
        const wallets = await walletService.listWallets();
        get().setWallets(wallets);
      },
      reset: () => set(() => ({ ...DEFAULT_STATE })),
    }),
    {
      name: "user-wallets",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        wallets: state.wallets,
        defaultWalletId: state.defaultWalletId,
        selectedWalletId: state.selectedWalletId,
      }),
    },
  ),
);
