import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient } from "@/lib/socket-client";
import { TimersService } from "@/services";
import { taskKeys } from "./useTasks";
import type { Timer } from "@/types";

export type TimerStatus = "idle" | "running" | "paused";

interface TimerState {
  timerId: string | null;
  taskId: string | null;
  elapsed: number; // secondes
  status: TimerStatus;
}

export function useTimer() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<TimerState>({
    timerId: null,
    taskId: null,
    elapsed: 0,
    status: "idle",
  });

  //  Tick local (affichage fluide entre les updates socket)
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

  //  Sync avec les updates du serveur
  useEffect(() => {
    const onTimerUpdate = (timer: Timer) => {
      // Le temps total est la durée accumulée + le segment en cours si non en pause
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
    };

    const onStopped = (timer: Timer) => {
      setState({ timerId: null, taskId: null, elapsed: 0, status: "idle" });
      // Invalide le détail de la tâche pour recharger l'historique
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

  //  Récupération du timer actif au montage
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

  //  Actions
  const start = useCallback(
    async (taskId: string, userId: string, timeType?: string) => {
      const ack = await socketClient.startTimer(taskId, userId, timeType);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible de démarrer le timer");
    },
    [],
  );

  const pause = useCallback(
    async (userId: string) => {
      if (!state.timerId) return;
      const ack = await socketClient.pauseTimer(state.timerId, userId);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible de mettre en pause");
    },
    [state.timerId],
  );

  const stop = useCallback(
    async (userId: string, notes?: string) => {
      if (!state.timerId) return;
      const ack = await socketClient.stopTimer(state.timerId, userId, notes);
      if (!ack.success)
        throw new Error(ack.error ?? "Impossible d'arrêter le timer");
    },
    [state.timerId],
  );

  //  Helpers d'affichage
  const formatted = formatElapsed(state.elapsed);

  return {
    ...state,
    formatted,
    isRunning: state.status === "running",
    isPaused: state.status === "paused",
    isIdle: state.status === "idle",
    start,
    pause,
    stop,
    restoreActiveTimer,
  };
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
