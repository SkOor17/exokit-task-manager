import { apiClient } from "@/lib/api-client";
import type { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from "@/types";

export const TasksService = {
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    return apiClient.get<Task[]>("/tasks", {
      params: filters,
    });
  },

  async getById(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(dto: CreateTaskDto): Promise<Task> {
    return apiClient.post<Task>("/tasks", dto);
  },

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}`, dto);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  },
};
