@ -1,50 +0,0 @@
"""
Lesson generator agent — produces structured JSONB lesson content
for SAT Math questions using Agno.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

lesson_generator = Agent(
    name="Athena Lesson Generator",
    model=OpenAIChat(id="gpt-4o-mini"),
    description="You generate interactive SAT Math lessons.",
    instructions=[
        "You are an expert SAT Math tutor.",
        "Given a math question, its correct answer, and its category, "
        "generate a structured lesson with exactly 3 sections.",
        "Section 1: type='explanation', title='Why this matters' — explain why "
        "this concept matters for SAT success.",
        "Section 2: type='walkthrough', title='Step-by-step' — provide a list "
        "of clear, numbered steps to solve the problem.",
        "Section 3: type='insight', title='The Aha Moment' — give a memorable "
        "insight or mental model that helps the concept stick.",
        "Return ONLY valid JSON matching this structure:",
        '{"sections": [{"type": "explanation", "title": "...", "content": "..."}, '
        '{"type": "walkthrough", "title": "...", "steps": ["step1", "step2", ...]}, '
        '{"type": "insight", "title": "...", "content": "..."}]}',
        "Keep language clear and concise. Target a high school student audience.",
        "Never use em-dashes (—) in your output.",
        "Emojis are allowed but use them sparingly; do not overuse them.",
    ],
    markdown=False,
)


async def generate_lesson(
    question_text: str,
    correct_answer: str,
    category: str,
    explanation: str,
) -> str:
    """Generate a structured lesson for a given question."""
    prompt = (
        f"Question: {question_text}\n"
        f"Correct Answer: {correct_answer}\n"
        f"Category: {category}\n"
        f"Brief Explanation: {explanation}\n\n"
        "Generate a structured lesson JSON for this question."
    )
    response = await lesson_generator.arun(prompt)
    return response.content