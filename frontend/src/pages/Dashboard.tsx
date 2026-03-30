import { useTasks, useWorkOrders } from "@/hooks";
import { TaskCard } from "@/components/TaskCard";
import { StatCard } from "@/components/StatCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { CreateWorkOrderModal } from "@/components/CreateWorkOrderModal";
import { useAuthContext } from "@/providers/authProvider";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  PlusCircle,
  FolderPlus,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: workOrders = [], isLoading: woLoading } = useWorkOrders();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWOModalOpen, setIsWOModalOpen] = useState(false);

  // Statistiques
  const urgentTasksCount = tasks.filter(
    (t) => t.priority >= 3 && t.status !== "COMPLETED",
  ).length;
  const todoTasksCount = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS",
  ).length;
  const completedTasksCount = tasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  const totalHoursDecimal = tasks.reduce(
    (acc, t) =>
      acc +
      (t.actualHumanTime || 0) +
      (t.actualMachineTime || 0) +
      (t.actualOilingTime || 0),
    0,
  );

  const totalHours = Math.floor(totalHoursDecimal);
  const totalMinutes = Math.round((totalHoursDecimal - totalHours) * 60);
  const formattedHours = `${totalHours}h${totalMinutes > 0 ? ` ${totalMinutes}m` : ""}`;

  const recentWorkOrders = [...workOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");

  if (tasksLoading || woLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          Chargement des données...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Bonjour {user?.firstName || "Utilisateur"} !
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de l'activité aujourd'hui
        </p>
      </header>

      {/* Cadrans du haut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tâches Urgentes"
          value={urgentTasksCount}
          icon={<AlertCircle className="size-5" />}
          description="PRIORITÉ HAUTE"
          color="destructive"
        />
        <StatCard
          title="À Faire"
          value={todoTasksCount}
          icon={<ClipboardList className="size-5" />}
          description="EN ATTENTE"
          color="primary"
        />
        <StatCard
          title="Heures Total"
          value={formattedHours}
          icon={<Clock className="size-5" />}
          description="TEMPS HUMAIN"
          color="warning"
        />
        <StatCard
          title="Terminées"
          value={completedTasksCount}
          icon={<CheckCircle2 className="size-5" />}
          description="AUJOURD'HUI"
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Section Principale (Tâches) */}
        <div className="xl:col-span-3 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Tâches prioritaires
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {activeTasks.length}
                </Badge>
              </h2>
              <Link
                to="/tasks"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="size-4" />
              </Link>
            </div>

            {activeTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTasks.slice(0, 6).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-50 border-dashed border-2 p-12 text-center">
                <p className="text-muted-foreground italic">
                  Aucune tâche assignée pour le moment.
                </p>
              </Card>
            )}
          </section>
        </div>

        {/* Section de Droite (Actions & Dossiers Récents) */}
        <div className="space-y-8">
          {/* Actions Rapides */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Actions Rapides
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Button
                className="w-full justify-start h-12 gap-3 rounded-xl"
                size="lg"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <PlusCircle className="size-5" />
                Nouvelle tâche
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 gap-3 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary"
                size="lg"
                onClick={() => setIsWOModalOpen(true)}
              >
                <FolderPlus className="size-5" />
                Nouveau dossier
              </Button>
            </div>
          </section>

          {/* Dossiers Récents */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Dossiers Récents
              </h2>
              <Link
                to="/work-orders"
                className="text-[11px] font-bold text-primary uppercase hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <Card className="rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {recentWorkOrders.length > 0 ? (
                  recentWorkOrders.map((wo) => (
                    <Link
                      key={wo.id}
                      to={`/work-orders/${wo.id}`}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group block"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-primary group-hover:underline">
                          {wo.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 leading-tight"
                        >
                          {wo.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                        {wo.customerName}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${wo.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {wo.progress || 0}%
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Aucun dossier récent
                  </div>
                )}
              </div>
            </Card>
          </section>
        </div>
      </div>

      <CreateTaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
      />

      <CreateWorkOrderModal
        open={isWOModalOpen}
        onOpenChange={setIsWOModalOpen}
      />
    </div>
  );
}
