import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthContext } from "@/providers/authProvider";
import { useLogout } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function AppHeader() {
  const { user } = useAuthContext();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast.success("Déconnexion réussie");
        navigate("/login");
      },
      onError: () => {
        toast.error("Erreur lors de la déconnexion");
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent transition-colors" />
        <Separator orientation="vertical" className="h-6 opacity-50" />
        <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <span>Projet</span>
          <span className="mx-2 opacity-30">/</span>
          <span className="text-foreground">Tableau de bord</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative hover:bg-accent text-muted-foreground"
          >
            <Bell className="size-4.5" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive border-2 border-background" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end text-right hidden sm:flex">
            <span className="text-sm font-bold text-foreground leading-none">
              {user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
              {user?.role || "Opérateur"}
            </span>
          </div>
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
            {user?.firstName?.[0] || <UserIcon className="size-5" />}
            {user?.lastName?.[0] || ""}
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="size-4.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir vous déconnecter ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous devrez vous reconnecter pour accéder à votre espace de travail.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Se déconnecter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
