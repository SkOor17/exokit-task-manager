import { useParams, useNavigate, Link } from "react-router-dom";
import { useWorkOrder } from "@/hooks";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wo, isLoading, error } = useWorkOrder(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          Chargement du dossier...
        </span>
      </div>
    );
  }

  if (error || !wo) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive font-semibold">
          Erreur lors du chargement du dossier
        </p>
        <Button variant="link" onClick={() => navigate("/work-orders")}>
          Retour aux dossiers
        </Button>
      </div>
    );
  }

  // Calculs des temps totaux
  const totalHuman =
    wo.tasks?.reduce((acc, t) => acc + (t.actualHumanTime || 0), 0) || 0;
  const totalMachine =
    wo.tasks?.reduce((acc, t) => acc + (t.actualMachineTime || 0), 0) || 0;
  const totalOiling =
    wo.tasks?.reduce((acc, t) => acc + (t.actualOilingTime || 0), 0) || 0;

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1) + "h";
  };

  const progress = wo.progress || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header / Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground p-0 h-auto"
          onClick={() => navigate("/work-orders")}
        >
          <ChevronLeft className="size-4" />
          Retour aux dossiers
        </Button>
      </div>

      {/* Main Info Card */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="px-6 pt-6 flex justify-between items-center">
          <div className="space-y-1 text-primary">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Dossier
            </p>
            <h1 className="text-2xl font-bold">{wo.orderNumber}</h1>
          </div>
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-none px-3 py-1 rounded-full text-[10px] font-bold">
            {wo.status === "COMPLETED" ? "Terminé" : wo.status}
          </Badge>
        </div>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Client
            </p>
            <p className="text-sm font-semibold">{wo.customerName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Date de création
            </p>
            <p className="text-sm font-semibold">
              {format(new Date(wo.createdAt), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>
          <div className="md:col-span-2 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Description
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {wo.description ||
                wo.productType ||
                "Aucune description fournie."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-bold text-foreground">
              Avancement global
            </h2>
            <span className="text-xl font-black text-primary">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-foreground">
                {formatHours(totalHuman)}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">
                Humain
              </p>
            </div>
            <div className="text-center space-y-1 border-x border-slate-100">
              <p className="text-lg font-bold text-foreground">
                {formatHours(totalMachine)}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">
                Machine
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-foreground">
                {formatHours(totalOiling)}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">
                Huilage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Tâches ({wo.tasks?.length || 0})
        </h2>

        <div className="space-y-3">
          {wo.tasks && wo.tasks.length > 0 ? (
            wo.tasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`}>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group mb-3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <Badge
                        className={cn(
                          "text-[9px] px-2 py-0 h-4 uppercase font-bold border-none",
                          task.status === "COMPLETED"
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {task.status === "COMPLETED" ? "Terminée" : task.status}
                      </Badge>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <User className="size-3" />
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : "Non assigné"}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-xl bg-slate-50">
              <p className="text-sm text-muted-foreground italic">
                Aucune tâche associée à ce dossier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
