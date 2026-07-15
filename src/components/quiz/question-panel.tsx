"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathContent } from "./math-content";
import type { Problem } from "./types";

type QuestionPanelProps = {
  problem: Problem;
  questionNumber: number;
  /** When true, hint button appears and hint is auto-opened */
  hintRevealed?: boolean;
};

export function QuestionPanel({ problem, questionNumber, hintRevealed = false }: QuestionPanelProps) {
  const [closedHintId, setClosedHintId] = useState<string | null>(null);
  const hintOpen = hintRevealed && closedHintId !== problem.id;

  return (
    <div className="shrink-0 overflow-y-auto p-6 md:flex-1">
      <div className="mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          Question {questionNumber}
        </span>
      </div>

      <MathContent content={problem.questionText} />

      {problem.hint && hintRevealed && (
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setClosedHintId(hintOpen ? problem.id : null)}
          >
            <Lightbulb className="mr-1 h-4 w-4" />
            Need a hint?
            {hintOpen ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
          {hintOpen && (
            <div className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <MathContent content={problem.hint} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
