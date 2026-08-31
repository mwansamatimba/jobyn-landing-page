/** Resume upload service backed by POST /api/v1/resume/upload. */
import { API_BASE_URL, ApiError, getStoredToken, clearStoredToken, parseApiErrorMessage } from "./api";

export type ResumeUploadResponse = {
  /** Legacy/general status, when supplied by the backend. */
  status?: string;
  /** Authoritative resume parsing status returned by the backend. */
  parse_status?: string;
  [key: string]: unknown;
};

const RESULT_KEY = "jobyn.resume_result";

/** Persists the backend response so downstream pages can render real data. */
export function storeResumeResult(result: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable */
  }
}

export function getStoredResumeResult<T = ResumeUploadResponse>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function resumeStatus(result: ResumeUploadResponse | null): string {
  return String(result?.parse_status ?? result?.status ?? "").toLowerCase();
}

/** True when the backend signals parsing is complete. */
export function isResumeParseComplete(result: ResumeUploadResponse | null): boolean {
  return ["succeeded", "completed", "complete", "success"].includes(resumeStatus(result));
}

/** True when the backend signals parsing is still in progress. */
export function isProcessing(result: ResumeUploadResponse | null): boolean {
  return ["processing", "pending", "queued"].includes(resumeStatus(result));
}

/**
 * Uploads the CV as multipart/form-data (field name: `file`) with upload progress.
 * Uses XMLHttpRequest because fetch cannot report upload progress.
 */
export function uploadResume(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ResumeUploadResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/v1/resume/upload`);
    xhr.setRequestHeader("Accept", "application/json");
    // Do NOT set Content-Type — the browser sets the multipart boundary.
    const token = getStoredToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () =>
      reject(
        new ApiError(
          `Cannot reach the API at ${API_BASE_URL}. Is the FastAPI server running?`,
          0,
        ),
      );
    xhr.onabort = () => reject(new ApiError("Upload cancelled.", 0));

    xhr.onload = () => {
      let data: unknown = null;
      if (xhr.responseText) {
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((data ?? {}) as ResumeUploadResponse);
        return;
      }
      if (xhr.status === 401) clearStoredToken();
      reject(new ApiError(parseApiErrorMessage(data, xhr.status), xhr.status, data));
    };

    if (signal) signal.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(form);
  });
}
