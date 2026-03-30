import { useState, useMemo } from "react";
import { useWorkOrders } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateWorkOrderModal } from "@/components/CreateWorkOrderModal";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/types";

type FilterStatus = "ALL" | WorkOrderStatus;

export default function WorkOrders() {
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch =
        wo.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === "ALL") return matchesSearch;

      if (statusFilter === "PENDING") {
        return (
          matchesSearch && (wo.status === "PENDING" || wo.status === "ON_HOLD")
        );
      }

      return matchesSearch && wo.status === statusFilter;
    });
  }, [workOrders, searchQuery, statusFilter]);

  const getStatusLabel = (status: WorkOrderStatus) => {
    switch (status) {
      case "PENDING":
        return "En attente";
      case "IN_PROGRESS":
        return "En cours";
      case "ON_HOLD":
        return "En attente";
      case "COMPLETED":
        return "Termine";
      case "DELIVERED":
        return "Livre";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  const getStatusVariant = (status: WorkOrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50";
      case "ON_HOLD":
        return "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50";
      case "COMPLETED":
        return "bg-green-50 text-green-600 border-green-100 hover:bg-green-50";
      case "DELIVERED":
        return "bg-green-50 text-green-600 border-green-100 hover:bg-green-50";
      case "CANCELLED":
        return "bg-red-50 text-red-600 border-red-100 hover:bg-red-50";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chargement des dossiers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dossiers Clients
          </h1>
          <p className="text-slate-500">
            Gerez vos commandes et suivez l'avancement
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#7c5fa2] hover:bg-[#6b4f8e] text-white rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="size-5" />
          Nouveau dossier
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Rechercher par numero de commande ou client..."
            className="pl-10 h-12 bg-white border-slate-200 rounded-lg shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Tous", value: "ALL" },
            { label: "En cours", value: "IN_PROGRESS" },
            { label: "En attente", value: "PENDING" },
            { label: "Termines", value: "COMPLETED" },
            { label: "Livres", value: "DELIVERED" },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "ghost"}
              className={cn(
                "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                statusFilter === filter.value
                  ? "bg-[#7c5fa2] text-white hover:bg-[#6b4f8e]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
              )}
              onClick={() => setStatusFilter(filter.value as FilterStatus)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-sm text-slate-400 mb-4">
        {filteredWorkOrders.length} dossiers
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkOrders.map((wo) => {
          const progress = wo.progress || 0;
          const taskCount = wo.tasks?.length || wo.totalTasks || 0;

          return (
            <Card
              key={wo.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-slate-200"
              onClick={() => navigate(`/work-orders/${wo.id}`)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900">
                      {wo.orderNumber}
                    </h3>
                    <p className="text-slate-600 font-medium">
                      {wo.customerName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-none",
                      getStatusVariant(wo.status),
                    )}
                  >
                    {getStatusLabel(wo.status)}
                  </Badge>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                  {wo.description || "Pas de description"}
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>
                      {taskCount} {taskCount > 1 ? "taches" : "tache"}
                    </span>
                    <span className="font-bold text-slate-900">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress === 100 ? "bg-emerald-500" : "bg-primary",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-xs text-slate-400">
                    Cree le {new Date(wo.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <ArrowRight className="size-4 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateWorkOrderModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
