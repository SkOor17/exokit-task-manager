import { useTasks } from "@/hooks";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: "Titre",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline">{type}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priorité",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as number;
      return <span className="font-medium">{priority}</span>;
    },
  },
  {
    accessorKey: "workOrder.orderNumber",
    header: "Dossier",
    cell: ({ row }) => {
      return row.original.workOrder?.orderNumber || "-";
    },
  },
];

export default function Tasks() {
  const { data: tasks = [], isLoading } = useTasks();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
      </div>
      <DataTable
        columns={columns}
        data={tasks}
        onRowClick={(task) => navigate(`/tasks/${task.id}`)}
      />
    </div>
  );
}
