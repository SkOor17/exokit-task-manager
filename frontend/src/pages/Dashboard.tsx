import { useTasks } from "@/hooks";
import { TaskCard } from "@/components/TaskCard";
import { useAuthContext } from "@/providers/authProvider";

export default function Dashboard() {
  const { user } = useAuthContext();

  // On récupère les tâches de l'utilisateur
  const { data: tasks, isLoading, error } = useTasks();

  const handleCompleteTask = async (taskId: string) => {
    try {
      // Pour une mise à jour, useUpdateTask dans sa forme actuelle n'est pas idéal
      // car il prend l'ID au montage du hook.
      // Mais on peut utiliser TasksService directement ou adapter le hook.
      // Ici j'utilise une approche simple pour l'exemple.
      console.log("Marquer la tâche comme terminée :", taskId);
    } catch (err) {
      console.error("Erreur lors de la complétion :", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          Chargement des tâches...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Une erreur est survenue lors de la récupération des tâches.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Bonjour {user?.firstName || "Marie"} !
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre journée de travail
        </p>
      </header>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Tâches prioritaires
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {tasks?.length || 0}
            </span>
          </h2>
          <button className="text-sm text-primary hover:underline">
            Voir tout →
          </button>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleCompleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
              Aucune tâche assignée pour le moment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
