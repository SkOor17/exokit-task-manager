import { useWorkOrders } from "@/hooks";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { WorkOrder } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const columns: ColumnDef<WorkOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Numéro de commande",
  },
  {
    accessorKey: "customerName",
    header: "Client",
  },
  {
    accessorKey: "productType",
    header: "Type de produit",
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
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
];

export default function WorkOrders() {
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chargement des dossiers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dossiers</h1>
      </div>
      <DataTable
        columns={columns}
        data={workOrders}
        onRowClick={(wo) => navigate(`/work-orders/${wo.id}`)}
      />
    </div>
  );
}
