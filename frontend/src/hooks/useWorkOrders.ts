import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkOrderService } from "@/services";
import type { CreateWorkOrderDto, UpdateWorkOrderDto } from "@/types";

export const workOrderKeys = {
  all: ["work-orders"] as const,
  list: (params?: { search?: string }) => ["work-orders", "list", params] as const,
  detail: (id: string) => ["work-orders", "detail", id] as const,
};

export function useWorkOrders(params?: { search?: string }) {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => WorkOrderService.getAll(params),
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => WorkOrderService.getById(id),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWorkOrderDto) => WorkOrderService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkOrderDto }) =>
      WorkOrderService.update(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(workOrderKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => WorkOrderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}
