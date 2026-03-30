import { useParams, useNavigate } from "react-router-dom";
import { useTask, useUpdateTask } from "@/hooks";
import { useTimer } from "@/providers/timerProvider";
import { useAuthContext } from "@/providers/authProvider";
import {
  ChevronLeft,
  Edit2,
  User,
  Briefcase,
  Calendar,
  Play,
  Pause,
  Square,
  CheckCircle2,
  Droplets,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UpdateTaskModal } from "@/components/UpdateTaskModal";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: task, isLoading, error } = useTask(id!);
  const timer = useTimer();
  const updateTask = useUpdateTask();
  const [now] = useState(() => Date.now());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isThisTaskRunning = timer.taskId === task?.id && timer.isRunning;
  const isThisTaskPaused = timer.taskId === task?.id && timer.isPaused;
  const isAnyTimerRunning = !timer.isIdle;

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const handleStartTimer = async () => {
    if (!user?.id || !task) return;
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

  const handleCompleteTask = async () => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        dto: { status: "COMPLETED", completedAt: new Date().toISOString() },
      });
    } catch (err) {
      console.error("Erreur lors de la validation de la tâche", err);
    }
  };

  const joursRestants = useMemo(() => {
    if (!task?.dueDate) return null;
    const diff = Math.ceil(
      (new Date(task.dueDate).getTime() - now) / 86_400_000,
    );
    return diff;
  }, [now, task]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          Chargement de la tâche...
        </span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive font-semibold">
          Erreur lors du chargement de la tâche
        </p>
        <Button variant="link" onClick={() => navigate("/tasks")}>
          Retour aux tâches
        </Button>
      </div>
    );
  }

  const getPriorityColor = (p: number) => {
    if (p >= 3)
      return "bg-destructive/10 text-destructive border-destructive/20";
    if (p >= 2) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h${m > 0 ? ` ${m.toString().padStart(2, "0")}` : ""}`;
  };

  const formatDecimalHours = (hoursDecimal: number) => {
    const h = Math.floor(hoursDecimal);
    const m = Math.round((hoursDecimal - h) * 60);
    return `${h}h${m > 0 ? ` ${m.toString().padStart(2, "0")}` : ""}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        {isAdminOrManager && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="size-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Task Title and Badges */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 uppercase",
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
            className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 uppercase"
          >
            {task.type}
          </Badge>
          {task.status === "IN_PROGRESS" && (
            <Badge className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20 uppercase">
              En cours
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Dossier
              </p>
              <p className="text-sm font-bold">
                {task.workOrder?.orderNumber || "N/A"} -{" "}
                {task.workOrder?.customerName}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Echéance
              </p>
              <p className="text-sm font-bold text-destructive">
                {task.dueDate
                  ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr })
                  : "N/A"}
                {joursRestants !== null && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({joursRestants}j restants)
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Opérateur
              </p>
              <p className="text-sm font-bold">
                {task.assignedTo
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : "Non assigné"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            Description du kit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {task.kitDescription ||
              task.description ||
              "Aucune description fournie pour cette tâche."}
          </p>
        </CardContent>
      </Card>

      {/* Working Times */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Temps de travail</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50 shadow-none border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white text-indigo-500 shadow-sm">
                <User className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Temps humain
                </p>
                <p className="text-base font-bold">
                  {formatDecimalHours(task.actualHumanTime)}
                  <span className="text-muted-foreground font-normal ml-1">
                    / {formatDecimalHours(task.estimatedHumanTime || 0)} est.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 shadow-none border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white text-blue-500 shadow-sm">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Temps machine
                </p>
                <p className="text-base font-bold">
                  {formatDecimalHours(task.actualMachineTime)}
                  <span className="text-muted-foreground font-normal ml-1">
                    / {formatDecimalHours(task.estimatedMachineTime || 0)} est.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 shadow-none border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white text-orange-500 shadow-sm">
                <Droplets className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Temps huilage
                </p>
                <p className="text-base font-bold">
                  {formatDecimalHours(task.actualOilingTime)}
                  <span className="text-muted-foreground font-normal ml-1">
                    / {formatDecimalHours(task.estimatedOilingTime || 0)} est.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timer Section */}
      <Card className="border-2 border-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Timer en cours
              </p>
              <div className="font-mono text-5xl font-black text-foreground tabular-nums">
                {isThisTaskRunning || isThisTaskPaused
                  ? timer.formatted
                  : "00:00:00"}
              </div>
            </div>

            <div className="flex gap-3">
              {!isThisTaskRunning && !isThisTaskPaused ? (
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-xl text-lg font-bold gap-2"
                  onClick={handleStartTimer}
                  disabled={isAnyTimerRunning}
                >
                  <Play className="size-6 fill-current" />
                  Démarrer
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-14 px-8 rounded-xl text-lg font-bold gap-2 border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100",
                    )}
                    onClick={handlePauseTimer}
                  >
                    {isThisTaskPaused ? (
                      <Play className="size-6 fill-current" />
                    ) : (
                      <Pause className="size-6 fill-current" />
                    )}
                    {isThisTaskPaused ? "Reprendre" : "Pause"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-14 px-8 rounded-xl text-lg font-bold gap-2"
                    onClick={handleStopTimer}
                  >
                    <Square className="size-6 fill-current" />
                    Terminer
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Checklist */}
      {task.checklists && task.checklists.length > 0 ? (
        task.checklists.map((checklist) => {
          const items = checklist.items || [];
          const checkedItems = items.filter((i) => i.checked).length;
          const totalItems = items.length;
          const progress =
            totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

          return (
            <Card key={checklist.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold">
                  {checklist.title}
                </CardTitle>
                <div className="text-xs font-bold text-muted-foreground">
                  {checkedItems}/{totalItems} ({Math.round(progress)}%)
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={cn(
                          "size-5 rounded border flex items-center justify-center transition-colors cursor-pointer",
                          item.checked
                            ? "bg-primary border-primary text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {item.checked && <CheckCircle2 className="size-3.5" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          item.checked
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                        {item.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Checklist qualité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              Aucune checklist pour cette tâche.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Historique des sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {task.timers && task.timers.length > 0 ? (
            task.timers
              .filter((t) => !t.isPaused && t.endTime)
              .sort(
                (a, b) =>
                  new Date(b.startTime).getTime() -
                  new Date(a.startTime).getTime(),
              )
              .map((timerItem, idx) => (
                <div
                  key={timerItem.id}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-slate-50 transition-colors",
                    idx !== (task.timers?.length || 0) - 1 && "border-b",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        timerItem.timeType === "HUMAN"
                          ? "bg-indigo-50 text-indigo-600"
                          : timerItem.timeType === "MACHINE"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600",
                      )}
                    >
                      {timerItem.timeType === "HUMAN" ? (
                        <User className="size-4" />
                      ) : timerItem.timeType === "MACHINE" ? (
                        <Zap className="size-4" />
                      ) : (
                        <Droplets className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {format(new Date(timerItem.startTime), "dd/MM/yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(timerItem.startTime), "HH:mm")} →{" "}
                        {timerItem.endTime
                          ? format(new Date(timerItem.endTime), "HH:mm")
                          : "?"}{" "}
                        -{" "}
                        {timerItem.user
                          ? `${timerItem.user.firstName} ${timerItem.user.lastName}`
                          : "Inconnu"}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-muted-foreground">
                    {formatSeconds(timerItem.duration || 0)}
                  </div>
                </div>
              ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground italic">
              Aucun historique de session.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Button Footer (Mobile style or extra validation) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0 md:mt-10">
        <Button
          variant="default"
          className="w-full h-12 text-base font-bold gap-2 rounded-xl"
          onClick={handleCompleteTask}
          disabled={task.status === "COMPLETED"}
        >
          <CheckCircle2 className="size-5" />
          Marquer comme terminée
        </Button>
      </div>

      <UpdateTaskModal
        task={task}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  );
}
