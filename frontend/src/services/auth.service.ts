import { apiClient } from "@/lib/api-client";
import type { AuthTokens, LoginCredentials, User } from "@/types";

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const tokens = await apiClient.post<AuthTokens>("/auth/login", credentials);
    apiClient.setToken(tokens.access_token);
    return tokens;
  },

  async logout(): Promise<void> {
    apiClient.clearToken();
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>("/auth/profile");
  },
};
