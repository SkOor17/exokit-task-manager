import { apiClient } from "@/lib/api-client";
import type {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "@/types";
export const AuthService = {
  async register(data: RegisterCredentials): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>("/auth/register", data);
    apiClient.setToken(response.access_token);
    return response;
  },

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>("/auth/login", credentials);
    apiClient.setToken(response.access_token);
    return response;
  },

  async logout(): Promise<void> {
    apiClient.clearToken();
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>("/auth/profile");
  },
};
