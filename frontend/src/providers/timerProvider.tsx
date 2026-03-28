import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient } from "@/lib/socket-client";
import { TimersService } from "@/services";
import { taskKeys } from "@/hooks/useTasks";
import type { Timer } from "@/types";
import { useAuthContext } from "./authProvider";

export type TimerStatus = "idle" | "running" | "paused";

interface TimerState {
  timerId: string | null;
  taskId: string | null;
  elapsed: number;
  status: TimerStatus;
}

interface TimerContextValue extends TimerState {
  formatted: string;
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  start: (taskId: string, userId: string, timeType?: string) => Promise<void>;
  pause: (userId: string) => Promise<void>;
  stop: (userId: string, notes?: string) => Promise<void>;
  restoreActiveTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

/**
 * Timer provider component that manages the state of the active timer and provides functions to start, pause, and stop timers.
 * It listens to WebSocket events to keep the timer state in sync across clients.
 */
export function TimerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuthContext();

  const [state, setState] = useState<TimerState>({
    timerId: null,
    taskId: null,
    elapsed: 0,
    status: "idle",
  });

  // Tick local
  useEffect(() => {
    if (state.status === "running") {
      intervalRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, elapsed: prev.elapsed + 1 }));
      }, 1_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.status]);

  // Sync WebSocket
  // Listen to timer events to update the timer state in real-time across clients
  useEffect(() => {
    const onTimerUpdate = (timer: Timer) => {
      let elapsed = timer.duration || 0;
      if (!timer.isPaused && !timer.endTime) {
        elapsed += Math.floor(
          (Date.now() - new Date(timer.startTime).getTime()) / 1_000,
        );
      }
      setState({
        timerId: timer.id,
        taskId: timer.taskId,
        elapsed,
        status: timer.isPaused ? "paused" : "running",
      });

      // Invalider les tâches pour mettre à jour le statut (IN_PROGRESS / PAUSED)
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    };

    const onStopped = (timer: Timer) => {
      setState({ timerId: null, taskId: null, elapsed: 0, status: "idle" });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(timer.taskId),
      });
    };

    socketClient.on("timer:started", onTimerUpdate);
    socketClient.on("timer:paused", onTimerUpdate);
    socketClient.on("timer:stopped", onStopped);

    return () => {
      socketClient.off("timer:started", onTimerUpdate);
      socketClient.off("timer:paused", onTimerUpdate);
      socketClient.off("timer:stopped", onStopped);
    };
  }, [queryClient]);

  // Restore active timer on mount
  const restoreActiveTimer = useCallback(async () => {
    const active = await TimersService.getActiveTimer();

    if (active && !active.endTime) {
      let elapsed = active.duration || 0;
      if (!active.isPaused) {
        elapsed += Math.floor(
          (Date.now() - new Date(active.startTime).getTime()) / 1_000,
        );
      }
      setState({
        timerId: active.id,
        taskId: active.taskId,
        elapsed,
        status: active.isPaused ? "paused" : "running",
      });
    }
  }, []);

  // Restore active timer when user changes (e.g., on login)
  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      restoreActiveTimer();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer control functions

  // Start a new timer for a task
  const start = useCallback(
    async (taskId: string, userId: string, timeType?: string) => {
      const ack = await socketClient.startTimer(taskId, userId, timeType);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible de démarrer le timer");
    },
    [],
  );

  // Pause the active timer
  const pause = useCallback(
    async (userId: string) => {
      if (!state.timerId) return;
      const ack = await socketClient.pauseTimer(state.timerId, userId);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible de mettre en pause");
    },
    [state.timerId],
  );

  // Stop the active timer with optional notes
  const stop = useCallback(
    async (userId: string, notes?: string) => {
      if (!state.timerId) return;
      const ack = await socketClient.stopTimer(state.timerId, userId, notes);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible d'arrêter le timer");
    },
    [state.timerId],
  );

  // Format the elapsed time and derive status flags for the context value
  const value: TimerContextValue = {
    ...state,
    formatted: formatElapsed(state.elapsed),
    isRunning: state.status === "running",
    isPaused: state.status === "paused",
    isIdle: state.status === "idle",
    start,
    pause,
    stop,
    restoreActiveTimer,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer doit être utilisé dans un TimerProvider");
  return ctx;
}

// Helper function to format elapsed seconds into HH:mm:ss format
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
