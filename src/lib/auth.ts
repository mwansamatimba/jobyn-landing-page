/** Authentication service backed by the FastAPI /api/v1/auth endpoints. */
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "./api";

export type AuthResponse = {
  access_token: string;
  token_type?: string;
  [key: string]: unknown;
};

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      password: input.password,
      full_name: input.full_name,
    },
  });
  if (data?.access_token) setStoredToken(data.access_token);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: { email: input.email, password: input.password },
  });
  if (data?.access_token) setStoredToken(data.access_token);
  return data;
}

export function logout(): void {
  clearStoredToken();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem("jobyn.resume_result");
    } catch {
      /* storage unavailable */
    }
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}

export { getStoredToken };
