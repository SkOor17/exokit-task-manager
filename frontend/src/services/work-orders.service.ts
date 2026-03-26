import { apiClient } from "@/lib/api-client";
import type {
  WorkOrder,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  PaginatedResponse,
} from "@/types";

export const WorkOrderService = {
  async getAll(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WorkOrder>> {
    return apiClient.get<PaginatedResponse<WorkOrder>>("/dossiers", { params });
  },

  async getById(id: string): Promise<WorkOrder> {
    return apiClient.get<WorkOrder>(`/dossiers/${id}`);
  },

  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    return apiClient.post<WorkOrder>("/dossiers", dto);
  },

  async update(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    return apiClient.patch<WorkOrder>(`/dossiers/${id}`, dto);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/dossiers/${id}`);
  },
};
