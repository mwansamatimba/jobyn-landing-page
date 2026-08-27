import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Gauge,
  FileCheck2,
  Target,
  TrendingUp,
  AlertCircle,
  Trophy,
  Lightbulb,
  Shield,
  ArrowRight,
  BadgeCheck,
  Rocket,
  Brain,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchCandidateProfile, resolveCandidateId } from "@/lib/candidate-profile";
import { fetchLatestCareerCoach } from "@/lib/career";
import { ApiError, parseApiErrorMessage } from "@/lib/api";
import type { CandidateProfile } from "@/lib/candidate-profile";
import type { CareerCoachData } from "@/lib/career";

export const Route = createFileRoute("/snapshot")({
  head: () => ({
    meta: [
      { title: "AI Career Snapshot - Jobyn AI" },
      {
        name: "description",
        content:
          "Your instant AI Career Snapshot: career level, ATS score, top skills, missing skills, recommended roles, strengths and next actions.",
      },
      { property: "og:title", content: "AI Career Snapshot - Jobyn AI" },
      {
        property: "og:description",
        content:
          "See how AI reads your career - level, strengths, gaps and next best actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SnapshotPage,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const DASH = "\u2014"; // em-dash shown when a value is unavailable

function firstString(...values: (string | undefined | null)[]): string {
  for (const v of values) {
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return DASH;
}

function safeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v): v is string => typeof v === "string" && Boolean(v));
}

// ── Page component ───────────────────────────────────────────────────────────

function SnapshotPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [career, setCareer] = useState<CareerCoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const candidateId = await resolveCandidateId();
      if (!candidateId) {
        setError("Sign in and upload your CV first to generate a career snapshot.");
        setLoading(false);
        return;
      }

      // Fetch profile and career in parallel; career is optional
      const [profileResult, careerResult] = await Promise.allSettled([
        fetchCandidateProfile(candidateId),
        fetchLatestCareerCoach(),
      ]);

      if (cancelled) return;

      if (profileResult.status === "rejected") {
        const err = profileResult.reason;
        const msg =
          err instanceof ApiError
            ? parseApiErrorMessage(err.detail, err.status)
            : "Could not load your profile. Please try again.";
        setError(msg);
        setLoading(false);
        return;
      }

      setProfile(profileResult.value);

      if (careerResult.status === "fulfilled") {
        setCareer(careerResult.value);
      }
      // career failure is non-fatal — snapshot still renders with profile data

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Derived display values ──────────────────────────────────────────────

  const candidateName = firstString(profile?.name);
  const careerLevelLabel = firstString(
    career?.career_level,
    profile?.experience[0]?.role,
  );
  const headline = firstString(
    career?.summary,
    profile?.experience[0]
      ? `${profile.experience[0].role} at ${profile.experience[0].company}`
      : undefined,
  );

  const topSkills = profile?.skills?.map((s) => s.name).filter(Boolean) ?? [];
  const missingSkills = career
    ? [
        ...safeArray(career.skill_gaps?.map((g) => g.skill)),
        ...safeArray(career.current_skills?.filter((s) => !topSkills.includes(s))),
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)
    : [];

  const recommendedRoles: { title: string; match: number }[] = [
    ...(career?.recommendations?.map((r) => ({ title: r.role, match: r.match })) ?? []),
    ...(profile?.recommendedRoles ?? []),
  ]
    .filter((r) => r.title && r.title !== DASH)
    .filter((r, i, a) => a.findIndex((x) => x.title === r.title) === i)
    .slice(0, 5);

  const aiSummary = firstString(career?.summary, career?.career_level);
  const strengths = career?.strengths?.map((s) => s.title).filter(Boolean) ?? [];
  const improvements = career?.skill_gaps?.map((g) => g.skill).filter(Boolean) ?? [];
  const nextAction = firstString(
    career?.action_plan?.[0],
    career?.career_level
      ? `Focus on developing ${career.career_level} skills.`
      : undefined,
  );

  // ── Render states ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-56 mb-4" />
            <Skeleton className="h-5 w-96 mb-10" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/upload">Upload your CV <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.04] via-background to-background">
          <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI Career Snapshot
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              How AI sees {candidateName === DASH ? "your" : candidateName.split(" ")[0] + "'s"} career
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              {headline === DASH ? "Generated from your CV by the Jobyn AI Career Intelligence engine." : headline}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/profile">
                  View full profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/matches">See job matches</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Career Level */}
            <InsightCard icon={Trophy} title="Career Level" accent="primary" className="bg-gradient-to-br from-primary/5 to-background">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{careerLevelLabel}</span>
              </div>
              {career?.recommendations?.[0] && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Targeting: {career.recommendations[0].role}
                </p>
              )}
            </InsightCard>

            {/* ATS Score — not available from backend */}
            <InsightCard icon={Gauge} title="ATS Score" accent="emerald" className="bg-gradient-to-br from-[color:var(--emerald-soft)] to-background">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-muted">
                  <span className="text-lg font-bold text-muted-foreground">{DASH}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ATS scoring is not available in the current backend version.
                </p>
              </div>
            </InsightCard>

            {/* Completeness — not available */}
            <InsightCard icon={FileCheck2} title="Resume Completeness" accent="primary">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-muted">
                  <span className="text-lg font-bold text-muted-foreground">{DASH}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Completeness scoring is not available in the current backend version.
                </p>
              </div>
            </InsightCard>

            {/* Top Skills */}
            <InsightCard icon={BadgeCheck} title="Top Skills" accent="primary">
              {topSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topSkills.slice(0, 8).map((s) => (
                    <Badge key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{DASH}</p>
              )}
            </InsightCard>

            {/* Missing Skills */}
            <InsightCard icon={AlertCircle} title="Missing Skills" accent="amber">
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((s) => (
                    <Badge key={s} variant="outline" className="rounded-full border-amber-500/40 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{DASH}</p>
              )}
            </InsightCard>

            {/* Recommended Roles */}
            <InsightCard icon={Target} title="Recommended Roles" accent="emerald">
              {recommendedRoles.length > 0 ? (
                <ul className="space-y-3">
                  {recommendedRoles.slice(0, 4).map((r) => (
                    <li key={r.title}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{r.title}</span>
                        {r.match > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-[color:var(--emerald-soft)] px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <TrendingUp className="h-3 w-3" />
                            {r.match}%
                          </span>
                        )}
                      </div>
                      {r.match > 0 && <Progress value={r.match} className="mt-1.5 h-1.5" />}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{DASH}</p>
              )}
            </InsightCard>

            {/* AI Summary */}
            <InsightCard icon={Brain} title="AI Summary" accent="primary" className="md:col-span-2">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {aiSummary === DASH
                  ? "Run a Career Coach analysis to generate your AI summary."
                  : aiSummary}
              </p>
            </InsightCard>

            {/* Confidence — not available */}
            <InsightCard icon={Sparkles} title="Confidence Score" accent="emerald">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-muted">
                  <span className="text-lg font-bold text-muted-foreground">{DASH}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Confidence scoring is not available in the current backend version.
                </p>
              </div>
            </InsightCard>

            {/* Strengths */}
            <InsightCard icon={Trophy} title="Strength Areas" accent="emerald">
              {strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.slice(0, 5).map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run Career Coach to generate strength analysis.
                </p>
              )}
            </InsightCard>

            {/* Improvements */}
            <InsightCard icon={Lightbulb} title="Improvement Opportunities" accent="amber">
              {improvements.length > 0 ? (
                <ul className="space-y-2">
                  {improvements.slice(0, 5).map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run Career Coach to identify improvement areas.
                </p>
              )}
            </InsightCard>

            {/* Next Action */}
            <InsightCard
              icon={Rocket}
              title="Suggested Next Action"
              accent="primary"
              className="md:col-span-2 bg-gradient-to-br from-primary/8 via-background to-[color:var(--emerald-soft)]/40"
            >
              <p className="text-base font-medium text-foreground">
                {nextAction === DASH
                  ? "Complete your Career Coach analysis to receive personalised next actions."
                  : nextAction}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/matches">
                    Browse matched jobs <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/cover-letter">Generate a cover letter</Link>
                </Button>
              </div>
            </InsightCard>
          </div>

          {/* Trust signals */}
          <div className="mt-12 rounded-2xl border border-border/70 bg-surface/60 p-6 sm:p-8">
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Trust &amp; safety</p>
                  <p className="text-xs text-muted-foreground">How your data and this snapshot are handled.</p>
                </div>
              </div>
              <ul className="grid flex-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Privacy-first processing - your CV is not shared or sold.
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Secure document handling, encrypted in transit and at rest.
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Insights are AI-generated and improve as you refine your CV.
                </li>
                <li className="flex items-start gap-2">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Human review recommended before applying to any role.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  accent,
  className = "",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: "primary" | "emerald" | "amber";
  className?: string;
  children: React.ReactNode;
}) {
  const accentStyles =
    accent === "emerald"
      ? "bg-[color:var(--emerald-soft)] text-emerald-700 dark:text-emerald-300"
      : accent === "amber"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-primary/10 text-primary";

  return (
    <Card className={`group relative overflow-hidden border-border/70 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accentStyles}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">{title}</h3>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
