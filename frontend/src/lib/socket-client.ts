import { io, type Socket } from "socket.io-client";
import { apiClient } from "./api-client";
import type { Timer } from "@/types";

// --- Types ---

export interface ServerToClientEvents {
  "timer:started": (timer: Timer) => void;
  "timer:paused": (timer: Timer) => void;
  "timer:stopped": (timer: Timer) => void;
  "timer:error": (data: { message: string }) => void;
  "task:updated": (data: { taskId: string }) => void;
}

export interface ClientToServerEvents {
  "timer:start": (
    data: { taskId: string; userId: string; timeType?: string },
    callback?: (ack: TimerAck) => void,
  ) => void;
  "timer:pause": (
    data: { timerId: string; userId: string },
    callback?: (ack: TimerAck) => void,
  ) => void;
  "timer:stop": (
    data: { timerId: string; userId: string; notes?: string },
    callback?: (ack: TimerAck) => void,
  ) => void;
}

export interface TimerAck {
  success: boolean;
  timer?: Timer;
  error?: string;
}

// Type utilitaire : extrait uniquement les clés string d'un objet d'events
type StringKeys<T> = Extract<keyof T, string>;

// Type utilitaire : représente un handler enregistré en attente de connexion
type PendingHandler<
  K extends StringKeys<ServerToClientEvents> = StringKeys<ServerToClientEvents>,
> = {
  event: K;
  handler: ServerToClientEvents[K];
  type: "on" | "off";
};

// --- Classe SocketClient ---

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private _connected = false;
  private pendingHandlers: PendingHandler[] = [];

  // --- Connexion ---

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Timeout: socket non connecté après 5s"));
      }, 5_000);

      this.socket?.once("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  connect(): void {
    if (this.socket?.connected) return;

    // On s'assure de repartir sur une base propre d'handlers en attente si on reconnecte
    this.pendingHandlers = [];

    const token = apiClient.getToken();

    this.socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3000", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    this.socket.on("connect", () => {
      this._connected = true;
      console.info("[Socket] Connecté :", this.socket?.id);
      this.flushPendingHandlers();
    });

    this.socket.on("disconnect", (reason) => {
      this._connected = false;
      console.warn("[Socket] Déconnecté :", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[Socket] Erreur de connexion :", err.message);
    });
  }

  // Rejoue tous les on/off mis en attente avant que le socket soit prêt
  private flushPendingHandlers(): void {
    for (const { event, handler, type } of this.pendingHandlers) {
      if (type === "on") {
        this.registerOn(event, handler);
      } else {
        this.registerOff(event, handler);
      }
    }
    this.pendingHandlers = [];
  }

  // Fonctions intermédiaires qui isolent le cast au bon niveau de généricité
  private registerOn<K extends StringKeys<ServerToClientEvents>>(
    event: K,
    handler: ServerToClientEvents[K],
  ): void {
    this.socket?.on(event, handler as never);
  }

  private registerOff<K extends StringKeys<ServerToClientEvents>>(
    event: K,
    handler: ServerToClientEvents[K],
  ): void {
    this.socket?.off(event, handler as never);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._connected = false;
    this.pendingHandlers = [];
  }

  get connected(): boolean {
    return this._connected;
  }

  // --- Abonnement aux events ---

  on<K extends StringKeys<ServerToClientEvents>>(
    event: K,
    handler: ServerToClientEvents[K],
  ): void {
    if (!this.socket) {
      this.pendingHandlers.push({ event, handler, type: "on" });
      return;
    }
    this.registerOn(event, handler);
  }

  off<K extends StringKeys<ServerToClientEvents>>(
    event: K,
    handler?: ServerToClientEvents[K],
  ): void {
    if (!this.socket) {
      this.pendingHandlers = this.pendingHandlers.filter(
        (h) => h.handler !== handler,
      );
      return;
    }
    if (handler) this.registerOff(event, handler);
  }

  // --- Émission d'events ---

  emit<K extends StringKeys<ClientToServerEvents>>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      throw new Error(
        `[Socket] Émission impossible, socket non connecté : ${event}`,
      );
    }
    this.socket.emit(event, ...args);
  }

  // --- Helpers timer ---

  async startTimer(
    taskId: string,
    userId: string,
    timeType: string = "HUMAN",
  ): Promise<TimerAck> {
    await this.waitForConnection();
    return new Promise((resolve) => {
      this.emit("timer:start", { taskId, userId, timeType }, resolve);
    });
  }

  async pauseTimer(timerId: string, userId: string): Promise<TimerAck> {
    await this.waitForConnection();
    return new Promise((resolve) => {
      this.emit("timer:pause", { timerId, userId }, resolve);
    });
  }

  async stopTimer(
    timerId: string,
    userId: string,
    notes?: string,
  ): Promise<TimerAck> {
    await this.waitForConnection();
    return new Promise((resolve) => {
      this.emit("timer:stop", { timerId, userId, notes }, resolve);
    });
  }
}

// Singleton exporté
export const socketClient = new SocketClient();
