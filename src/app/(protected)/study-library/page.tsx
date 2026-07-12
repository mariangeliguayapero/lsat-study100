"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  LibraryBig,
  PlayCircle,
} from "lucide-react";
import { getTopicIcon } from "@/lib/topic-icons";
import { cn } from "@/lib/utils";

type Subtopic = {
  id: string;
  slug: string;
  name: string;
  difficulty: string;
  estimatedMinutes: number;
  description: string;
};

type Topic = {
  id: string;
  slug: string;
  name: string;
  overview: string;
  estimatedTotalMinutes: number;
  subject: string;
  subtopics: Subtopic[];
};

const SECTIONS = [
  { value: "all", label: "All topics" },
  { value: "logical-reasoning", label: "Logical Reasoning" },
  { value: "reading-comprehension", label: "Reading Comprehension" },
] as const;

function sectionLabel(subject: string) {
  return subject === "reading-comprehension"
    ? "Reading Comprehension"
    : "Logical Reasoning";
}

export default function StudyLibraryPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["value"]>("all");
  const { data, isLoading, isError } = useQuery<{ topics: Topic[] }>({
    queryKey: ["study-library"],
    queryFn: () =>
      fetch("/api/learning").then((response) => {
        if (!response.ok) throw new Error("Failed to load study library");
        return response.json();
      }),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load the study library");
  }, [isError]);

  const topics = useMemo(() => {
    const allTopics = data?.topics ?? [];
    return section === "all"
      ? allTopics
      : allTopics.filter((topic) => topic.subject === section);
  }, [data?.topics, section]);

  return (
    <div className="p-4 pb-16 md:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              Focused Study Library
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Browse LSAT review content
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Choose a section or question type, rebuild the underlying reasoning pattern,
              then apply it in a focused practice set.
            </p>
          </div>
          <Link
            href="/mentor?prompt=Help%20me%20choose%20the%20highest-impact%20LSAT%20topic%20to%20study%20next."
            className="lsat-cta-secondary inline-flex h-10 items-center justify-center gap-2 border px-4 text-sm font-semibold text-primary transition-colors hover:border-primary/45 hover:bg-muted"
          >
            <Brain className="h-4 w-4" />
            Ask Mentor what to study
          </Link>
        </header>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter study library by section">
          {SECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSection(item.value)}
              className={cn(
                "inline-flex h-10 items-center border px-4 text-sm font-medium transition-colors",
                section === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-72 animate-pulse border bg-muted/60" />
            ))}
          </div>
        ) : topics.length > 0 ? (
          <div className="mt-7 grid items-start gap-5 lg:grid-cols-2">
            {topics.map((topic) => {
              const Icon = getTopicIcon(topic.slug);
              return (
                <article key={topic.id} className="lsat-panel lsat-interactive p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {sectionLabel(topic.subject)}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">{topic.name}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {topic.overview}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {topic.estimatedTotalMinutes} min total
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
                    {topic.subtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        className="lsat-panel-soft flex flex-col gap-3 border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{subtopic.name}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {subtopic.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Link
                            href={`/learning/${topic.slug}/${subtopic.slug}/micro-lesson`}
                            className="lsat-cta-secondary inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Lesson
                          </Link>
                          <Link
                            href={`/learning/${topic.slug}/${subtopic.slug}/quiz`}
                            className="lsat-cta-primary inline-flex h-8 items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Practice
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/learning/${topic.slug}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    View all {topic.name} content
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-7 border border-dashed border-border p-10 text-center">
            <LibraryBig className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No LSAT review content is available for this section yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
