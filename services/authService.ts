import { apiClient } from "./apiClient";
import { clearAuthToken, setAuthToken } from "./tokenStore";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await apiClient.post("/auth/login", { email, password });
  const token: unknown = res.data?.token;
  const user: unknown = res.data?.user;

  if (typeof token !== "string" || !token) {
    throw new Error("Missing token in login response");
  }
  if (!user || typeof user !== "object") {
    throw new Error("Missing user in login response");
  }

  await setAuthToken(token);
  return user as AuthUser;
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<void> {
  await apiClient.post("/auth/register", { username, email, password });
}

export async function me(): Promise<AuthUser> {
  const res = await apiClient.get("/auth/me");
  return res.data?.user as AuthUser;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    await clearAuthToken();
  }
}

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
};

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return res.data as ForgotPasswordResponse;
}

export async function resetPassword(input: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const res = await apiClient.post("/auth/reset-password", input);
  return res.data as { message: string };
}
