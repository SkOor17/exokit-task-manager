import { apiClient } from "@/lib/api-client";
import type {
  WorkOrder,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
} from "@/types";

export const WorkOrderService = {
  async getAll(params?: { search?: string }): Promise<WorkOrder[]> {
    return apiClient.get<WorkOrder[]>("/work-orders", { params });
  },

  async getById(id: string): Promise<WorkOrder> {
    return apiClient.get<WorkOrder>(`/work-orders/${id}`);
  },

  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    return apiClient.post<WorkOrder>("/work-orders", dto);
  },

  async update(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    return apiClient.patch<WorkOrder>(`/work-orders/${id}`, dto);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/work-orders/${id}`);
  },
};
