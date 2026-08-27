/**
 * Matches data service backed by POST /api/v1/jobs/deterministic-match.
 */
import { apiRequest, ApiError, getStoredToken } from "./api";

export type MatchJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  match: number;
  match_level: string;
  matching: string[];
  missing: string[];
  explanation: string;
  recommendation: string;
};

export type MatchesData = {
  resume_id: string;
  total_jobs_evaluated: number;
  jobs: MatchJob[];
};

type RawMatchItem = {
  job_id: string;
  job_title: string;
  company: string;
  location: string | null;
  employment_type: string | null;
  match_score: number;
  match_level: string;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: boolean;
  role_match: boolean;
  recommendation: string;
  skill_score: number;
  experience_score: number;
  role_score: number;
};

type RawMatchResponse = {
  resume_id: string;
  total_jobs_evaluated: number;
  matches: RawMatchItem[];
};

function formatEmploymentType(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildExplanation(item: RawMatchItem): string {
  const parts: string[] = [];
  if (item.match_level) parts.push(item.match_level);
  if (item.recommendation && item.recommendation !== item.match_level)
    parts.push(`Recommendation: ${item.recommendation}`);
  if (item.experience_match) parts.push("Experience aligns.");
  if (item.role_match) parts.push("Role title is a strong fit.");
  if (item.skill_score > 0) parts.push(`Skill alignment: ${item.skill_score}%.`);
  return parts.join(" ") || `${item.match_score}% overall match.`;
}

function mapMatchItem(item: RawMatchItem): MatchJob {
  return {
    id: item.job_id,
    title: item.job_title || "Untitled role",
    company: item.company || "Unknown company",
    location: item.location || "Remote",
    salary: formatEmploymentType(item.employment_type),
    match: Math.max(0, Math.min(100, Math.round(item.match_score ?? 0))),
    match_level: item.match_level || "",
    matching: Array.isArray(item.matched_skills) ? item.matched_skills : [],
    missing: Array.isArray(item.missing_skills) ? item.missing_skills : [],
    explanation: buildExplanation(item),
    recommendation: item.recommendation || "",
  };
}

export function mapMatchesResponse(raw: unknown): MatchesData {
  if (!raw || typeof raw !== "object")
    return { resume_id: "", total_jobs_evaluated: 0, jobs: [] };
  const r = raw as RawMatchResponse;
  const matches = Array.isArray(r.matches) ? r.matches : [];
  return {
    resume_id: r.resume_id ?? "",
    total_jobs_evaluated: r.total_jobs_evaluated ?? matches.length,
    jobs: matches.map(mapMatchItem),
  };
}

export async function fetchMatches(topN = 10): Promise<MatchesData> {
  const token = getStoredToken();
  if (!token) throw new ApiError("Please sign in to view your job matches.", 401);
  const data = await apiRequest<unknown>(
    `/api/v1/jobs/deterministic-match?top_n=${topN}`,
    { method: "POST", auth: true, headers: { Authorization: `Bearer ${token}` } },
  );
  return mapMatchesResponse(data);
}
