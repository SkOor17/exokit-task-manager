import { io, type Socket } from "socket.io-client";
import { apiClient } from "./api-client";

// --- Types ---

export interface ServerToClientEvents {
  "timer:update": (data: TimerUpdatePayload) => void;
  "timer:stopped": (data: TimerStoppedPayload) => void;
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

export interface TimerUpdatePayload {
  taskId: string;
  elapsed: number;
  status: "running" | "paused";
}

export interface TimerStoppedPayload {
  taskId: string;
  duration: number;
  timerId: string;
}

export interface TimerAck {
  success: boolean;
  error?: string;
}

// --- Classe SocketClient ---

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private _connected = false;

  // --- Connexion ---

  connect(): void {
    if (this.socket?.connected) return;

    const token = apiClient.getToken();

    // On s'assure que l'instance générée respecte strictement nos interfaces
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
    });

    this.socket.on("disconnect", (reason) => {
      this._connected = false;
      console.warn("[Socket] Déconnecté :", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[Socket] Erreur de connexion :", err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  // --- Abonnement aux events ---

  // L'utilisation de Extract force TypeScript à ignorer les 'number' et 'symbol'
  on<K extends Extract<keyof ServerToClientEvents, string>>(
    event: K,
    handler: ServerToClientEvents[K],
  ): void {
    if (!this.socket) return;

    // On type la méthode 'on' elle-même pour cette invocation
    const strictOn = this.socket.on as (
      ev: K,
      listener: ServerToClientEvents[K],
    ) => void;
    strictOn.call(this.socket, event, handler);
  }

  off<K extends Extract<keyof ServerToClientEvents, string>>(
    event: K,
    handler?: ServerToClientEvents[K],
  ): void {
    if (!this.socket) return;

    const strictOff = this.socket.off as (
      ev: K,
      listener?: ServerToClientEvents[K],
    ) => void;
    strictOff.call(this.socket, event, handler);
  }

  // --- Émission d'events ---

  emit<K extends Extract<keyof ClientToServerEvents, string>>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      console.warn("[Socket] Tentative d'émission sans connexion :", event);
      return;
    }

    // On type la méthode 'emit' pour qu'elle accepte exactement notre événement K et ses arguments
    const strictEmit = this.socket.emit as (
      ev: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => void;
    strictEmit.apply(this.socket, [event, ...args]);
  }

  // --- Helpers timer (sugar syntax) ---

  startTimer(taskId: string, userId: string, timeType: string = "HUMAN"): Promise<TimerAck> {
    return new Promise((resolve) => {
      this.emit("timer:start", { taskId, userId, timeType }, resolve);
    });
  }

  pauseTimer(timerId: string, userId: string): Promise<TimerAck> {
    return new Promise((resolve) => {
      this.emit("timer:pause", { timerId, userId }, resolve);
    });
  }

  stopTimer(timerId: string, userId: string, notes?: string): Promise<TimerAck> {
    return new Promise((resolve) => {
      this.emit("timer:stop", { timerId, userId, notes }, resolve);
    });
  }
}

// Singleton exporté
export const socketClient = new SocketClient();
