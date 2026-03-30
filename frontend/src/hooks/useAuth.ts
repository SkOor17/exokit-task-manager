import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services";
import type { LoginCredentials, RegisterCredentials } from "@/types";
import { socketClient } from "@/lib/socket-client";
import { apiClient } from "@/lib/api-client";

/**
 * Hook pour récupérer le token de manière réactive
 */
export function useAuthToken() {
  return useQuery({
    queryKey: ["auth", "token"],
    queryFn: () => {
      return apiClient.getToken();
    },
    // On initialise immédiatement avec la valeur du localStorage pour éviter le flash undefined
    initialData: () => apiClient.getToken(),
    // Le token ne change que via setQueryData ou refresh manuel
    staleTime: Infinity,
  });
}

export function useProfile() {
  const { data: token, isLoading: isTokenLoading } = useAuthToken();

  const query = useQuery({
    queryKey: ["auth", "profile", token],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await AuthService.getProfile();
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("[useProfile] Fetch error:", error);
        return null;
      }
    },
    staleTime: 300_000, // 5 min
    gcTime: 600_000,
    retry: false,
    enabled: !!token,
  });

  return {
    ...query,
    // On est en chargement si le token est encore en train d'être récupéré
    // OU si on a un token et que le profil est en cours de chargement
    isLoading: isTokenLoading || (!!token && query.isLoading),
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      AuthService.login(credentials),
    onSuccess: async (data) => {
      // 1. Mettre à jour le token d'abord
      queryClient.setQueryData(["auth", "token"], data.access_token);

      // 2. Injecter le profil immédiatement
      queryClient.setQueryData(
        ["auth", "profile", data.access_token],
        data.user,
      );

      // 3. Invalider le reste proprement sans tout effacer brutalement
      await queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes("auth"),
      });

      socketClient.connect();
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
    onSuccess: async () => {
      socketClient.disconnect();

      // Reset complet du cache
      queryClient.setQueryData(["auth", "token"], null);
      queryClient.clear();
    },
  });
}
