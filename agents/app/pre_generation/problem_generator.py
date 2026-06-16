"""
Problem Generator Agent — produces SAT problems with full solutions.
Generates in small batches (5) with retry and JSON repair for robustness.
"""

import json
import re
from agno.agent import Agent
from agno.models.anthropic import Claude

BATCH_SIZE = 10  # 10 per batch — large enough to be fast, small enough to avoid truncation
MAX_RETRIES = 3

SUBJECT_LABELS = {
    "math": "SAT Math",
    "reading-writing": "SAT Reading & Writing",
}

problem_agent = Agent(
    name="SAT Problem Generator",
    model=Claude(id="claude-sonnet-4-6"),
    description="You generate realistic SAT problems with full solutions.",
    instructions=[
        "You are an expert SAT problem writer.",
        "Given a subtopic, its context, and the subject area, generate a batch of SAT-style multiple choice problems.",
        "Each problem must have EXACTLY 4 answer choices (A-D).",
        "Return ONLY a valid JSON array of problem objects with these exact keys:",
        "- difficulty: string ('easy' | 'medium' | 'hard')",
        "- questionText: string (the problem text — for Math use LaTeX with $...$ notation, for Reading & Writing include a short passage or sentence in the question; always escape currency dollar signs as \\$ e.g. write \\$5 not $5)",
        "- options: string[] (exactly 4 answer choices — for Math use LaTeX if needed, for Reading & Writing use plain text; always escape currency dollar signs as \\$ e.g. write \\$5 not $5)",
        "- correctOption: number (0-3, index of the correct answer)",
        "- explanation: string (full worked explanation, keep concise)",
        "- solutionSteps: { step: number, instruction: string, math: string }[] (2-4 steps max — for Reading & Writing the 'math' field contains the relevant text/rule instead of equations)",
        "- conceptTags: string[] (fine-grained tags like 'slope-intercept', 'elimination-method' for Math or 'subject-verb-agreement', 'comma-splice' for Reading & Writing)",
        "- commonErrors: { error: string, why: string }[] (1-2 typical student mistakes)",
        "- timeRecommendationSeconds: number (target solve time)",
        "- satFrequency: string ('high' | 'medium' | 'low')",
        "- hint: string (a nudge without giving away the answer — names the method, points to what is given)",
        "- detailedHint: string (walks through the reasoning step by step, leaving only the final computation for the student — gets close but does NOT give away the answer)",
        "Keep explanations and steps CONCISE to stay within output limits.",
        "Problems should be realistic SAT-style questions with varying difficulty.",
        "Ensure all answers are correct and unambiguous.",
        "Never use em-dashes (—) in any text fields.",
        "Emojis are allowed but use them sparingly; do not overuse them.",
        "Return ONLY the JSON array, no markdown code fences or extra text.",
    ],
    markdown=False,
)


def _extract_json_array(text: str) -> list[dict]:
    """Extract and parse a JSON array from LLM output, handling common issues."""
    content = text.strip()

    # Strip markdown code fences
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0].strip()

    # Try direct parse first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to find the array boundaries
    start = content.find("[")
    if start == -1:
        raise ValueError("No JSON array found in response")

    # Try parsing from the array start
    try:
        return json.loads(content[start:])
    except json.JSONDecodeError:
        pass

    # Truncated output: try to salvage complete objects
    # Find the last complete object (ending with })
    last_brace = content.rfind("}")
    if last_brace == -1:
        raise ValueError("No complete JSON objects found")

    # Take everything up to the last } and close the array
    truncated = content[start : last_brace + 1]
    # Remove any trailing comma before we close
    truncated = truncated.rstrip().rstrip(",")
    if not truncated.endswith("]"):
        truncated += "]"

    try:
        return json.loads(truncated)
    except json.JSONDecodeError:
        pass

    # Last resort: extract individual objects with regex
    objects = []
    for match in re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content):
        try:
            obj = json.loads(match.group())
            if "questionText" in obj:
                objects.append(obj)
        except json.JSONDecodeError:
            continue

    if objects:
        return objects

    raise ValueError(f"Could not parse JSON from LLM output (length={len(content)})")


PROBLEM_TYPE_ROTATIONS = [
    "word problems set in real-world contexts (finance, science, everyday situations)",
    "pure algebraic / symbolic manipulation problems",
    "problems involving tables, graphs, or data interpretation",
    "multi-step problems that chain two or more concepts together",
    "problems where a common student error leads to a tempting wrong answer",
]


async def generate_problems_batch(
    subtopic_name: str,
    topic_name: str,
    subtopic_id: str,
    batch_number: int,
    difficulty: str = "medium",
    batch_size: int = BATCH_SIZE,
    start_order_index: int = 0,
    subject: str = "math",
) -> list[dict]:
    """Generate a batch of SAT problems via LLM with retry logic.

    All problems in a batch share the same difficulty level so that callers
    can independently parallelize easy/medium/hard generation.
    """
    subject_label = SUBJECT_LABELS.get(subject, "SAT Math")

    problem_type = PROBLEM_TYPE_ROTATIONS[batch_number % len(PROBLEM_TYPE_ROTATIONS)]

    rw_note = ""
    if subject == "reading-writing":
        rw_note = (
            "\nFor Reading & Writing problems: include a short passage or sentence in the questionText. "
            "Options should be plain text (no LaTeX). Focus on grammar, rhetoric, or comprehension as appropriate.\n"
        )

    prompt = (
        f"Subject: {subject_label}\n"
        f"Topic: {topic_name}\n"
        f"Subtopic: {subtopic_name}\n"
        f"Difficulty: {difficulty} (ALL {batch_size} problems must be {difficulty} difficulty)\n"
        f"Batch: {batch_number + 1}\n"
        f"Problem type focus: {problem_type}\n"
        f"Generate exactly {batch_size} {difficulty} {subject_label} problems.\n"
        f"{rw_note}"
        f"Make each problem unique and cover different aspects of {subtopic_name}.\n"
        "Do not repeat question structures or contexts from earlier batches."
    )

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await problem_agent.arun(prompt)
            problems = _extract_json_array(response.content)

            # Validate we got at least 1 problem
            if not problems:
                raise ValueError("Empty problems array")

            # Add DB fields
            result = []
            for i, p in enumerate(problems):
                result.append({
                    "subtopic_id": subtopic_id,
                    "order_index": start_order_index + i,
                    "difficulty": difficulty,
                    "question_text": p["questionText"],
                    "options": p["options"],
                    "correct_option": p["correctOption"],
                    "explanation": p.get("explanation", ""),
                    "solution_steps": p.get("solutionSteps", []),
                    "concept_tags": p.get("conceptTags", []),
                    "common_errors": p.get("commonErrors", []),
                    "time_recommendation_seconds": p.get("timeRecommendationSeconds", 120),
                    "sat_frequency": p.get("satFrequency", "medium"),
                    "hint": p.get("hint", ""),
                    "detailed_hint": p.get("detailedHint", ""),
                })
            return result

        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                print(f"⚠", end="", flush=True)

    raise RuntimeError(
        f"Failed to generate problems after {MAX_RETRIES} attempts for "
        f"{subtopic_name} batch {batch_number}: {last_error}"
    )
