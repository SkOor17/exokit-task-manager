import { useTasks, useWorkOrders, useUsers } from "@/hooks";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task, TaskStatus, TaskType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { Plus, Search, FilterX, User, Briefcase, Tag, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => <span className="font-semibold">{row.original.title}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const typeLabels: Record<string, string> = {
        CUTTING: "Découpe",
        MACHINING: "Usinage",
        ASSEMBLY: "Assemblage",
        FINISHING: "Finition",
        OILING: "Huilage",
        PACKAGING: "Emballage",
        QUALITY_CHECK: "Qualité",
      };
      return <Badge variant="outline" className="bg-slate-50">{typeLabels[type] || type}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusLabels: Record<string, string> = {
        TODO: "À faire",
        IN_PROGRESS: "En cours",
        PAUSED: "En pause",
        COMPLETED: "Terminée",
        VALIDATED: "Validée",
      };
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        TODO: "outline",
        IN_PROGRESS: "secondary",
        PAUSED: "secondary",
        COMPLETED: "default",
        VALIDATED: "default",
      };
      return (
        <Badge 
          variant={variants[status] || "secondary"}
          className={cn(
            status === "IN_PROGRESS" && "bg-blue-100 text-blue-700 border-blue-200",
            status === "COMPLETED" && "bg-green-100 text-green-700 border-green-200",
            status === "PAUSED" && "bg-orange-100 text-orange-700 border-orange-200"
          )}
        >
          {statusLabels[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priorité",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as number;
      const colors = [
        "text-slate-400",
        "text-blue-500",
        "text-green-500",
        "text-orange-500",
        "text-red-500",
      ];
      return <span className={cn("font-bold", colors[priority - 1])}>P{priority}</span>;
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigné à",
    cell: ({ row }) => {
      const user = row.original.assignedTo;
      return user ? `${user.firstName} ${user.lastName}` : "-";
    },
  },
  {
    accessorKey: "workOrder.orderNumber",
    header: "Dossier",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary">{row.original.workOrder?.orderNumber || "-"}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {row.original.workOrder?.customerName}
          </span>
        </div>
      );
    },
  },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "" as TaskStatus | "",
    type: "" as TaskType | "",
    assignedToId: "",
    workOrderId: "",
    search: "",
  });

  const { data: tasks = [], isLoading } = useTasks({
    status: filters.status || undefined,
    type: filters.type || undefined,
    assignedToId: filters.assignedToId || undefined,
    workOrderId: filters.workOrderId || undefined,
    search: filters.search || undefined,
  });

  const { data: workOrders = [] } = useWorkOrders();
  const { data: users = [] } = useUsers();

  const resetFilters = () => {
    setFilters({
      status: "",
      type: "",
      assignedToId: "",
      workOrderId: "",
      search: "",
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
          <p className="text-muted-foreground">Gérez et suivez l'avancement des tâches de fabrication.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 h-11 rounded-xl shadow-sm">
          <Plus className="size-5" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Barre de Filtres */}
      <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une tâche..."
              className="pl-9 h-10 rounded-lg"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2 border rounded-lg px-3 h-10 bg-background">
            <Activity className="size-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm w-full outline-none"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="PAUSED">En pause</option>
              <option value="COMPLETED">Terminée</option>
              <option value="VALIDATED">Validée</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-2 border rounded-lg px-3 h-10 bg-background">
            <Tag className="size-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm w-full outline-none"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="CUTTING">Découpe</option>
              <option value="MACHINING">Usinage</option>
              <option value="ASSEMBLY">Assemblage</option>
              <option value="FINISHING">Finition</option>
              <option value="OILING">Huilage</option>
              <option value="PACKAGING">Emballage</option>
              <option value="QUALITY_CHECK">Qualité</option>
            </select>
          </div>

          {/* Assigné à */}
          <div className="flex items-center gap-2 border rounded-lg px-3 h-10 bg-background">
            <User className="size-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm w-full outline-none"
              value={filters.assignedToId}
              onChange={(e) => handleFilterChange("assignedToId", e.target.value)}
            >
              <option value="">Tous les opérateurs</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>

          {/* Dossier */}
          <div className="flex items-center gap-2 border rounded-lg px-3 h-10 bg-background">
            <Briefcase className="size-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm w-full outline-none"
              value={filters.workOrderId}
              onChange={(e) => handleFilterChange("workOrderId", e.target.value)}
            >
              <option value="">Tous les dossiers</option>
              {workOrders.map(wo => (
                <option key={wo.id} value={wo.id}>{wo.orderNumber}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.values(filters).some(v => v !== "") && (
          <div className="flex justify-end pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground gap-2 h-8"
            >
              <FilterX className="size-4" />
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center bg-card border rounded-xl shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Chargement des tâches...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          onRowClick={(task) => navigate(`/tasks/${task.id}`)}
        />
      )}

      <CreateTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
