import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services";
import type { LoginCredentials, RegisterCredentials } from "@/types";
import { socketClient } from "@/lib/socket-client";

export function useProfile() {
  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: () => AuthService.getProfile(),
    staleTime: 5 * 60_000, // 5 min
    retry: false, // ne pas retry si non authentifié
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      AuthService.login(credentials),
    onSuccess: () => {
      // Ouvre la connexion socket une fois authentifié
      socketClient.connect();
      // Invalide le profil pour le recharger
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterCredentials) => AuthService.register(data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      socketClient.disconnect();
      // Efface tout le cache React Query
      queryClient.clear();
    },
  });
}
