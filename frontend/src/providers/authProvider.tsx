import { createContext, useContext, type ReactNode, useMemo } from "react";
import type { User } from "@/types";
import { useProfile } from "@/hooks";

interface AuthContextValue {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // useProfile est maintenant réactif au cache "auth/token"
  const { data: user, isLoading, isFetching } = useProfile();

  const value = useMemo(() => {
    return {
      user: user || undefined,
      isLoading: isLoading || (isFetching && !user),
      isAuthenticated: !!user,
      isAdmin: user?.role === "ADMIN",
      isManager: user?.role === "ADMIN" || user?.role === "MANAGER",
    };
  }, [user, isLoading, isFetching]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext doit être utilisé dans AuthProvider");
  return ctx;
}
