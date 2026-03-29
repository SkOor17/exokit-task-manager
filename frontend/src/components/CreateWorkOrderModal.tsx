import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateWorkOrder } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const workOrderSchema = z.object({
  orderNumber: z.string().min(3, "Le numéro de commande doit contenir au moins 3 caractères"),
  customerName: z.string().min(2, "Le nom du client doit contenir au moins 2 caractères"),
  productType: z.string().optional(),
  description: z.string().optional(),
  // On valide que c'est une date valide si elle est fournie
  expectedDelivery: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "La date doit être valide"),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

interface CreateWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkOrderModal({ open, onOpenChange }: CreateWorkOrderModalProps) {
  const { mutate: createWorkOrder, isPending } = useCreateWorkOrder();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      productType: "",
      description: "",
      expectedDelivery: "",
    },
  });

  const onSubmit = (data: WorkOrderFormValues) => {
    // Conversion de la date au format ISO-8601 attendu par le backend
    const formattedData = {
      ...data,
      expectedDelivery: data.expectedDelivery && data.expectedDelivery !== "" 
        ? new Date(data.expectedDelivery).toISOString() 
        : undefined,
    };

    createWorkOrder(formattedData, {
      onSuccess: () => {
        toast.success("Dossier créé avec succès");
        reset();
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Erreur lors de la création du dossier");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="orderNumber">Numéro de commande</Label>
            <Input
              id="orderNumber"
              placeholder="Ex: CMD-2024-001"
              {...register("orderNumber")}
              aria-invalid={!!errors.orderNumber}
            />
            {errors.orderNumber && (
              <p className="text-xs font-medium text-destructive">
                {errors.orderNumber.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customerName">Nom du client</Label>
            <Input
              id="customerName"
              placeholder="Ex: Client XYZ"
              {...register("customerName")}
              aria-invalid={!!errors.customerName}
            />
            {errors.customerName && (
              <p className="text-xs font-medium text-destructive">
                {errors.customerName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productType">Type de produit (Optionnel)</Label>
            <Input
              id="productType"
              placeholder="Ex: Armoire sur mesure"
              {...register("productType")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedDelivery">Date de livraison prévue (Optionnel)</Label>
            <Input
              id="expectedDelivery"
              type="date"
              {...register("expectedDelivery")}
              aria-invalid={!!errors.expectedDelivery}
            />
            {errors.expectedDelivery && (
              <p className="text-xs font-medium text-destructive">
                {errors.expectedDelivery.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optionnel)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Détails du projet..."
              {...register("description")}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le dossier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
