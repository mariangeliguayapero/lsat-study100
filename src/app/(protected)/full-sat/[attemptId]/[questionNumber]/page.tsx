"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFullSatContext } from "@/components/full-sat/full-sat-context";
import { Toolbar } from "@/components/quiz/toolbar";
import { SegmentProgressBar } from "@/components/quiz/segment-progress-bar";
import { QuestionPanel } from "@/components/quiz/question-panel";
import { AnswerPanel } from "@/components/quiz/answer-panel";
import { BottomBar } from "@/components/quiz/bottom-bar";

export default function FullSatQuestionPage() {
  const router = useRouter();
  const params = useParams<{ attemptId: string; questionNumber: string }>();
  const questionNum = Math.max(1, parseInt(params.questionNumber, 10) || 1);
  const ctx = useFullSatContext();

  const [timerHidden, setTimerHidden] = useState(false);

  // Sync URL <-> currentIndex
  const syncedRef = useRef(false);
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      const targetIndex = questionNum - 1;
      if (
        targetIndex !== ctx.currentIndex &&
        targetIndex >= 0 &&
        targetIndex < ctx.totalQuestions
      ) {
        ctx.goTo(targetIndex);
      }
      return;
    }
    router.push(`/full-sat/${params.attemptId}/${ctx.currentIndex + 1}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.currentIndex]);

  const currentProblem = ctx.currentProblem;
  if (!currentProblem) return null;

  // Convert to quiz Problem shape for reused components
  const asProblem = {
    id: currentProblem.problemId,
    orderIndex: currentProblem.orderIndex,
    difficulty: currentProblem.difficulty,
    questionText: currentProblem.questionText,
    options: currentProblem.options,
    correctOption: -1, // Don't reveal correct answer during test
    explanation: "",
    solutionSteps: [],
    hint: "",
    detailedHint: undefined,
    timeRecommendationSeconds: 90,
  };

  const isLow = ctx.timeLeft < 300; // 5 minutes warning

  const sectionGlobalIndices = ctx.problems
    .map((problem, index) => ({ problem, index }))
    .filter(({ problem }) => problem.section === currentProblem.section)
    .map(({ index }) => index);
  const sectionTotal = sectionGlobalIndices.length;
  const sectionIndex = Math.max(0, sectionGlobalIndices.indexOf(ctx.currentIndex));
  const unansweredCount = sectionGlobalIndices.filter(
    (index) => ctx.getQuestionStatus(index) === "unanswered"
  ).length;
  const hasNextSection = ctx.problems
    .slice(ctx.currentIndex + 1)
    .some((problem) => problem.section !== currentProblem.section);

  const handleSubmitOrFinishSection = () => {
    if (hasNextSection) {
      ctx.finishSection();
    } else {
      ctx.submitTest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <Toolbar
        displayTime={ctx.displayTime}
        isLow={isLow}
        timerHidden={timerHidden}
        onToggleTimer={() => setTimerHidden((h) => !h)}
        calcOpen={false}
        onToggleCalc={() => {}}
        onClose={() => router.push("/full-sat")}
        hasAnswers={ctx.answeredCount > 0}
        subtopicName={`${ctx.sectionLabel} - ${ctx.moduleLabel}`}
        showCalc={false}
        title="Full LSAT Practice Test"
      />

      <SegmentProgressBar
        total={sectionTotal}
        currentIndex={sectionIndex}
        getStatus={(i) => ctx.getQuestionStatus(sectionGlobalIndices[i] ?? -1)}
        onNavigate={() => {}}
      />

      {/* Section + module label */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/50">
        <span className="text-xs font-semibold text-muted-foreground">
          {ctx.sectionLabel}
        </span>
        <span className="text-xs text-muted-foreground/50">|</span>
        <span className="text-xs font-medium text-primary">
          {ctx.moduleLabel}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Q{ctx.currentIndex + 1} of {ctx.totalQuestions}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col md:flex-row md:divide-x">
          <QuestionPanel
            problem={asProblem}
            questionNumber={sectionIndex + 1}
          />
          <AnswerPanel
            problem={asProblem}
            questionNumber={sectionIndex + 1}
            selectedOption={ctx.answers.get(currentProblem.problemId)}
            isMarked={false}
            onSelect={(i) => ctx.handleSelectAnswer(currentProblem.problemId, i)}
            onToggleMark={() => {}}
            direction={ctx.direction}
            disabled={false}
            showMark={false}
          />
        </div>
      </div>

      <BottomBar
        currentIndex={sectionIndex}
        total={sectionTotal}
        unansweredCount={unansweredCount}
        onBack={() => {
          const previousIndex = sectionGlobalIndices[sectionIndex - 1];
          if (previousIndex != null) ctx.goTo(previousIndex);
        }}
        onNext={() => {
          const nextIndex = sectionGlobalIndices[sectionIndex + 1];
          if (nextIndex != null) ctx.goTo(nextIndex);
        }}
        onGoTo={(i) => ctx.goTo(sectionGlobalIndices[i] ?? ctx.currentIndex)}
        onSubmit={handleSubmitOrFinishSection}
        getStatus={(i) => ctx.getQuestionStatus(sectionGlobalIndices[i] ?? -1)}
        sequential={false}
        nextDisabled={false}
        submitTitle={hasNextSection ? "Finish section?" : "Submit practice test?"}
        submitDescription={
          hasNextSection
            ? "You are about to move to the next LSAT section. You can review unanswered questions before continuing."
            : "You are about to submit the full LSAT practice test."
        }
      />
    </div>
  );
}
