"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { MicroLesson } from "@/components/learning/micro-lesson";
import type { Problem } from "@/components/quiz/types";
import type { WhiteboardStep } from "@/types/whiteboard";
import { LearningWorkspaceState } from "@/components/whiteboard/learning-workspace-state";

const HARDCODED_PROBLEMS: Problem[] = [
  {
    id: "hardcoded-linear-eq-1",
    orderIndex: 0,
    difficulty: "medium",
    questionText:
      "The equation y = -2x - 1 is graphed in the xy-plane. What is the slope and y-intercept of the line?",
    options: [
      "Slope: -2, y-intercept: -1",
      "Slope: -1, y-intercept: -2",
      "Slope: 2, y-intercept: -1",
      "Slope: -2, y-intercept: 1",
    ],
    correctOption: 0,
    explanation:
      "In the slope-intercept form y = mx + b, the coefficient of x is the slope (m = -2) and the constant term is the y-intercept (b = -1).",
    solutionSteps: [
      { step: 1, instruction: "Identify the slope-intercept form", math: "y = mx + b" },
      { step: 2, instruction: "Read off the slope", math: "m = -2" },
      { step: 3, instruction: "Read off the y-intercept", math: "b = -1" },
    ],
    hint: "Compare the equation to the slope-intercept form y = mx + b.",
    timeRecommendationSeconds: 30,
  },
  {
    id: "hardcoded-linear-eq-2",
    orderIndex: 1,
    difficulty: "medium",
    questionText:
      "The equation y = 5x + 5 is graphed in the xy-plane. At what point does the line cross the x-axis?",
    options: ["(-1, 0)", "(0, 5)", "(1, 0)", "(5, 0)"],
    correctOption: 0,
    explanation:
      "The line crosses the x-axis when y = 0. Setting 0 = 5x + 5 and solving gives x = -1, so the x-intercept is (-1, 0).",
    solutionSteps: [
      { step: 1, instruction: "Set y = 0 to find the x-intercept", math: "0 = 5x + 5" },
      { step: 2, instruction: "Subtract 5 from both sides", math: "-5 = 5x" },
      { step: 3, instruction: "Divide both sides by 5", math: "x = -1" },
    ],
    hint: "The x-axis is where y = 0. Plug that in and solve for x.",
    timeRecommendationSeconds: 45,
  },
];

const LSAT_STARTER_LESSONS: Record<
  string,
  { lessonContent: string; whiteboardSteps: WhiteboardStep[] }
> = {
  "flaw-questions": {
    lessonContent:
      "Flaw questions ask you to identify the reasoning error that keeps an argument from being fully persuasive. Read for the conclusion, find the support, then ask what assumption or jump connects them.",
    whiteboardSteps: [
      {
        id: 1,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "Flaw questions are about structure, not whether the topic sounds believable.",
        displayText:
          "Flaw questions test the gap between the evidence and the conclusion.",
        action: {
          type: "table",
          headers: ["Part", "What To Find"],
          rows: [
            ["Conclusion", "What the author wants you to accept"],
            ["Evidence", "The reason the author gives"],
            ["Gap", "The unsupported jump between them"],
          ],
          highlightCells: [{ row: 2, col: 1, color: "rgba(245, 158, 11, 0.35)" }],
        },
      },
      {
        id: 2,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "A common flaw is confusing correlation with causation.",
        displayText:
          "If two things happen together, the author still has not proven one caused the other.",
        action: {
          type: "write_text",
          text: "Pattern: X is associated with Y, so X caused Y.",
          style: { fontSize: "lg", fontWeight: "bold" },
          align: "center",
        },
      },
      {
        id: 3,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "The right answer describes the flaw in general reasoning terms.",
        displayText:
          "Correct flaw answers usually describe the reasoning mistake, not the topic.",
        action: {
          type: "check_in",
          question:
            "A study found that people who drink green tea report lower stress. The author concludes green tea reduces stress. What is the flaw?",
          options: [
            "It overlooks that less-stressed people may be more likely to drink green tea.",
            "It proves green tea is unhealthy.",
            "It assumes all tea tastes the same.",
            "It compares tea to coffee without data.",
          ],
          correctOption: 0,
          explanation:
            "The argument treats an association as proof of causation. Another explanation could be that lower-stress people choose green tea.",
          hint: "Ask whether the evidence proves the direction of cause.",
        },
      },
    ],
  },
  "assumption-questions": {
    lessonContent:
      "Assumption questions ask for an unstated idea the argument needs in order to work. Find the conclusion, identify the support, and look for the missing bridge.",
    whiteboardSteps: [
      {
        id: 1,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "An assumption is not extra evidence. It is something the argument already depends on.",
        displayText:
          "Assumption = the hidden bridge between evidence and conclusion.",
        action: {
          type: "table",
          headers: ["Argument Part", "Role"],
          rows: [
            ["Evidence", "What is stated"],
            ["Conclusion", "What is claimed"],
            ["Assumption", "What must be true for the move to work"],
          ],
          highlightCells: [{ row: 2, col: 1, color: "rgba(245, 158, 11, 0.35)" }],
        },
      },
      {
        id: 2,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "Use the negation test for necessary assumption questions.",
        displayText:
          "Negate the answer. If the argument falls apart, it was necessary.",
        action: {
          type: "write_text",
          text: "Necessary assumption test: negate it -> argument breaks.",
          style: { fontSize: "lg", fontWeight: "bold" },
          align: "center",
        },
      },
      {
        id: 3,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "The correct answer connects the exact evidence to the exact conclusion.",
        displayText:
          "Avoid answers that are stronger, broader, or more interesting than the argument needs.",
        action: {
          type: "check_in",
          question:
            "A city should extend library hours because many residents work until 6 PM. What assumption does the argument need?",
          options: [
            "Some residents would use the library if it stayed open later.",
            "Libraries are more important than parks.",
            "Every resident works until 6 PM.",
            "The city has unlimited funding.",
          ],
          correctOption: 0,
          explanation:
            "The evidence only matters if later hours would actually help residents use the library.",
          hint: "Connect the work schedule evidence to the recommendation.",
        },
      },
    ],
  },
  "strengthen-weaken": {
    lessonContent:
      "Strengthen and weaken questions ask you to affect the link between evidence and conclusion. Do not debate the topic generally; target the author's reasoning.",
    whiteboardSteps: [
      {
        id: 1,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "First separate what the author knows from what the author concludes.",
        displayText:
          "Strengthen = make the evidence support the conclusion better. Weaken = make that support worse.",
        action: {
          type: "table",
          headers: ["Task", "What The Answer Does"],
          rows: [
            ["Strengthen", "Adds support to the reasoning link"],
            ["Weaken", "Attacks the reasoning link"],
            ["Wrong answer", "Talks about the topic without changing the link"],
          ],
          highlightCells: [{ row: 2, col: 1, color: "rgba(245, 158, 11, 0.35)" }],
        },
      },
      {
        id: 2,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "The best answers often affect an assumption.",
        displayText:
          "Target the assumption. That is where strengthen/weaken answers usually operate.",
        action: {
          type: "write_text",
          text: "Evidence -> Assumption -> Conclusion",
          style: { fontSize: "lg", fontWeight: "bold" },
          align: "center",
        },
      },
      {
        id: 3,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "Ask whether the answer changes how convincing the conclusion is.",
        displayText:
          "If the conclusion is no more or less believable, the answer is irrelevant.",
        action: {
          type: "check_in",
          question:
            "A school says its new tutoring program caused higher test scores because scores rose after the program began. Which fact weakens the argument?",
          options: [
            "The school also replaced its test with an easier version that year.",
            "Many students like their tutors.",
            "The tutoring program meets twice a week.",
            "The school has offered clubs for many years.",
          ],
          correctOption: 0,
          explanation:
            "An easier test gives an alternate explanation for the score increase, weakening the claim that tutoring caused it.",
          hint: "Look for another reason the scores could have gone up.",
        },
      },
    ],
  },
  "main-point-structure": {
    lessonContent:
      "Main point and structure questions ask you to track what the passage is mainly doing and how each paragraph contributes. The safest approach is to separate topic, author's claim, and paragraph roles.",
    whiteboardSteps: [
      {
        id: 1,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "Reading Comprehension main point questions are not asking for every detail.",
        displayText:
          "Main point = the author's central claim, not just the passage topic.",
        action: {
          type: "table",
          headers: ["Element", "Question To Ask"],
          rows: [
            ["Topic", "What is the passage about?"],
            ["Main point", "What does the author want me to believe?"],
            ["Structure", "How do the paragraphs build that point?"],
          ],
          highlightCells: [
            { row: 1, col: 1, color: "rgba(245, 158, 11, 0.35)" },
          ],
        },
      },
      {
        id: 2,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "For structure questions, give each paragraph a job label.",
        displayText:
          "Useful paragraph labels: background, problem, evidence, contrast, qualification, conclusion.",
        action: {
          type: "write_text",
          text: "Paragraph role > paragraph summary",
          style: { fontSize: "lg", fontWeight: "bold" },
          align: "center",
        },
      },
      {
        id: 3,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "The right answer should capture both the author's position and the passage's scope.",
        displayText:
          "Avoid choices that are too broad, too narrow, or only repeat one paragraph.",
        action: {
          type: "check_in",
          question:
            "A passage first describes a popular interpretation of a law, then argues that recent evidence supports a narrower interpretation. What is the passage's main purpose?",
          options: [
            "To argue for a narrower reading after presenting a broader view.",
            "To list every historical use of the law.",
            "To prove that legal interpretation is impossible.",
            "To summarize two unrelated court cases.",
          ],
          correctOption: 0,
          explanation:
            "The answer captures the structure: present one view, then argue for a narrower alternative.",
          hint: "Track the shift from the opening view to the author's own claim.",
        },
      },
    ],
  },
  "inference-detail": {
    lessonContent:
      "Inference and detail questions depend on disciplined reading. The correct answer must be supported by the passage; it should not require outside knowledge or a leap beyond the text.",
    whiteboardSteps: [
      {
        id: 1,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "On LSAT Reading Comprehension, supported inference means modest and text-based.",
        displayText:
          "Inference = what must be true or is strongly supported by the passage.",
        action: {
          type: "table",
          headers: ["Answer Type", "How It Behaves"],
          rows: [
            ["Supported", "Stays close to the passage"],
            ["Too strong", "Uses absolute language the passage did not prove"],
            ["Outside scope", "May be true, but the passage does not establish it"],
          ],
          highlightCells: [
            { row: 0, col: 1, color: "rgba(245, 158, 11, 0.35)" },
          ],
        },
      },
      {
        id: 2,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "For detail questions, go back to the relevant line or paragraph before choosing.",
        displayText:
          "Detail questions are retrieval first, reasoning second.",
        action: {
          type: "write_text",
          text: "Find the support -> match the wording -> avoid overstatement",
          style: { fontSize: "lg", fontWeight: "bold" },
          align: "center",
        },
      },
      {
        id: 3,
        delayMs: 0,
        durationMs: 5000,
        narration:
          "If an answer sounds plausible but adds a new claim, be suspicious.",
        displayText:
          "The best inference often sounds restrained.",
        action: {
          type: "check_in",
          question:
            "A passage says a transit policy reduced commute times downtown but had little effect in outer districts. Which inference is best supported?",
          options: [
            "The policy's benefits were uneven across different areas.",
            "The policy failed everywhere.",
            "Outer districts had no commuters.",
            "Downtown residents opposed the policy.",
          ],
          correctOption: 0,
          explanation:
            "The passage supports an uneven effect: improvement downtown, little effect elsewhere.",
          hint: "Choose the answer that stays closest to both parts of the evidence.",
        },
      },
    ],
  },
};

export default function MicroLessonPage() {
  const params = useParams<{ topicSlug: string; subtopicSlug: string }>();
  const router = useRouter();
  const { topicSlug, subtopicSlug } = params;
  const starterLesson = LSAT_STARTER_LESSONS[subtopicSlug] ?? null;

  const {
    data,
    isLoading: metaLoading,
    isError: metaError,
  } = useQuery({
    queryKey: ["learning", topicSlug, subtopicSlug],
    queryFn: () =>
      fetch(`/api/learning/${topicSlug}/${subtopicSlug}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 600_000,
  });

  const {
    data: storedLesson,
    isLoading: lessonLoading,
    isError: lessonError,
  } = useQuery({
    queryKey: ["micro-lesson", topicSlug, subtopicSlug],
    queryFn: () =>
      fetch(`/api/learning/${topicSlug}/${subtopicSlug}/micro-lesson`).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 0,
    refetchInterval: (query) => {
      if (starterLesson) return false;
      return query.state.data?.status === "generating" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (metaError) toast.error("Failed to load subtopic");
  }, [metaError]);

  useEffect(() => {
    if (lessonError) toast.error("Failed to load lesson");
  }, [lessonError]);

  if (metaLoading || lessonLoading) {
    return (
      <LearningWorkspaceState
        variant="loading"
        title="Loading your micro-lesson"
        description="Preparing the LSAT concept overview and guided practice workspace."
        className="h-[calc(100vh-4rem)] border-0"
      />
    );
  }

  if (!data) return null;

  // Another client is currently generating — show polling spinner
  // unless this LSAT subtopic has a local starter lesson.
  if (
    storedLesson?.status === "generating" &&
    !starterLesson
  ) {
    return (
      <LearningWorkspaceState
        variant="loading"
        title="Generating your micro-lesson"
        description="Athena is building the concept breakdown, LSAT reasoning pattern, and focused examples."
        className="h-[calc(100vh-4rem)] border-0"
      />
    );
  }

  const { topic, subtopic } = data;

  // Determine existing lesson: ready rows pass content; null/stale/error → generate
  const existingLesson =
    storedLesson?.status === "ready"
      ? { lessonContent: storedLesson.lessonContent, whiteboardSteps: storedLesson.whiteboardSteps }
      : starterLesson;

  return (
    <MicroLesson
      topic={topic.name}
      subtopic={subtopic.name}
      metadata={{
        description: subtopic.description,
        learningObjectives: subtopic.learningObjectives,
        keyFormulas: subtopic.keyFormulas,
        commonMistakes: subtopic.commonMistakes,
        tipsAndTricks: subtopic.tipsAndTricks,
        conceptualOverview: subtopic.conceptualOverview,
      }}
      existingLesson={existingLesson}
      subtopicApiPath={`/api/learning/${topicSlug}/${subtopicSlug}/micro-lesson`}
      practiceMode={{ subject: "reading-writing" }}
      practiceProblems={subtopicSlug === "linear-equations-two-variables" ? HARDCODED_PROBLEMS : undefined}
      onClose={() => router.push(`/learning/${topicSlug}/${subtopicSlug}`)}
      tracking={storedLesson?.id ? { microLessonId: storedLesson.id, subtopicId: storedLesson.subtopicId ?? data.subtopic.id } : undefined}
    />
  );
}
