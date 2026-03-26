import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryProvider } from "./providers/queryProvider";
import { SocketProvider } from "./providers/socketProvider.tsx";
import { AuthProvider } from "./providers/authProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <SocketProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SocketProvider>
    </QueryProvider>
  </StrictMode>,
);
