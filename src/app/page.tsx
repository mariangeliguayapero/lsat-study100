import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticlesBackground } from "@/components/particles-background";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <ParticlesBackground />
      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-xl font-bold tracking-tight text-athena-navy dark:text-athena-amber">
          Athena
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-block rounded-full bg-athena-amber/10 px-4 py-1.5 text-sm font-medium text-athena-amber dark:text-athena-amber-light">
            Education Reimagined
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Consistency beats
            <br />
            <span className="text-athena-amber dark:text-athena-amber-light">
              intensity.
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Athena combines adaptive AI tutoring with structured accountability
            to build the study habits that actually raise your score.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/sign-up">
              <Button size="lg" className="px-8">
                Start preparing
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "Adaptive Quiz",
              desc: "Level-setting diagnostic that identifies your exact gaps.",
            },
            {
              title: "Aha Moments",
              desc: "Interactive lessons that build deep understanding, not rote memory.",
            },
            {
              title: "Accountability",
              desc: "Weekly commitments and session tracking to keep momentum.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 text-left"
            >
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        Athena &mdash; Built for students who show up.
      </footer>
    </div>
  );
}
