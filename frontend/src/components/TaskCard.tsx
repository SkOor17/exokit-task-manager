import { useMemo, useState } from "react";
import { useTimer, useUpdateTask } from "@/hooks";
import { useAuthContext } from "@/providers/authProvider";
import type { Task } from "@/types";
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const [now] = useState(() => Date.now());
  const { user } = useAuthContext();
  const timer = useTimer();
  const updateTask = useUpdateTask();

  const isThisTaskRunning = timer.taskId === task.id && timer.isRunning;
  const isThisTaskPaused = timer.taskId === task.id && timer.isPaused;
  const isAnyTimerRunning = !timer.isIdle;

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

  const handleComplete = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        dto: { status: "COMPLETED", completedAt: new Date().toISOString() },
      });
      if (onComplete) onComplete(task.id);
    } catch (err) {
      console.error("Erreur lors de la validation de la tâche", err);
    }
  };

  // Badge couleur priorité
  const getPriorityColor = (p: number) => {
    if (p >= 3)
      return "bg-destructive/10 text-destructive border-destructive/20";
    if (p >= 2) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300",
        isThisTaskRunning &&
          "border-primary ring-1 ring-primary/20 bg-primary/5",
        isThisTaskPaused && "border-orange-400 bg-orange-50/30",
      )}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {task.assignedTo
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : "Non assigné"}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Briefcase className="size-3" />
                {task.workOrder?.orderNumber || "CMD-XXXX"}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {task.title}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                "size-2.5 rounded-full",
                task.status === "COMPLETED"
                  ? "bg-green-500"
                  : isThisTaskRunning
                    ? "bg-primary animate-pulse"
                    : isThisTaskPaused
                      ? "bg-orange-500"
                      : "bg-slate-300",
              )}
            />

            {joursRestants !== null && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  joursRestants < 2
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {joursRestants < 0
                  ? "En retard"
                  : joursRestants === 0
                    ? "Aujourd'hui"
                    : `${joursRestants}j restants`}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              getPriorityColor(task.priority),
            )}
          >
            {task.priority >= 3
              ? "HAUTE"
              : task.priority >= 2
                ? "MOYENNE"
                : "BASSE"}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600"
          >
            {task.type}
          </Badge>
          {task.status === "IN_PROGRESS" && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
              En cours
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div
              className={cn(
                "font-mono text-3xl font-bold tracking-tight",
                isThisTaskRunning || isThisTaskPaused
                  ? "text-foreground"
                  : "text-muted-foreground/40",
              )}
            >
              {isThisTaskRunning || isThisTaskPaused
                ? timer.formatted
                : "00:00:00"}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {isThisTaskRunning
                ? "En cours d'exécution..."
                : isThisTaskPaused
                  ? "En pause"
                  : "Prêt à démarrer"}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200"
              onClick={handleComplete}
              disabled={
                isThisTaskRunning ||
                task.status === "COMPLETED" ||
                updateTask.isPending
              }
            >
              <CheckCircle2 className="size-5" />
            </Button>

            {!isThisTaskRunning && !isThisTaskPaused ? (
              <Button
                variant="default"
                size="icon"
                className="size-11 rounded-xl bg-primary hover:bg-primary/90"
                onClick={handleStartTimer}
                disabled={isAnyTimerRunning}
              >
                <Play className="size-5 fill-current" />
              </Button>
            ) : isThisTaskRunning ? (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="icon"
                  className="size-11 rounded-xl bg-orange-500 hover:bg-orange-600"
                  onClick={handlePauseTimer}
                >
                  <Pause className="size-5 fill-current" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="size-11 rounded-xl"
                  onClick={handleStopTimer}
                >
                  <Square className="size-5 fill-current" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="icon"
                  className="size-11 rounded-xl bg-primary hover:bg-primary/90"
                  onClick={handlePauseTimer}
                >
                  <Play className="size-5 fill-current" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="size-11 rounded-xl"
                  onClick={handleStopTimer}
                >
                  <Square className="size-5 fill-current" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
