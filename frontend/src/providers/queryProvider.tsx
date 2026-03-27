import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { HttpError } from "@/lib/api-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min avant refetch automatique
      retry: (failureCount, error) => {
        // Ne pas retry sur les erreurs 4xx (client fault)
        if (
          error instanceof HttpError &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      // Afficher les erreurs en console en dev
      onError: (error) => {
        if (import.meta.env.DEV) console.error("[Mutation Error]", error);
      },
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
