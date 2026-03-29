import { apiClient } from "../lib/api-client";
import type { User } from "../types";

export const UsersService = {
  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>("/users");
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },
};
