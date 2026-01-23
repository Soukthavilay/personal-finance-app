import axios, { AxiosError } from "axios";
import { getAuthToken } from "./tokenStore";

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: `${baseUrl}/api`,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config: any) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Unknown error";
  const axiosError = error as AxiosError;
  const data = axiosError.response?.data;
  const message =
    data && typeof data.message === "string" ? data.message : undefined;
  return message || axiosError.message || "Request failed";
}
