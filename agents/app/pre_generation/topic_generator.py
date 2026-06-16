"""
Topic Generator Agent — produces rich topic metadata for SAT content.
"""

import json
from agno.agent import Agent
from agno.models.anthropic import Claude

SUBJECT_LABELS = {
    "math": "SAT Math",
    "reading-writing": "SAT Reading & Writing",
}

topic_agent = Agent(
    name="SAT Topic Generator",
    model=Claude(id="claude-sonnet-4-20250514"),
    description="You generate comprehensive SAT topic metadata.",
    instructions=[
        "You are an expert SAT curriculum designer.",
        "Given a topic name, its subtopic list, order index, icon, color scheme, and subject area, "
        "generate rich metadata for the topic.",
        "Return ONLY valid JSON with these exact keys:",
        "- overview: string (2-3 sentences describing the topic and its SAT importance)",
        "- learningObjectives: string[] (4-6 bullet points of what students will learn)",
        "- satRelevance: { questionCount: number, percentageOfTest: number, description: string }",
        "- difficultyDistribution: { easy: number, medium: number, hard: number } (percentages summing to 100)",
        "- estimatedTotalMinutes: number (total study time for the topic)",
        "- prerequisites: string[] (prior knowledge needed)",
        "- keyConcepts: string[] (6-10 foundational concepts)",
        "- proTips: string[] (3-5 SAT-specific strategy tips)",
        "Be specific to the actual SAT exam. Use real SAT statistics where possible.",
        "Never use em-dashes (—) in any text fields.",
        "Emojis are allowed but use them sparingly; do not overuse them.",
        "Return ONLY the JSON object, no markdown code fences or extra text.",
    ],
    markdown=False,
)


async def generate_topic(
    name: str,
    subtopics: list[str],
    order: int,
    icon: str,
    color: str,
    subject: str = "math",
) -> dict:
    """Generate rich topic metadata via LLM."""
    subject_label = SUBJECT_LABELS.get(subject, "SAT Math")
    prompt = (
        f"Subject: {subject_label}\n"
        f"Topic: {name}\n"
        f"Subtopics: {', '.join(subtopics)}\n"
        f"Order: {order}\n"
        f"Icon: {icon}\n"
        f"Color scheme: {color}\n\n"
        "Generate the complete topic metadata JSON."
    )
    response = await topic_agent.arun(prompt)
    data = json.loads(response.content)

    # Merge with fixed fields
    slug = name.lower().replace(" ", "-").replace("(", "").replace(")", "")
    return {
        "slug": slug,
        "name": name,
        "subject": subject,
        "icon": icon,
        "order_index": order,
        "color_scheme": color,
        "overview": data["overview"],
        "learning_objectives": data["learningObjectives"],
        "sat_relevance": data["satRelevance"],
        "difficulty_distribution": data["difficultyDistribution"],
        "estimated_total_minutes": data["estimatedTotalMinutes"],
        "prerequisites": data["prerequisites"],
        "key_concepts": data["keyConcepts"],
        "pro_tips": data["proTips"],
    }
