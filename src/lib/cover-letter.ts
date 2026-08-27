/**
 * Cover Letter data service backed by POST /api/v1/application-copilot/generate.
 *
 * The backend requires a job_id (UUID of an existing active job in the DB).
 * It loads the user's latest parsed resume automatically from the JWT identity.
 */
import { apiRequest, ApiError, getStoredToken } from "./api";

// ── Types matching the existing Cover Letter UI ─────────────────────────────

export type MatchedRequirement = {
  requirement: string;
  evidence: string;
};

export type AddressedSkillGap = {
  gap: string;
  response: string;
};

export type CoverLetterData = {
  job_id: string;
  job_title: string;
  company: string;
  cover_letter: string;
  key_selling_points: string[];
  matched_requirements: MatchedRequirement[];
  addressed_skill_gaps: AddressedSkillGap[];
  application_tips: string[];
};

export type JobOption = {
  id: string;
  title: string;
  company: string;
  location: string | null;
};

// ── Job list (for the selector) ──────────────────────────────────────────────

export async function fetchJobOptions(): Promise<JobOption[]> {
  const token = getStoredToken();
  if (!token) throw new ApiError("Please sign in first.", 401);
  const data = await apiRequest<{ items: JobOption[] }>("/api/v1/jobs?limit=100", {
    method: "GET",
    auth: true,
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(data?.items) ? data.items : [];
}

// ── Cover letter generation ──────────────────────────────────────────────────

/**
 * POST /api/v1/application-copilot/generate
 *
 * @param jobId      UUID of an existing active job in the database.
 * @param additionalContext  Optional candidate context (max 2000 chars).
 */
export async function generateCoverLetter(
  jobId: string,
  additionalContext?: string,
): Promise<CoverLetterData> {
  const token = getStoredToken();
  if (!token) throw new ApiError("Please sign in to generate a cover letter.", 401);

  const body: { job_id: string; additional_context?: string } = { job_id: jobId };
  if (additionalContext && additionalContext.trim()) {
    body.additional_context = additionalContext.trim().slice(0, 2000);
  }

  const data = await apiRequest<CoverLetterData>(
    "/api/v1/application-copilot/generate",
    {
      method: "POST",
      auth: true,
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  );

  return data;
}
