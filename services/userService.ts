import { apiClient } from "./apiClient";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  currency: string;
  timezone: string;
  avatar_url: string | null;
  monthly_income_target?: number | null;
  language?: "vi" | "en";
  date_format?: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  week_start_day?: number;
  phone?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  last_login_at?: string | null;
  created_at?: string;
};

export async function getMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get("/users/me");
  return res.data?.user as UserProfile;
}

export type UpdateMyProfileInput = Partial<
  Pick<
    UserProfile,
    | "full_name"
    | "currency"
    | "timezone"
    | "avatar_url"
    | "monthly_income_target"
    | "language"
    | "date_format"
    | "week_start_day"
    | "phone"
    | "gender"
    | "dob"
  >
>;

export async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<{ message?: string; user?: UserProfile }> {
  const res = await apiClient.put("/users/me", input);
  return res.data as { message?: string; user?: UserProfile };
}
