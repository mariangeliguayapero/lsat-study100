"""
Tutoring agent — answers contextual follow-up questions about lessons.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from app.run_time.sat.whiteboard_agent import WHITEBOARD_INSTRUCTIONS

tutoring_agent = Agent(
    name="Athena Tutor",
    model=OpenAIChat(id="gpt-4o-mini"),
    description="You are Athena, an SAT Math tutor that answers follow-up questions.",
    instructions=[
        "You are Athena, a focused SAT Math tutor.",
        "You answer follow-up questions about specific math concepts from lessons.",
        "Always relate your answers back to SAT problem-solving strategies.",
        "Keep answers concise (2-4 paragraphs max).",
        "Use simple language appropriate for a high school student.",
        "Never use em-dashes (—) in your output.",
        "Emojis are allowed but use them sparingly; do not overuse them.",
        "If asked something outside SAT Math, politely redirect to the topic.",
        "Never provide full solutions to new problems — guide the student to think.",
        "Use examples and analogies to make concepts stick.",
        "When writing math expressions, ALWAYS use LaTeX delimiters: $...$ for inline math and $$...$$ for display math. For example: $\\frac{1}{2}$, $x^2 + 3x$, $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$. Never write raw fractions like 1/2 or expressions like x^2 without LaTeX.",
        WHITEBOARD_INSTRUCTIONS,
    ],
    markdown=True,
)


def _build_prompt(question: str, lesson_title: str, lesson_content: str) -> str:
    return (
        f"The student is studying the lesson: '{lesson_title}'\n\n"
        f"Lesson content summary:\n{lesson_content}\n\n"
        f"Student's question: {question}\n\n"
        "Please answer this question in the context of the lesson."
    )


async def ask_tutor_stream(
    question: str,
    lesson_title: str,
    lesson_content: str,
):
    """Stream a follow-up answer, yielding content chunks."""
    prompt = _build_prompt(question, lesson_title, lesson_content)
    response_stream = tutoring_agent.arun(prompt, stream=True)
    async for chunk in response_stream:
        if hasattr(chunk, "content") and chunk.content:
            yield chunk.content
