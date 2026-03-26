import { apiClient } from "@/lib/api-client";
import type { Timer } from "@/types";

export const TimersService = {
  async getHistory(taskId: string): Promise<Timer[]> {
    return apiClient.get<Timer[]>(`/timers/task/${taskId}`);
  },

  async getActiveTimer(userId: string): Promise<Timer | null> {
    return apiClient.get<Timer | null>(`/timers/active/${userId}`);
  },
};
