"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  MessageSquareText,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

const TOPIC_GROUPS = [
  {
    section: "Logical Reasoning",
    description: "Argument structure, assumptions, flaws, and answer-choice discipline.",
    topics: [
      "Flaw Questions",
      "Necessary Assumptions",
      "Strengthen/Weaken",
      "Parallel Reasoning",
      "Conditional Logic",
    ],
  },
  {
    section: "Reading Comprehension",
    description: "Passage mapping, viewpoint, inference, and comparative passage strategy.",
    topics: [
      "Main Point",
      "Inference/Detail",
      "Comparative Passages",
      "Author Attitude",
      "Passage Structure",
    ],
  },
];

const LEARN_FLOW = [
  "Choose topic",
  "Concept breakdown",
  "LSAT reasoning patterns",
  "Practice questions",
  "Review guidance",
];

type TopicSummary = { id: string; title: string; createdAt: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function mentorHref(topic: string) {
  return `/mentor?prompt=${encodeURIComponent(`Help me understand ${topic} for the LSAT and give me a practice plan.`)}`;
}

function topicDescription(topic: string) {
  const descriptions: Record<string, string> = {
    "Flaw Questions": "Name the precise reasoning error before you read the choices.",
    "Necessary Assumptions": "Find the missing bridge and test it with negation.",
    "Strengthen/Weaken": "Identify the argument's pressure point and change support strength.",
    "Parallel Reasoning": "Match argument structure without getting distracted by topic.",
    "Conditional Logic": "Translate sufficient and necessary conditions cleanly.",
    "Main Point": "Separate central claim from supporting detail and paragraph role.",
    "Inference/Detail": "Choose only what the passage actually supports.",
    "Comparative Passages": "Track agreement, disagreement, and each author's purpose.",
    "Author Attitude": "Read tone and viewpoint from precise textual signals.",
    "Passage Structure": "Map each paragraph's role in the author's argument.",
  };
  return descriptions[topic] ?? "Build a focused LSAT lesson and practice set.";
}

export default function MyLearningPage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const enabled = !userLoading && !!userData;

  const { data, isError } = useQuery<{ topics: TopicSummary[] }>({
    queryKey: ["my-learning-topics"],
    queryFn: () =>
      fetch("/api/my-learning/topics").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
    enabled,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load your topics");
  }, [isError]);

  async function handleSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/my-learning/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const { topicId } = await res.json();
      router.push(`/my-learning/${topicId}`);
    } catch {
      toast.error("Failed to generate topic. Please try again.");
      setIsGenerating(false);
    }
  }

  const topics = data?.topics ?? [];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row">
      <aside className="max-h-64 w-full shrink-0 border-b border-border px-4 py-5 lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r lg:py-6 lg:overflow-y-auto">
        <div className="mb-5 flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Previously Explored
          </span>
        </div>

        {topics.length === 0 ? (
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Generated LSAT lessons will appear here so you can return to them.
          </p>
        ) : (
          <nav className="space-y-1">
            {topics.map((t) => (
              <Link key={t.id} href={`/my-learning/${t.id}`}>
                <div className="group border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/85 group-hover:text-foreground">
                    {t.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(t.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="lsat-panel lsat-panel-highlight p-6">
              <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by Athena
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight">
                Learn LSAT concepts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Enter any LSAT topic and Athena will generate a structured lesson with concept breakdowns, reasoning patterns, practice questions, and review guidance.
              </p>

              <div className="mt-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="e.g. flaw questions, conditional logic, comparative passages..."
                    value={topic}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTopic(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") handleSubmit(topic);
                    }}
                    disabled={isGenerating}
                    className="h-12 w-full border border-border bg-background pl-11 pr-32 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSubmit(topic)}
                    disabled={isGenerating || !topic.trim()}
                    className="lsat-cta-primary absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? "Building..." : "Explore"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4 flex items-center gap-3 border border-primary/20 bg-primary/5 px-4 py-3"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      Athena is building your LSAT lesson...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lsat-panel p-6">
              <h2 className="text-lg font-semibold">How Learn Works</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Each generated topic follows the same LSAT study loop.
              </p>
              <div className="mt-6 space-y-3">
                {LEARN_FLOW.map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lsat-panel mt-8 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Topic Exploration</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose one topic, then build a lesson or ask Mentor for strategy.
                  </p>
                </div>
                <Target className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {TOPIC_GROUPS.map((group) => (
                  <div key={group.section} className="lsat-panel-soft border p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {group.section}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.description}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {group.topics.map((t) => (
                        <div key={t} className="lsat-panel-soft lsat-interactive border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{t}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {topicDescription(t)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubmit(t)}
                              disabled={isGenerating}
                              className="lsat-cta-primary inline-flex h-8 items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Build lesson
                              <ArrowRight className="h-3 w-3" />
                            </button>
                            <Link
                              href={mentorHref(t)}
                              className="lsat-cta-secondary inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <MessageSquareText className="h-3 w-3" />
                              Ask Mentor
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          </section>

          <section className="lsat-panel mt-8 p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Continue with structured review</h2>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Use the Study Library for an existing LSAT lesson, or open Review for the question type currently costing you the most points.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/study-library"
                  className="lsat-cta-secondary inline-flex h-10 items-center gap-2 border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  Study Library
                </Link>
                <Link
                  href="/learning"
                  className="lsat-cta-primary inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Review priorities
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
