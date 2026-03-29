import { useEffect, type ReactNode } from "react";
import { socketClient } from "@/lib/socket-client";
import { apiClient } from "@/lib/api-client";

export function SocketProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Si un token existe au démarrage (session persistée), on connecte
    if (apiClient.getToken()) {
      socketClient.connect();
    }

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return <>{children}</>;
}
