import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/snapshot")({
  head: () => ({
    meta: [
      { title: "AI Career Snapshot — Jobyn AI" },
      { name: "description", content: "Your instant AI Career Snapshot: career level, ATS score, top skills, missing skills, recommended roles, strengths and next actions." },
      { property: "og:title", content: "AI Career Snapshot — Jobyn AI" },
      { property: "og:description", content: "See how AI reads your career — level, ATS score, strengths, gaps and next best actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SnapshotPage,
});

// Placeholder values, used only until the backend response supplies real data.
const demoSnapshot: SnapshotData = {

  candidateName: "Alex Morgan",
  headline: "Senior Frontend Engineer · 7 yrs experience",
  careerLevel: { label: "Senior", tier: "IC5 / L5 equivalent", progress: 78 },
  atsScore: 86,
  completeness: 82,
  confidence: 91,
  topSkills: ["React", "TypeScript", "Next.js", "Design Systems", "Tailwind CSS", "Playwright"],
  missingSkills: ["System Design", "Kubernetes", "GraphQL Federation", "Leadership metrics"],
  recommendedRoles: [
    { title: "Staff Frontend Engineer", match: 94 },
    { title: "Frontend Tech Lead", match: 91 },
    { title: "Design Systems Engineer", match: 82 },
  ],
  aiSummary:
    "Alex is a senior frontend engineer with strong product intuition and a track record of leading performance and design-system initiatives. Their profile shows excellent depth in modern React and TypeScript ecosystems, with growing full-stack range. Ready to step into staff-level or technical leadership roles at a product-led company.",
  strengths: [
    "Consistent impact on performance and DX",
    "Design system ownership across teams",
    "Mentors and hires other engineers",
  ],
  improvements: [
    "Quantify leadership outcomes (headcount, scope)",
    "Highlight cross-functional partnerships explicitly",
    "Add recent system-design or platform work",
  ],
  nextAction:
    "Apply to 3 Staff Frontend roles this week and refresh the top of your CV with two quantified impact bullets.",
};

function SnapshotPage() {
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
              How AI sees {snapshot.candidateName.split(" ")[0]}'s career
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              {snapshot.headline}. Generated in seconds from your CV — refined
              by our AI Career Intelligence engine.
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
            <InsightCard
              icon={Trophy}
              title="Career Level"
              accent="primary"
              className="bg-gradient-to-br from-primary/5 to-background"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {snapshot.careerLevel.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {snapshot.careerLevel.tier}
                </span>
              </div>
              <Progress value={snapshot.careerLevel.progress} className="mt-4 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {snapshot.careerLevel.progress}% of the way toward Staff / L6.
              </p>
            </InsightCard>

            {/* ATS Score */}
            <InsightCard
              icon={Gauge}
              title="ATS Score"
              accent="emerald"
              className="bg-gradient-to-br from-[color:var(--emerald-soft)] to-background"
            >
              <ScoreRing value={snapshot.atsScore} tint="emerald" />
              <p className="mt-3 text-xs text-muted-foreground">
                Your resume parses cleanly against most applicant tracking
                systems.
              </p>
            </InsightCard>

            {/* Completeness */}
            <InsightCard icon={FileCheck2} title="Resume Completeness" accent="primary">
              <ScoreRing value={snapshot.completeness} tint="primary" />
              <p className="mt-3 text-xs text-muted-foreground">
                Add portfolio links and certifications to reach 100%.
              </p>
            </InsightCard>

            {/* Top Skills */}
            <InsightCard icon={BadgeCheck} title="Top Skills" accent="primary">
              <div className="flex flex-wrap gap-2">
                {snapshot.topSkills.map((s) => (
                  <Badge
                    key={s}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </InsightCard>

            {/* Missing Skills */}
            <InsightCard icon={AlertCircle} title="Missing Skills" accent="amber">
              <div className="flex flex-wrap gap-2">
                {snapshot.missingSkills.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="rounded-full border-amber-500/40 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Common gaps for staff-level frontend roles.
              </p>
            </InsightCard>

            {/* Recommended Roles */}
            <InsightCard icon={Target} title="Recommended Roles" accent="emerald">
              <ul className="space-y-3">
                {snapshot.recommendedRoles.map((r) => (
                  <li key={r.title}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{r.title}</span>
                      <span className="flex items-center gap-1 rounded-full bg-[color:var(--emerald-soft)] px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="h-3 w-3" />
                        {r.match}%
                      </span>
                    </div>
                    <Progress value={r.match} className="mt-1.5 h-1.5" />
                  </li>
                ))}
              </ul>
            </InsightCard>

            {/* AI Summary */}
            <InsightCard
              icon={Brain}
              title="AI Summary"
              accent="primary"
              className="md:col-span-2"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {snapshot.aiSummary}
              </p>
            </InsightCard>

            {/* Confidence */}
            <InsightCard icon={Sparkles} title="Confidence Score" accent="emerald">
              <ScoreRing value={snapshot.confidence} tint="emerald" />
              <p className="mt-3 text-xs text-muted-foreground">
                How certain our AI is about this snapshot, based on CV quality
                and signal density.
              </p>
            </InsightCard>

            {/* Strengths */}
            <InsightCard icon={Trophy} title="Strength Areas" accent="emerald">
              <ul className="space-y-2">
                {snapshot.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                    {s}
                  </li>
                ))}
              </ul>
            </InsightCard>

            {/* Improvements */}
            <InsightCard icon={Lightbulb} title="Improvement Opportunities" accent="amber">
              <ul className="space-y-2">
                {snapshot.improvements.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </InsightCard>

            {/* Next Action */}
            <InsightCard
              icon={Rocket}
              title="Suggested Next Action"
              accent="primary"
              className="md:col-span-2 bg-gradient-to-br from-primary/8 via-background to-[color:var(--emerald-soft)]/40"
            >
              <p className="text-base font-medium text-foreground">
                {snapshot.nextAction}
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
                  <p className="text-sm font-semibold text-foreground">
                    Trust &amp; safety
                  </p>
                  <p className="text-xs text-muted-foreground">
                    How your data and this snapshot are handled.
                  </p>
                </div>
              </div>
              <ul className="grid flex-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Privacy-first processing — your CV isn't shared or sold.
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
    <Card
      className={`group relative overflow-hidden border-border/70 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accentStyles}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
          {title}
        </h3>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function ScoreRing({ value, tint }: { value: number; tint: "primary" | "emerald" }) {
  const color = tint === "emerald" ? "var(--emerald)" : "var(--primary)";
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${value * 3.6}deg, color-mix(in oklab, ${color} 12%, transparent) 0deg)`,
        }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-background">
          <span className="text-lg font-bold text-foreground">{value}</span>
        </div>
      </div>
      <div className="flex-1">
        <Progress value={value} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">out of 100</p>
      </div>
    </div>
  );
}
