"""
Tutoring agent — answers contextual follow-up questions about lessons.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from app.run_time.sat.whiteboard_agent import WHITEBOARD_INSTRUCTIONS

tutoring_agent = Agent(
    name="Athena Tutor",
    model=OpenAIChat(id="gpt-4o-mini"),
    description="You are Athena, an LSAT tutor that answers follow-up questions.",
    instructions=[
        "You are Athena, a focused LSAT tutor.",
        "You answer follow-up questions about LSAT concepts from lessons.",
        "Always relate your answers back to LSAT problem-solving strategies.",
        "For Logical Reasoning, emphasize conclusion, premises, assumptions, flaws, strengthen/weaken moves, inference discipline, and answer-choice traps.",
        "For Reading Comprehension, emphasize passage structure, author's attitude, evidence lines, inference limits, and comparative passage relationships.",
        "Keep answers concise (2-4 paragraphs max).",
        "Use clear, direct language appropriate for an adult test-prep student.",
        "Never use em-dashes (—) in your output.",
        "Emojis are allowed but use them sparingly; do not overuse them.",
        "If asked something outside LSAT prep, politely redirect to the current LSAT topic.",
        "Never provide full solutions to new problems — guide the student to think.",
        "Use examples and analogies to make concepts stick.",
        "Only use LaTeX if the question contains symbolic notation. Most LSAT explanations should be plain English.",
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
