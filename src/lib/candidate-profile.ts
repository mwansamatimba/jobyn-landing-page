/**
 * Candidate profile service backed by GET /api/v1/resume/profile/{candidate_id}.
 * Maps the backend response onto the shape the existing Profile page renders,
 * with safe fallbacks so every section keeps rendering when fields are missing.
 */
import { apiRequest, ApiError, getStoredToken } from "./api";
import { fetchCurrentUser } from "./auth";
import { getStoredResumeResult } from "./resume";

export type CandidateProfile = {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
  completion: { score: number; sections: { label: string; done: boolean }[] };
  skills: { name: string; level: string }[];
  experience: {
    role: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
  }[];
  education: { degree: string; school: string; period: string; detail: string }[];
  recommendedRoles: { title: string; match: number }[];
};

type Raw = Record<string, unknown>;

function obj(value: unknown): Raw | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function pick(source: Raw | null, ...keys: string[]): unknown {
  if (!source) return undefined;
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Reads the candidate id the app already stores after resume upload.
 *
 * Backend GET /api/v1/resume/profile/{candidate_id} looks up by user UUID
 * (see ResumeService.get_candidate_profile). Upload returns ParsedResumeRead
 * with `user_id` as that identifier — never use the upload/resume row `id`.
 */
export function getCandidateId(): string | null {
  const result = getStoredResumeResult<Raw>();
  const candidate =
    pick(result, "user_id", "candidate_id", "candidateId") ??
    pick(obj(result?.["candidate"]), "user_id", "candidate_id");
  return candidate === undefined ? null : String(candidate);
}

/**
 * Resolve the user UUID for profile APIs: sessionStorage upload result first,
 * then GET /api/v1/auth/me when signed in (so Profile works after login alone).
 */
export async function resolveCandidateId(): Promise<string | null> {
  const fromStorage = getCandidateId();
  if (fromStorage) return fromStorage;

  if (!getStoredToken()) return null;

  try {
    const user = await fetchCurrentUser();
    return user?.id ? String(user.id) : null;
  } catch {
    return null;
  }
}

function mapSkills(value: unknown): { name: string; level: string }[] {
  return arr(value)
    .map((s) => {
      if (typeof s === "string") return { name: s, level: "" };
      const o = obj(s);
      if (!o) return null;
      const name = str(pick(o, "name", "skill", "title"));
      return name ? { name, level: str(pick(o, "level", "proficiency", "category")) } : null;
    })
    .filter((s): s is { name: string; level: string } => Boolean(s));
}

function mapExperience(value: unknown): CandidateProfile["experience"] {
  return arr(value)
    .map((e) => {
      const o = obj(e);
      if (!o) return null;
      const start = str(pick(o, "start_date", "start", "from"));
      const end = str(pick(o, "end_date", "end", "to"), "Present");
      const period = str(pick(o, "period", "dates"), start ? `${start} — ${end}` : "");
      const bullets = arr(pick(o, "bullets", "highlights", "responsibilities", "achievements"))
        .map((b) => (typeof b === "string" ? b : str(pick(obj(b), "text", "description"))))
        .filter(Boolean);
      const description = str(pick(o, "description", "summary"));
      return {
        role: str(pick(o, "role", "title", "position"), "Role"),
        company: str(pick(o, "company", "employer", "organization")),
        location: str(pick(o, "location", "city")),
        period,
        bullets: bullets.length ? bullets : description ? [description] : [],
      };
    })
    .filter((e): e is CandidateProfile["experience"][number] => Boolean(e));
}

function mapEducation(value: unknown): CandidateProfile["education"] {
  return arr(value)
    .map((e) => {
      const o = obj(e);
      if (!o) return null;
      const start = str(pick(o, "start_date", "start", "from"));
      const end = str(pick(o, "end_date", "end", "to", "graduation_year", "year"));
      const period = str(pick(o, "period", "dates"), [start, end].filter(Boolean).join(" — "));
      return {
        degree: str(pick(o, "degree", "qualification", "program", "title"), "Education"),
        school: str(pick(o, "school", "institution", "university", "college")),
        period,
        detail: str(pick(o, "detail", "description", "field_of_study", "field", "grade")),
      };
    })
    .filter((e): e is CandidateProfile["education"][number] => Boolean(e));
}

function mapRoles(value: unknown): { title: string; match: number }[] {
  return arr(value)
    .map((r) => {
      if (typeof r === "string") return { title: r, match: 0 };
      const o = obj(r);
      if (!o) return null;
      const title = str(pick(o, "title", "role", "name", "job_title"));
      return title
        ? { title, match: num(pick(o, "match", "match_score", "score", "fit_score")) }
        : null;
    })
    .filter((r): r is { title: string; match: number } => Boolean(r));
}

/**
 * Jobyn profile GET returns CandidateProfileRead with CV fields under `content`.
 * Upload returns ParsedResumeRead with the same fields under `parsed_data`.
 * Merge nested blobs so the view-model mapper can read flat field names.
 */
function unwrap(raw: unknown): Raw | null {
  const root = obj(raw);
  if (!root) return null;
  let merged: Raw = { ...root };
  for (const key of [
    "content",
    "parsed_data",
    "profile",
    "candidate",
    "data",
    "result",
    "analysis",
  ]) {
    const nested = obj(root[key]);
    if (nested) merged = { ...nested, ...merged, ...nested };
  }
  return merged;
}

export function mapCandidateProfile(raw: unknown): CandidateProfile {
  const src = unwrap(raw) ?? {};
  const contact = obj(pick(src, "contact", "contact_info")) ?? src;

  // Prefer technical_skills when present; CV analyzer also returns a flat skills list.
  const skills = mapSkills(
    pick(src, "skills", "technical_skills", "top_skills", "extracted_skills"),
  );
  const softSkills = mapSkills(pick(src, "soft_skills"));
  const allSkills = [...skills];
  for (const s of softSkills) {
    if (!allSkills.some((x) => x.name.toLowerCase() === s.name.toLowerCase())) {
      allSkills.push(s.level ? s : { ...s, level: "soft" });
    }
  }

  const experience = mapExperience(pick(src, "experience", "work_experience", "employment"));
  const education = mapEducation(pick(src, "education", "education_history"));
  const recommendedRoles = mapRoles(
    pick(src, "recommended_roles", "recommended_job_titles", "roles"),
  );

  const years = str(pick(src, "years_experience", "years_of_experience"));
  const industries = arr(pick(src, "industries"))
    .map((i) => (typeof i === "string" ? i : str(pick(obj(i), "name", "title"))))
    .filter(Boolean);
  const strengths = arr(pick(src, "strengths"))
    .map((s) => (typeof s === "string" ? s : str(pick(obj(s), "title", "name", "strength"))))
    .filter(Boolean);

  // Resume record `title` is often the candidate name / filename — prefer career_level for headline.
  const headline = str(
    pick(src, "headline", "current_role", "career_level"),
    years ? `Professional · ${years}` : "Professional",
  );

  const summaryParts = [
    str(pick(src, "summary", "professional_summary", "ai_summary", "about")),
    years ? `Experience: ${years}.` : "",
    industries.length ? `Industries: ${industries.join(", ")}.` : "",
    strengths.length ? `Strengths: ${strengths.join(", ")}.` : "",
  ].filter(Boolean);

  const sections = [
    { label: "Contact info", done: Boolean(pick(contact, "email", "phone")) },
    { label: "Work experience", done: experience.length > 0 },
    { label: "Education", done: education.length > 0 },
    { label: "Skills", done: allSkills.length > 0 },
    {
      label: "Portfolio links",
      done: Boolean(pick(src, "portfolio", "links", "website", "github")),
    },
    {
      label: "Certifications",
      done: arr(pick(src, "certifications", "certification_recommendations")).length > 0,
    },
  ];

  const reported = pick(src, "profile_completion", "completeness", "completion_score", "completion");
  const derivedScore = Math.round(
    (sections.filter((s) => s.done).length / Math.max(sections.length, 1)) * 100,
  );
  const score =
    reported === undefined
      ? derivedScore
      : num(typeof reported === "object" ? pick(obj(reported), "score", "value") : reported);

  return {
    name: str(pick(src, "full_name", "name", "candidate_name"), "Candidate"),
    headline,
    location: str(pick(contact, "location", "city", "address")),
    email: str(pick(contact, "email")),
    phone: str(pick(contact, "phone", "phone_number", "mobile")),
    summary: summaryParts.join(" "),
    completion: { score, sections },
    skills: allSkills,
    experience,
    education,
    recommendedRoles,
  };
}

/** GET /api/v1/resume/profile/{candidate_id} */
export async function fetchCandidateProfile(candidateId: string): Promise<CandidateProfile> {
  // The endpoint is JWT-protected: fail fast (instead of firing an anonymous
  // request that always 401s) when no token is stored.
  const token = getStoredToken();
  if (!token) {
    throw new ApiError("Please sign in to view your profile.", 401);
  }
  const data = await apiRequest<unknown>(
    `/api/v1/resume/profile/${encodeURIComponent(candidateId)}`,
    { method: "GET", auth: true, headers: { Authorization: `Bearer ${token}` } },
  );
  return mapCandidateProfile(data);
}
