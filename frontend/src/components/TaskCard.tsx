// EXAMPLE

import { useMemo, useState } from "react";
import { useUpdateTask, useTimer } from "@/hooks";
import { useAuthContext } from "@/providers/authProvider";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [now] = useState(() => Date.now());

  const { user } = useAuthContext();
  const updateTask = useUpdateTask(task.id);
  const timer = useTimer();

  const isThisTaskRunning = timer.taskId === task.id && timer.isRunning;
  const isThisTaskPaused = timer.taskId === task.id && timer.isPaused;

  const joursRestants = useMemo(() => {
    if (!task.dueDate) return null;
    const diff = Math.ceil(
      (new Date(task.dueDate).getTime() - now) / 86_400_000,
    );
    return diff;
  }, [task.dueDate, now]);

  const handleStartTimer = async () => {
    if (!user?.id) return;
    try {
      await timer.start(task.id, user.id);
    } catch (err) {
      console.error("Impossible de démarrer le timer", err);
    }
  };

  const handlePauseTimer = async () => {
    if (!user?.id) return;
    try {
      await timer.pause(user.id);
    } catch (err) {
      console.error("Impossible de mettre en pause", err);
    }
  };

  const handleStopTimer = async () => {
    if (!user?.id) return;
    try {
      await timer.stop(user.id);
    } catch (err) {
      console.error("Impossible d'arrêter le timer", err);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="font-medium">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.type}</p>

      {joursRestants !== null && (
        <span
          className={
            joursRestants < 2 ? "text-destructive" : "text-muted-foreground"
          }
        >
          {joursRestants > 0 ? `J-${joursRestants}` : "En retard"}
        </span>
      )}

      {/* Affichage timer */}
      {(isThisTaskRunning || isThisTaskPaused) && (
        <div className="font-mono text-lg">{timer.formatted}</div>
      )}

      {/* Actions timer */}
      <div className="flex gap-2 mt-3">
        {timer.isIdle && (
          <button onClick={handleStartTimer} disabled={updateTask.isPending}>
            ▶ Démarrer
          </button>
        )}
        {isThisTaskRunning && (
          <>
            <button onClick={handlePauseTimer}>⏸ Pause</button>
            <button onClick={handleStopTimer}>⏹ Terminer</button>
          </>
        )}
        {isThisTaskPaused && (
          <>
            <button onClick={handleStartTimer}>▶ Reprendre</button>
            <button onClick={handleStopTimer}>⏹ Terminer</button>
          </>
        )}
      </div>
    </div>
  );
}
