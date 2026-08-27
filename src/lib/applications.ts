/**
 * Application Tracking service.
 *
 * POST  /api/v1/applications          — create
 * GET   /api/v1/applications          — list
 * PATCH /api/v1/applications/{id}     — update status / fields
 * DELETE /api/v1/applications/{id}    — delete
 */
import { apiRequest, ApiError, getStoredToken } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "draft"
  | "applied"
  | "under_review"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft",
  "applied",
  "under_review",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  under_review: "Under Review",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export type ApplicationRead = {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationsResponse = {
  items: ApplicationRead[];
  total: number;
  offset: number;
  limit: number;
};

// ── API helpers ───────────────────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function requireToken(): string {
  const token = getStoredToken();
  if (!token) throw new ApiError("Please sign in to manage applications.", 401);
  return token;
}

export async function fetchApplications(
  opts: { offset?: number; limit?: number; status?: ApplicationStatus } = {},
): Promise<ApplicationsResponse> {
  const token = requireToken();
  const params = new URLSearchParams();
  if (opts.offset != null) params.set("offset", String(opts.offset));
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  return apiRequest<ApplicationsResponse>(
    `/api/v1/applications${qs ? "?" + qs : ""}`,
    { method: "GET", auth: true, headers: authHeaders(token) },
  );
}

export async function createApplication(payload: {
  job_id: string;
  cover_letter?: string;
  notes?: string;
  status?: ApplicationStatus;
}): Promise<ApplicationRead> {
  const token = requireToken();
  return apiRequest<ApplicationRead>("/api/v1/applications", {
    method: "POST",
    auth: true,
    headers: authHeaders(token),
    body: payload,
  });
}

export async function updateApplication(
  applicationId: string,
  payload: {
    status?: ApplicationStatus;
    cover_letter?: string;
    notes?: string;
  },
): Promise<ApplicationRead> {
  const token = requireToken();
  return apiRequest<ApplicationRead>(`/api/v1/applications/${applicationId}`, {
    method: "PATCH",
    auth: true,
    headers: authHeaders(token),
    body: payload,
  });
}
