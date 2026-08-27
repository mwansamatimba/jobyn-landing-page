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

/**
 * Register then sign in.
 *
 * Backend POST /auth/register returns UserRead (no JWT). The access token is
 * issued only by POST /auth/login — so after a successful register we login
 * with the same credentials to store the Bearer token.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  await apiRequest("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      password: input.password,
      full_name: input.full_name,
    },
  });
  return login({ email: input.email, password: input.password });
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

/** Public user payload from GET /api/v1/auth/me (UserRead). */
export type CurrentUser = {
  id: string;
  email: string;
  full_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
};

/** GET /api/v1/auth/me — requires a stored Bearer token. */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>("/api/v1/auth/me", { method: "GET", auth: true });
}

export { getStoredToken };
