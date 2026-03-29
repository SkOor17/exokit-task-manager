import {
  LayoutDashboard,
  ListTodo,
  Briefcase,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "@/hooks";
import { cn } from "@/lib/utils";
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

const items = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tâches",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Dossiers",
    url: "/work-orders",
    icon: Briefcase,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const { state } = useSidebar();

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
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar shadow-sm"
    >
      <SidebarHeader className="p-4 border-b border-border/50 h-[60px] flex justify-center">
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            state === "collapsed" && "justify-center",
          )}
        >
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-sm">
            E
          </div>
          {state !== "collapsed" && (
            <span className="font-bold text-lg tracking-tight text-foreground whitespace-nowrap">
              Exokit
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-10 transition-all duration-200 group/btn",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={cn(
                            "size-4.5 transition-transform duration-200",
                            isActive
                              ? "text-primary"
                              : "group-hover/btn:scale-110",
                          )}
                        />
                        <span>{item.title}</span>
                        {isActive && state !== "collapsed" && (
                          <ChevronRight className="ml-auto size-3 opacity-50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  className="h-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group/logout"
                  tooltip="Déconnexion"
                >
                  <LogOut className="size-4.5 group-hover/logout:translate-x-0.5 transition-transform" />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Êtes-vous sûr de vouloir vous déconnecter ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous devrez vous reconnecter pour accéder à votre espace de
                    travail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Se déconnecter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
