import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryProvider } from "./providers/queryProvider";
import { SocketProvider } from "./providers/socketProvider.tsx";
import { AuthProvider } from "./providers/authProvider.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { TimerProvider } from "./providers/timerProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <SocketProvider>
        <AuthProvider>
          <TimerProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </TimerProvider>
        </AuthProvider>
      </SocketProvider>
    </QueryProvider>
  </StrictMode>,
);
