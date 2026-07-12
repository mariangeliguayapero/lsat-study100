type UnknownRecord = Record<string, unknown>;

export type QuizChatAgentPayload = {
  question: string;
  topic: string;
  subtopic: string;
  question_text: string;
  options: string[];
  hint: string;
  solution_steps: Array<{
    step: number;
    instruction: string;
    math: string;
  }>;
  correct_option: number;
  student_answer: number | null;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

export class InvalidQuizChatPayloadError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join("; "));
    this.name = "InvalidQuizChatPayloadError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export function normalizeQuizChatPayload(input: unknown): QuizChatAgentPayload {
  if (!isRecord(input)) {
    throw new InvalidQuizChatPayloadError(["Request body must be an object"]);
  }

  const question = text(input.question);
  const questionText = text(input.questionText);
  const options = Array.isArray(input.options)
    ? input.options.map((option) => text(option)).filter(Boolean)
    : [];
  const correctOption = integer(input.correctOption);

  const issues: string[] = [];
  if (!question) issues.push("Tutor question is missing");
  if (!questionText) issues.push("Problem text is missing");
  if (
    correctOption === null ||
    correctOption < 0 ||
    (options.length > 0 && correctOption >= options.length)
  ) {
    issues.push("Correct answer index is missing or invalid");
  }

  if (issues.length > 0) {
    throw new InvalidQuizChatPayloadError(issues);
  }

  const solutionSteps = Array.isArray(input.solutionSteps)
    ? input.solutionSteps.filter(isRecord).map((step, index) => ({
        step: integer(step.step) ?? index + 1,
        instruction: text(step.instruction),
        math: text(step.math),
      }))
    : [];

  const history = Array.isArray(input.history)
    ? input.history.flatMap((message) => {
        if (!isRecord(message)) return [];
        const content = text(message.content);
        if (!content) return [];

        const role: "user" | "assistant" | null =
          message.role === "assistant" || message.role === "tutor"
            ? "assistant"
            : message.role === "user"
              ? "user"
              : null;
        return role ? [{ role, content }] : [];
      })
    : [];

  const studentAnswer = integer(input.studentAnswer);

  return {
    question,
    topic: text(input.topic, "LSAT Practice"),
    subtopic: text(input.subtopic, "Focused Practice"),
    question_text: questionText,
    options,
    hint: text(
      input.hint,
      "Identify the question task, isolate the relevant evidence, and eliminate choices that are not fully supported."
    ),
    solution_steps: solutionSteps,
    correct_option: correctOption as number,
    student_answer:
      studentAnswer !== null &&
      studentAnswer >= 0 &&
      (options.length === 0 || studentAnswer < options.length)
        ? studentAnswer
        : null,
    history,
  };
}
