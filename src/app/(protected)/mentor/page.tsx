"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Keyboard,
  Mic,
  Send,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMentorConversation } from "@/hooks/use-mentor-conversation";
import { MessageBubble } from "@/components/lessons/message-bubble";
import { VoiceOrb } from "@/components/lessons/voice-orb";
import { ThinkingIndicator } from "@/components/lessons/thinking-indicator";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { WhiteboardToolbar } from "@/components/whiteboard/whiteboard-toolbar";
import { WhiteboardTimeline } from "@/components/whiteboard/whiteboard-timeline";
import { useWhiteboardPlayer } from "@/hooks/use-whiteboard-player";
import type { SelectedElement } from "@/types/whiteboard";

type ProgressData = {
  user: {
    targetScore: number | null;
  };
  targetScore: number | null;
  topicPerformance: {
    name: string;
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  subtopicPerformance?: {
    name: string;
    topicName: string;
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    sessionCount: number;
  };
  sectionScores: {
    readingWriting: { accuracy: number };
    math: { accuracy: number };
  };
};

const MENTOR_MODES = [
  {
    key: "ask",
    title: "Ask Mentor",
    description: "Get a direct answer about LSAT strategy, timing, or a concept.",
    prompt: "How should I think about my current LSAT prep?",
    icon: Brain,
  },
  {
    key: "plan",
    title: "Build Study Plan",
    description: "Turn your target score and recent accuracy into a weekly plan.",
    prompt: "Build a study plan for this week based on my current progress.",
    icon: Target,
  },
  {
    key: "weak",
    title: "Explore Weak Areas",
    description: "Identify what to review next and how to practice it.",
    prompt: "Explain my weakest area and give me the next three steps.",
    icon: BarChart3,
  },
] as const;

function estimateScore(progress?: ProgressData) {
  if (!progress) return 120;
  const averageAccuracy =
    (progress.sectionScores.readingWriting.accuracy +
      progress.sectionScores.math.accuracy) /
    2;
  return Math.round(120 + (averageAccuracy / 100) * 60);
}

function scoreBand(score: number): string {
  if (score >= 170) return "Law school ready";
  if (score >= 165) return "Competitive";
  if (score >= 160) return "Strong foundation";
  if (score >= 150) return "Developing";
  return "Starting range";
}

function weakestArea(progress?: ProgressData) {
  const subtopics = [...(progress?.subtopicPerformance ?? [])]
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
  if (subtopics[0]) return subtopics[0];

  return [...(progress?.topicPerformance ?? [])]
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
}

export default function MentorPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get("prompt") ?? "");
  const [selectedMode, setSelectedMode] = useState<(typeof MENTOR_MODES)[number]["key"]>("ask");
  const [selections, setSelections] = useState<SelectedElement[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const {
    messages,
    mode,
    isRecording,
    isProcessing,
    isSpeaking,
    amplitude,
    whiteboardSteps,
    isWhiteboardStreaming,
    sendMessage,
    startRecording,
    stopRecording,
    toggleMode,
  } = useMentorConversation();

  const { data: progress } = useQuery<ProgressData>({
    queryKey: ["mentor-progress-context"],
    queryFn: () =>
      fetch("/api/progress").then((r) => {
        if (!r.ok) throw new Error("Failed to load progress");
        return r.json();
      }),
    staleTime: 60_000,
  });

  const {
    currentStepIndex,
    stepProgress,
    visibleStepIds,
    state: playerState,
    speed,
    play,
    pause,
    replay,
    seekToStep,
    changeSpeed,
  } = useWhiteboardPlayer(whiteboardSteps, isWhiteboardStreaming);

  const hasWhiteboard = whiteboardSteps.length > 0;
  const score = estimateScore(progress);
  const targetScore = progress?.user.targetScore ?? progress?.targetScore ?? 170;
  const scoreGap = Math.max(targetScore - score, 0);
  const currentWeakestArea = weakestArea(progress);
  const starterPrompts = useMemo(() => {
    const weakName = currentWeakestArea?.name ?? "my weakest LSAT area";
    const recentAccuracy = progress?.overallStats.accuracy ?? 0;
    if (selectedMode === "plan") {
      return [
        `Build a 7-day plan to move from ${score} toward ${targetScore}.`,
        `Plan my next three study sessions around ${weakName}.`,
        `Create a timed-practice schedule for a ${scoreGap}-point score gap.`,
        `Balance Logical Reasoning and Reading Comprehension this week.`,
      ];
    }
    if (selectedMode === "weak") {
      return [
        `Explain why ${weakName} is costing me points.`,
        `Give me a drill sequence for ${weakName}.`,
        `What should I review before another timed set at ${recentAccuracy}% accuracy?`,
        "Turn my recent misses into a focused review checklist.",
      ];
    }
    return [
      "How should I think about my current LSAT prep?",
      "What is the highest-leverage thing to do today?",
      "How do I improve Reading Comprehension without rereading too much?",
      "What should I do when two answer choices feel close?",
    ];
  }, [currentWeakestArea?.name, progress?.overallStats.accuracy, score, scoreGap, selectedMode, targetScore]);

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    if (!isWhiteboardStreaming) return;
    queueMicrotask(() => setSelections([]));
  }, [isWhiteboardStreaming]);

  const handleElementSelect = useCallback(
    (el: SelectedElement | null) => {
      if (!el) {
        setSelections([]);
        return;
      }
      setSelections([el]);
      const q =
        el.type === "write_math"
          ? `Can you explain this step: $${el.content}$?`
          : `Can you explain this further: "${el.content}"?`;
      setInput(q);
      if (mode === "voice") toggleMode();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [mode, toggleMode]
  );

  const handleElementToggle = useCallback((el: SelectedElement) => {
    setSelections((prev) => {
      const key = `${el.stepId}:${el.content}`;
      const exists = prev.some((s) => `${s.stepId}:${s.content}` === key);
      return exists
        ? prev.filter((s) => `${s.stepId}:${s.content}` !== key)
        : [...prev, el];
    });
  }, []);

  const handleElementsSelect = useCallback(
    (els: SelectedElement[]) => {
      setSelections(els);
      if (mode === "voice") toggleMode();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [mode, toggleMode]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const voiceOrbState: "idle" | "listening" | "processing" | "speaking" =
    isRecording
      ? "listening"
      : isProcessing
        ? "processing"
        : isSpeaking
          ? "speaking"
          : "idle";

  return (
    <div className="flex h-[calc(100dvh-64px)]">
      {/* Chat column */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          hasWhiteboard ? "w-1/2 border-r" : "w-full"
        }`}
      >
        {/* Scrollable messages area */}
        <div
          ref={scrollRef}
          onScroll={checkNearBottom}
          className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6 lg:p-8"
        >
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="lsat-panel lsat-panel-highlight p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                        LSAT Study Planning Hub
                      </p>
                      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                        Mentor
                      </h1>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        Use Athena to connect your Learn topics, Review priorities, and practice results into a concrete LSAT plan. Ask a question, build a schedule, or dig into the area costing you the most points.
                      </p>
                    </div>
                    <div className="lsat-panel-soft border p-4 lg:min-w-48">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Estimated LSAT
                      </p>
                      <p className="mt-2 text-4xl font-bold tabular-nums">{score}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {scoreBand(score)} · {scoreGap === 0 ? "target reached" : `${scoreGap} points to ${targetScore}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {MENTOR_MODES.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        setSelectedMode(item.key);
                        setInput(item.prompt);
                      }}
                      className={[
                        "lsat-panel lsat-interactive min-h-44 border p-5 text-left hover:bg-muted/40",
                        selectedMode === item.key
                          ? "lsat-selected"
                          : "border-border/70",
                      ].join(" ")}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <p className="mt-5 font-semibold">{item.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
                <div className="lsat-panel p-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                      Study Context
                    </p>
                  </div>
                  <dl className="mt-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">Target score</dt>
                      <dd className="text-sm font-medium">{targetScore}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">Score gap</dt>
                      <dd className="text-sm font-medium">{scoreGap} points</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">Recent accuracy</dt>
                      <dd className="text-sm font-medium">{progress?.overallStats.accuracy ?? 0}%</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">Weakest area</dt>
                      <dd className="max-w-40 truncate text-right text-sm font-medium">
                        {currentWeakestArea?.name ?? "Not enough data"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="lsat-panel p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Performance-aware prompts</h2>
                      <p className="text-sm text-muted-foreground">
                        These update based on the selected mentor mode.
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="grid gap-2">
                    {starterPrompts.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="lsat-panel-soft lsat-interactive border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lsat-panel p-4 xl:col-span-2">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Ask Mentor</h2>
                    <p className="text-sm text-muted-foreground">
                      Start with a question, or choose a mode/prompt above and refine it here.
                    </p>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    LSAT planning chat
                  </p>
                </div>
                {mode === "text" ? (
                  <form onSubmit={handleSubmit} className="lsat-panel-soft flex items-end gap-2 border p-2">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask your mentor anything..."
                      className="min-h-[38px] max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                      rows={1}
                      disabled={isProcessing}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0"
                      onClick={toggleMode}
                      title="Switch to voice mode"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <motion.div
                      whileTap={{ scale: 0.9, rotate: -12 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0"
                        disabled={!input.trim() || isProcessing}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </form>
                ) : (
                  <div className="lsat-panel-soft flex flex-col items-center gap-4 border p-5">
                    <VoiceOrb
                      state={voiceOrbState}
                      amplitude={amplitude}
                      onTap={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing && !isRecording}
                    />
                    <p className="text-sm text-muted-foreground">
                      {isRecording
                        ? "Listening... tap to stop"
                        : isProcessing
                          ? "Processing..."
                          : isSpeaking
                            ? "Speaking..."
                            : "Tap to speak"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={toggleMode}
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      Switch to text
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          <AnimatePresence>
            {isProcessing && !messages.some((m) => m.isStreaming) && (
              <ThinkingIndicator />
            )}
          </AnimatePresence>

          {/* Speaking indicator */}
          {isSpeaking && !isProcessing && (
            <motion.p
              className="text-xs text-muted-foreground px-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Athena is speaking...
            </motion.p>
          )}
        </div>

        {/* Input area */}
        {mode === "text" ? (
          messages.length > 0 && (
          <form
            onSubmit={handleSubmit}
            className="border-t bg-background/80 p-3 md:px-6 lg:px-8"
          >
            <div className={hasWhiteboard ? "flex items-end gap-2" : "lsat-panel mx-auto flex w-full max-w-7xl items-end gap-2 p-2"}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your mentor anything..."
                className="min-h-[36px] max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                rows={1}
                disabled={isProcessing}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={toggleMode}
                title="Switch to voice mode"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <motion.div
                whileTap={{ scale: 0.9, rotate: -12 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  disabled={!input.trim() || isProcessing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </form>
          )
        ) : (
          messages.length > 0 && (
          <div className="flex flex-col items-center gap-4 border-t p-6">
            <VoiceOrb
              state={voiceOrbState}
              amplitude={amplitude}
              onTap={isRecording ? stopRecording : startRecording}
              disabled={isProcessing && !isRecording}
            />
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? "Listening... tap to stop"
                : isProcessing
                  ? "Processing..."
                  : isSpeaking
                    ? "Speaking..."
                    : "Tap to speak"}
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={toggleMode}
            >
              <Keyboard className="h-3.5 w-3.5" />
              Switch to text
            </Button>
          </div>
          )
        )}
      </div>

      {/* Whiteboard panel */}
      <AnimatePresence>
        {hasWhiteboard && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "50%" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col overflow-hidden"
          >
            <WhiteboardToolbar
              state={playerState}
              speed={speed}
              currentStep={currentStepIndex}
              totalSteps={whiteboardSteps.length}
              isStreaming={isWhiteboardStreaming}
              onPlay={play}
              onPause={pause}
              onReplay={replay}
              onSpeedChange={changeSpeed}
            />

            <div className="flex-1 min-h-0">
              <WhiteboardCanvas
                steps={whiteboardSteps}
                visibleStepIds={visibleStepIds}
                currentStepIndex={currentStepIndex}
                stepProgress={stepProgress}
                selections={selections}
                onElementSelect={handleElementSelect}
                onElementToggle={handleElementToggle}
                onElementsSelect={handleElementsSelect}
              />
            </div>

            {whiteboardSteps.length > 1 && (
              <WhiteboardTimeline
                totalSteps={whiteboardSteps.length}
                currentStep={currentStepIndex}
                visibleStepIds={visibleStepIds}
                stepIds={whiteboardSteps.map((s) => s.id)}
                onSeek={seekToStep}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
