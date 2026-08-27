import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Briefcase, MapPin, Sparkles, TrendingUp, Check, X, ArrowRight, Building2, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchMatches, type MatchJob } from "@/lib/matches";
import { ApiError, parseApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Job Matches - Jobyn AI" }] }),
  component: MatchesPage,
});

function JobCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/70 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-1.5 w-full" />
      <Skeleton className="mt-6 h-16 w-full rounded-xl" />
    </Card>
  );
}

function MatchesPage() {
  const [jobs, setJobs] = useState<MatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetchMatches(10)
      .then((data) => { if (!cancelled) setJobs(data.jobs); })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError
          ? parseApiErrorMessage(err.detail, err.status)
          : "Could not load job matches. Please try again.";
        setError(msg);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> AI Job Matching
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Roles hand-picked for your profile
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Each match is scored and explained. See exactly which skills line up and which ones would take you to the next level.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {error && !loading && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading && (
            <div className="grid gap-6">
              {[1,2,3].map((n) => <JobCardSkeleton key={n} />)}
            </div>
          )}
          {!loading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-foreground">No matches yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload your CV and ensure job listings are available, then check back here for your personalised matches.
              </p>
            </div>
          )}
          {!loading && !error && jobs.length > 0 && (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="overflow-hidden border-border/70 p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{job.title}</h2>
                        <p className="mt-0.5 text-sm text-primary">{job.company}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                          {job.salary && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.salary}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-full bg-[color:var(--emerald-soft)] px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="h-3.5 w-3.5" /> {job.match}% match
                      </div>
                    </div>
                  </div>
                  <Progress value={job.match} className="mt-5 h-1.5" />
                  <div className="mt-6 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-[color:var(--emerald-soft)]/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Why this job?</p>
                        <p className="mt-1 text-sm text-foreground">{job.explanation}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matching skills</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.matching.length > 0 ? job.matching.map((s) => (
                          <Badge key={s} className="rounded-full bg-[color:var(--emerald-soft)] px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:bg-[color:var(--emerald-soft)] dark:text-emerald-300">
                            <Check className="mr-1 h-3 w-3" /> {s}
                          </Badge>
                        )) : <span className="text-xs text-muted-foreground">None identified</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills to grow</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.missing.length > 0 ? job.missing.map((s) => (
                          <Badge key={s} variant="outline" className="rounded-full border-amber-500/40 bg-amber-500/5 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <X className="mr-1 h-3 w-3" /> {s}
                          </Badge>
                        )) : <span className="text-xs text-muted-foreground">None identified</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/cover-letter">Generate cover letter <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline">Save role</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-border/70 bg-surface/60 p-5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>Matches are generated from your CV and active job listings. We recommend a quick human review before applying to any role.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
