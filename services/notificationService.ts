import { apiClient } from "./apiClient";

export type NotificationPreferences = {
  user_id: number;
  enabled: boolean;
  daily_time: string;
  timezone: string;
  daily_reminder_enabled: boolean;
  daily_summary_enabled: boolean;
  budget_warning_enabled: boolean;
};

export async function getPreferences(): Promise<NotificationPreferences> {
  const res = await apiClient.get("/notifications/preferences");
  return res.data as NotificationPreferences;
}

export async function updatePreferences(
  input: Partial<NotificationPreferences>,
): Promise<void> {
  await apiClient.put("/notifications/preferences", input);
}

export async function upsertDeviceToken(input: {
  token: string;
  platform: "ios" | "android";
}): Promise<void> {
  await apiClient.post("/notifications/device-token", input);
}

export async function deleteDeviceToken(input: {
  token: string;
}): Promise<void> {
  await apiClient.delete("/notifications/device-token", { data: input });
}
