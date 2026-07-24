import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Target,
  Mail,
  MapPin,
  Phone,
  Award,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Candidate Profile — Jobyn AI" },
      { name: "description", content: "AI-generated candidate profile with extracted skills, education, work experience, recommended roles, and completion score." },
      { property: "og:title", content: "Candidate Profile — Jobyn AI" },
      { property: "og:description", content: "See your extracted profile: skills, experience, education and recommended job titles." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

// --- Mock candidate data (would come from the resume-parsing API) ---
const candidate = {
  name: "Alex Morgan",
  headline: "Senior Frontend Engineer",
  location: "Berlin, Germany",
  email: "alex.morgan@example.com",
  phone: "+49 30 1234 5678",
  summary:
    "Product-minded frontend engineer with 7+ years building performant web apps in React, TypeScript and modern tooling. Passionate about design systems, DX, and shipping quickly.",
  completion: {
    score: 82,
    sections: [
      { label: "Contact info", done: true },
      { label: "Work experience", done: true },
      { label: "Education", done: true },
      { label: "Skills", done: true },
      { label: "Portfolio links", done: false },
      { label: "Certifications", done: false },
    ],
  },
  skills: [
    { name: "React", level: "Expert" },
    { name: "TypeScript", level: "Expert" },
    { name: "Next.js", level: "Advanced" },
    { name: "Tailwind CSS", level: "Advanced" },
    { name: "Node.js", level: "Intermediate" },
    { name: "GraphQL", level: "Intermediate" },
    { name: "Design Systems", level: "Advanced" },
    { name: "Testing (Vitest, Playwright)", level: "Advanced" },
    { name: "AWS", level: "Intermediate" },
    { name: "Figma", level: "Intermediate" },
  ],
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "Northwind Labs",
      location: "Berlin, Germany",
      period: "2022 — Present",
      bullets: [
        "Led migration from CRA to Next.js App Router, cutting TTI by 43%.",
        "Built internal design system used by 6 product teams.",
        "Mentored 4 mid-level engineers; ran hiring loops.",
      ],
    },
    {
      role: "Frontend Engineer",
      company: "Cobalt Health",
      location: "Remote",
      period: "2019 — 2022",
      bullets: [
        "Owned patient-facing dashboard used by 120k monthly users.",
        "Introduced Playwright end-to-end tests, reducing regressions by 60%.",
      ],
    },
    {
      role: "Junior Web Developer",
      company: "Studio Kite",
      location: "London, UK",
      period: "2017 — 2019",
      bullets: [
        "Delivered 20+ client marketing sites on tight timelines.",
        "Introduced component library, cutting new-site setup from days to hours.",
      ],
    },
  ],
  education: [
    {
      degree: "B.Sc. Computer Science",
      school: "University of Manchester",
      period: "2013 — 2017",
      detail: "First-class honours. Focus on HCI and distributed systems.",
    },
    {
      degree: "Frontend Masters — Advanced React",
      school: "Frontend Masters",
      period: "2021",
      detail: "Certificate of completion.",
    },
  ],
  recommendedRoles: [
    { title: "Staff Frontend Engineer", match: 94 },
    { title: "Frontend Tech Lead", match: 91 },
    { title: "Senior Full-Stack Engineer", match: 84 },
    { title: "Design Systems Engineer", match: 82 },
    { title: "Web Platform Engineer", match: 78 },
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfilePage() {
  const { completion } = candidate;
  const done = completion.sections.filter((s) => s.done).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
          {/* Header */}
          <Card className="mb-8 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {candidate.name}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">{candidate.headline}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {candidate.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> {candidate.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {candidate.phone}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Edit profile</Button>
                <Button>Find jobs</Button>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {candidate.summary}
            </p>
          </Card>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-8 lg:col-span-2">
              {/* Skills */}
              <Card className="p-6 sm:p-8">
                <SectionHeader icon={Sparkles} title="Extracted Skills" />
                <div className="mt-5 flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge
                      key={skill.name}
                      variant="secondary"
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/15"
                    >
                      {skill.name}
                      <span className="ml-2 text-xs text-primary/70">{skill.level}</span>
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Experience */}
              <Card className="p-6 sm:p-8">
                <SectionHeader icon={Briefcase} title="Work Experience" />
                <ol className="mt-6 space-y-6 border-l border-border pl-6">
                  {candidate.experience.map((job) => (
                    <li key={job.role + job.company} className="relative">
                      <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {job.role} · <span className="text-primary">{job.company}</span>
                        </h3>
                        <span className="text-xs text-muted-foreground">{job.period}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{job.location}</p>
                      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                        {job.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </Card>

              {/* Education */}
              <Card className="p-6 sm:p-8">
                <SectionHeader icon={GraduationCap} title="Education" />
                <div className="mt-5 space-y-5">
                  {candidate.education.map((ed) => (
                    <div key={ed.degree} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{ed.degree}</h3>
                        <span className="text-xs text-muted-foreground">{ed.period}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-primary">{ed.school}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{ed.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Completion */}
              <Card className="p-6">
                <SectionHeader icon={Award} title="Profile Completion" />
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xl font-bold text-primary">{completion.score}%</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={completion.score} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {done} of {completion.sections.length} sections complete
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2">
                  {completion.sections.map((s) => (
                    <li
                      key={s.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
                        {s.label}
                      </span>
                      {s.done ? (
                        <span className="text-xs font-medium text-primary">Done</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Add
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recommended roles */}
              <Card className="p-6">
                <SectionHeader icon={Target} title="Recommended Roles" />
                <ul className="mt-5 space-y-3">
                  {candidate.recommendedRoles.map((role) => (
                    <li
                      key={role.title}
                      className="rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-foreground">{role.title}</span>
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <TrendingUp className="h-3 w-3" />
                          {role.match}%
                        </span>
                      </div>
                      <Progress value={role.match} className="mt-2 h-1.5" />
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}
