import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TasksService } from "@/services";
import type { CreateTaskDto, TaskFilters, UpdateTaskDto } from "@/types";
import { workOrderKeys } from "./useWorkOrders";

// Clés de cache centralisées (évite les fautes de frappe)
export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => ["tasks", "list", filters] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => TasksService.getAll(filters),
    placeholderData: (prev) => prev, // garde les données précédentes pendant le refetch
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => TasksService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTaskDto) => TasksService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDto }) =>
      TasksService.update(id, dto),
    onSuccess: (updatedTask) => {
      // Mise à jour du détail et de la liste
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
    },
  });
}
