// Wrapper Axios : abstraction complète de la couche HTTP.
// Les services ne touchent jamais axios directement.

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

// Internal types

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>; // validation errors NestJS
}

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

//  Classe ApiClient

class ApiClient {
  private readonly instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  //  Intercepteurs

  private setupInterceptors() {
    // REQUEST : injecte le token JWT si présent
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // RESPONSE : normalise les erreurs
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;

          // 401 → déconnexion automatique
          if (status === 401) {
            this.clearToken();
          }

          throw new HttpError(
            status,
            data?.message ?? "Une erreur est survenue",
            data?.errors,
          );
        }

        // Erreur réseau (pas de réponse)
        throw new HttpError(0, "Impossible de joindre le serveur");
      },
    );
  }

  //  Gestion du token

  setToken(token: string) {
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    localStorage.removeItem("auth_token");
  }

  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  //  Méthodes HTTP génériques

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.post<T>(url, body, config);
    return response.data;
  }

  async put<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.put<T>(url, body, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, body, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

// Singleton exporté — une seule instance partagée dans l'app
export const apiClient = new ApiClient();
