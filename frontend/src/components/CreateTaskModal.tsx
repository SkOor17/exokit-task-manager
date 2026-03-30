import { useEffect } from "react";
import { useForm, type Resolver, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTask, useWorkOrders, useUsers, useProfile } from "@/hooks";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TaskType } from "@/types";

const taskSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  type: z.enum([
    "CUTTING",
    "MACHINING",
    "ASSEMBLY",
    "FINISHING",
    "OILING",
    "PACKAGING",
    "QUALITY_CHECK",
  ]),
  workOrderId: z.string().min(1, "Veuillez sélectionner un dossier"),
  priority: z.coerce.number().min(1).max(5),
  estimatedHumanTime: z.coerce.number().optional(),
  dueDate: z.date().optional(),
  assignedToId: z.string().min(1, "Veuillez assigner un utilisateur"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: workOrders = [] } = useWorkOrders();
  const { data: users = [] } = useUsers();
  const { data: profile } = useProfile();

  const isAdminOrManager = profile?.role === "ADMIN" || profile?.role === "MANAGER";

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as Resolver<TaskFormValues>,
    defaultValues: {
      title: "",
      description: "",
      type: "ASSEMBLY",
      priority: 1,
      workOrderId: "",
      assignedToId: "",
    },
  });

  // Pré-remplir l'assignation pour les opérateurs
  useEffect(() => {
    if (profile && !isAdminOrManager) {
      setValue("assignedToId", profile.id);
    }
  }, [profile, isAdminOrManager, setValue, open]);

  const onSubmit: SubmitHandler<TaskFormValues> = (data) => {
    createTask(
      {
        title: data.title,
        description: data.description,
        type: data.type as TaskType,
        workOrderId: data.workOrderId,
        priority: data.priority,
        estimatedHumanTime: data.estimatedHumanTime,
        dueDate: data.dueDate?.toISOString(),
        assignedToId: data.assignedToId,
      },
      {
        onSuccess: () => {
          toast.success("Tâche créée avec succès");
          reset();
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast.error(error.message || "Erreur lors de la création de la tâche");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              placeholder="Ex: Assemblage cadre A1"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs font-medium text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register("type")}
              >
                <option value="CUTTING">Découpe</option>
                <option value="MACHINING">Usinage</option>
                <option value="ASSEMBLY">Assemblage</option>
                <option value="FINISHING">Finition</option>
                <option value="OILING">Huilage</option>
                <option value="PACKAGING">Emballage</option>
                <option value="QUALITY_CHECK">Contrôle Qualité</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priorité (1-5)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="5"
                {...register("priority")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-8",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedHumanTime">Temps estimé (h)</Label>
              <Input
                id="estimatedHumanTime"
                type="number"
                step="0.5"
                {...register("estimatedHumanTime")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="workOrderId">Dossier</Label>
            <select
              id="workOrderId"
              className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("workOrderId")}
              aria-invalid={!!errors.workOrderId}
            >
              <option value="">Sélectionner un dossier</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.orderNumber} - {wo.customerName}
                </option>
              ))}
            </select>
            {errors.workOrderId && (
              <p className="text-xs font-medium text-destructive">
                {errors.workOrderId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assignedToId">Assigné à</Label>
            <select
              id="assignedToId"
              className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("assignedToId")}
              disabled={!isAdminOrManager}
              aria-invalid={!!errors.assignedToId}
            >
              {isAdminOrManager ? (
                <>
                  <option value="">Sélectionner un utilisateur</option>
                  {users
                    .filter((u) => u.isActive)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                </>
              ) : (
                profile && (
                  <option value={profile.id}>
                    {profile.firstName} {profile.lastName} (Moi)
                  </option>
                )
              )}
            </select>
            {errors.assignedToId && (
              <p className="text-xs font-medium text-destructive">
                {errors.assignedToId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optionnel)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Détails de la tâche..."
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
              Créer la tâche
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}