import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { userService } from "@/services";

export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
export type Language = "vi" | "en";

export type UserSettings = {
  currency: string;
  language: Language;
  date_format: DateFormat;
  week_start_day: number; // 1..7
  monthly_income_target: number | null;
  timezone: string;
};

type SettingsState = {
  settings: UserSettings;
  setSettings: (partial: Partial<UserSettings>) => void;
  setFromProfile: (profile: userService.UserProfile) => void;
  reset: () => void;
};

const DEFAULT_SETTINGS: UserSettings = {
  currency: "VND",
  language: "vi",
  date_format: "YYYY-MM-DD",
  week_start_day: 1,
  monthly_income_target: null,
  timezone: "Asia/Bangkok",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      setFromProfile: (profile) =>
        set(() => ({
          settings: {
            currency: profile.currency || DEFAULT_SETTINGS.currency,
            language: (profile.language ||
              DEFAULT_SETTINGS.language) as Language,
            date_format: (profile.date_format ||
              DEFAULT_SETTINGS.date_format) as DateFormat,
            week_start_day:
              typeof profile.week_start_day === "number"
                ? profile.week_start_day
                : DEFAULT_SETTINGS.week_start_day,
            monthly_income_target:
              typeof profile.monthly_income_target === "number"
                ? profile.monthly_income_target
                : null,
            timezone: profile.timezone || DEFAULT_SETTINGS.timezone,
          },
        })),
      reset: () => set(() => ({ settings: DEFAULT_SETTINGS })),
    }),
    {
      name: "user-settings",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
