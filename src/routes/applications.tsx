import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Sparkles,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  fetchApplications,
  createApplication,
  updateApplication,
  STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationRead,
  type ApplicationStatus,
} from "@/lib/applications";
import { fetchJobOptions, type JobOption } from "@/lib/cover-letter";
import { ApiError, parseApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My Applications - Jobyn AI" },
      { name: "description", content: "Track your job applications." },
    ],
  }),
  component: ApplicationsPage,
});

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  applied: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  under_review: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  interviewing: "bg-primary/10 text-primary",
  offered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground line-through",
};

const NEXT_STATUSES: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  draft: "applied",
  applied: "under_review",
  under_review: "interviewing",
  interviewing: "offered",
};

function AppSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <Card key={n} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRead[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [selectedJobId, setSelectedJobId] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsData, jobsData] = await Promise.all([
        fetchApplications({ limit: 50 }),
        fetchJobOptions(),
      ]);
      setApplications(appsData.items);
      setJobs(jobsData);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? parseApiErrorMessage(err.detail, err.status)
          : "Could not load applications. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!selectedJobId) { setCreateError("Please select a job."); return; }
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      const app = await createApplication({
        job_id: selectedJobId,
        cover_letter: coverLetterText.trim() || undefined,
        status: "applied",
      });
      setApplications((prev) => [app, ...prev]);
      setSelectedJobId("");
      setCoverLetterText("");
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? parseApiErrorMessage(err.detail, err.status)
          : "Failed to create application.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAdvanceStatus = async (app: ApplicationRead) => {
    const next = NEXT_STATUSES[app.status];
    if (!next) return;
    try {
      const updated = await updateApplication(app.id, { status: next });
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch {
      // silently ignore — user can retry
    }
  };

  const jobLabel = (jobId: string) => {
    const j = jobs.find((j) => j.id === jobId);
    return j ? `${j.title} @ ${j.company}` : jobId.slice(0, 8) + "...";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Briefcase className="h-4 w-4" /> Application Tracking
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              My Applications
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Track every role you&apos;ve applied to. Update statuses as you move through the hiring pipeline.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 space-y-8">
          {/* Create application card */}
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground mb-5">
              <Sparkles className="h-4 w-4 text-primary" /> Apply to a job
            </h2>

            {createError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            {createSuccess && (
              <Alert className="mb-4 border-emerald-500/40 bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                  Application submitted successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Select a job
                </label>
                <div className="relative">
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{jobs.length === 0 ? "Loading jobs..." : "-- select a job --"}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} @ {j.company}{j.location ? ` · ${j.location}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !selectedJobId}
                className="w-full sm:w-auto"
              >
                {creating ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Briefcase className="mr-2 h-4 w-4" /> Submit Application</>
                )}
              </Button>
            </div>
          </Card>

          {/* Applications list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {loading ? "Loading..." : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
              </h2>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {error && !loading && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && <AppSkeleton />}

            {!loading && !error && applications.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-foreground">No applications yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Select a job above and submit your first application.
                </p>
              </div>
            )}

            {!loading && !error && applications.length > 0 && (
              <div className="space-y-3">
                {applications.map((app) => {
                  const next = NEXT_STATUSES[app.status];
                  return (
                    <Card
                      key={app.id}
                      className="p-5 border-border/70 transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {jobLabel(app.job_id)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Applied {app.applied_at ?? app.created_at?.slice(0, 10) ?? "—"}
                          </p>
                          {app.notes && (
                            <p className="mt-1.5 text-xs text-muted-foreground italic truncate">
                              {app.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              STATUS_COLORS[app.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {STATUS_LABELS[app.status] ?? app.status}
                          </span>
                          {next && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleAdvanceStatus(app)}
                            >
                              → {STATUS_LABELS[next]}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
