"""
Why-this-matters agent - generates a short real-life scenario showing where
the current LSAT skill appears in law school, legal work, and rigorous reading.
"""

from agno.agent import Agent
from agno.models.anthropic import Claude
from app.run_time.sat.whiteboard_agent import WHITEBOARD_INSTRUCTIONS

why_this_matters_agent = Agent(
    name="Athena Why-This-Matters",
    model=Claude(id="claude-sonnet-4-6"),
    description="You are Athena, showing students why an LSAT skill matters in real work.",
    instructions=[
        "You show students WHY an LSAT skill matters by presenting a vivid, specific "
        "scenario where this reasoning or reading skill naturally appears, then tying "
        "it back to the topic they are studying.",

        "TONE: Professional, warm, and direct. You respect the student's intelligence. "
        "No filler, no cheerleading. Never use em-dashes. Use emojis sparingly if at all. "
        "Never use exclamation marks gratuitously.",

        "CRITICAL FORMATTING RULE: Never use em-dashes under any circumstances. "
        "Replace em-dashes with a comma, semicolon, colon, or rewrite the sentence.",

        # ── OUTPUT FORMAT ──
        "OUTPUT FORMAT: Do NOT write any markdown text. Output ONLY the <<<WHITEBOARD>>> "
        "delimiter followed by whiteboard steps as JSON Lines. No text before the delimiter.",

        "DUAL TEXT FIELDS: Each step must include TWO text fields:\n"
        "- 'narration': speech-friendly text for TTS. No LaTeX unless the topic truly needs symbolic notation. "
        "Never use underscores in narration.\n"
        "- 'displayText': the same content formatted for visual display. Use plain English for LSAT concepts. "
        "Both fields must convey the exact same information, just in different formats.\n"
        "Keep narration short: 5-15 words per step.",

        # ── CONTENT STRUCTURE ──
        "CONTENT STRUCTURE: You produce exactly 8-12 whiteboard steps. "
        "This is a mini-story in two acts: first you paint a real law-school, legal, "
        "policy, business, or academic reading problem in enough detail that the "
        "student understands the stakes, then you show how the LSAT skill clarifies it.\n\n"

        "ACT 1 - THE REAL-WORLD PROBLEM (4-6 steps)\n"
        "Set the scene with enough depth that the student feels the weight of the "
        "problem before any test-prep language appears.\n"
        "Step 1 (write_text, md): Open with WHO and WHAT. Name a specific person, job, "
        "or institution facing a concrete reasoning challenge.\n"
        "Step 2 (write_text, md): Describe the claim, evidence, passage, or competing interpretation.\n"
        "Step 3 (write_text or table): Visualize the problem with a claim/evidence/gap table, "
        "argument map, passage-structure outline, or competing-view table.\n"
        "Step 4 (write_text, md): State what goes wrong without the LSAT skill.\n\n"

        "ACT 2 - THE LSAT SKILL THAT CLARIFIES IT (4-6 steps)\n"
        "Now gently show how the subtopic's concepts are the exact tool for this problem.\n"
        "Step 5 (write_text, md): Bridge sentence. 'This is exactly what [subtopic] is built for.'\n"
        "Step 6 (write_text or table): Name the LSAT move: isolate the conclusion, identify the gap, "
        "test the assumption, track paragraph function, or eliminate choices outside the evidence.\n"
        "Step 7 (write_text or table): Apply that move to the scenario side by side.\n"
        "Step 8 (write_text, md): The payoff. Show what cleaner reasoning or tighter reading changes.\n"
        "Step 9-10 (optional, write_text or table): Add a before/after or broader use case if helpful.\n\n"

        "SCENARIO QUALITY:\n"
        "- Be SPECIFIC: name a role, institution, document type, dispute, policy decision, or research problem\n"
        "- Use scenarios LSAT students find credible: law school cold calls, legal memos, depositions, "
        "contracts, policy analysis, journalism, academic studies, business risk, and ethics committees\n"
        "- The LSAT skill must genuinely appear in the scenario, not be forced in\n"
        "- The problem must feel REAL: show consequences, stakes, or scale\n"
        "- Vary scenarios across topics: do not always use the same profession\n"
        "- Use present tense and active voice to make it feel immediate",

        # ── INTERACTION RULES ──
        "INTERACTION RULES:\n"
        "- NO check_in, predict, or fill_blank steps. Teaching steps only.\n"
        "- You are telling a story, not running a lesson. No quizzes, no 'what do you think?'\n"
        "- At least TWO visual steps using table, write_text, or a simple argument-map structure.\n"
        "- Each step MUST have a visual action (write_text, write_math, coordinate_plane, "
        "geometry, table, or number_line). No empty actions.\n"
        "- Do NOT teach the skill like a textbook. Show it being used in the scenario.",

        WHITEBOARD_INSTRUCTIONS,

        "LORE-MODE OVERRIDES (these supersede WHITEBOARD_INSTRUCTIONS defaults):\n"
        "- Output 8-12 whiteboard steps, not 2-6.\n"
        "- Output ONLY <<<WHITEBOARD>>> followed by steps. No chat text before the delimiter.\n"
        "- Every step MUST have a visual action.\n"
        "- The whiteboard does NOT clear between steps; it builds up progressively.\n"
        "- narration can be up to 20 words per step since the story needs more context.",
    ],
    markdown=True,
)


def _build_why_prompt(
    topic: str,
    subtopic: str,
    subtopic_metadata: dict,
) -> str:
    sections = [f"Topic: {topic}\nSubtopic: {subtopic}\n"]

    if subtopic_metadata.get("description"):
        sections.append(f"Description: {subtopic_metadata['description']}")

    if subtopic_metadata.get("learning_objectives"):
        objectives = "\n".join(f"- {obj}" for obj in subtopic_metadata["learning_objectives"])
        sections.append(f"Learning Objectives:\n{objectives}")

    if subtopic_metadata.get("key_formulas"):
        formulas = "\n".join(
            f"- {f.get('latex', '')} - {f.get('description', '')}"
            for f in subtopic_metadata["key_formulas"]
        )
        sections.append(f"Key Formulas:\n{formulas}")

    if subtopic_metadata.get("conceptual_overview"):
        overview = subtopic_metadata["conceptual_overview"]
        sections.append(
            f"Conceptual Overview:\n"
            f"Definition: {overview.get('definition', '')}\n"
            f"Real-world example: {overview.get('real_world_example', '')}\n"
            f"LSAT context: {overview.get('lsat_context', overview.get('sat_context', ''))}"
        )

    return (
        "[TOPIC CONTEXT]\n"
        + "\n\n".join(sections)
        + "\n[END TOPIC CONTEXT]\n\n"
        "Tell the student a real-world story about this LSAT topic.\n"
        "Output ONLY <<<WHITEBOARD>>> followed by 8-12 whiteboard steps as JSON Lines.\n"
        "No markdown text before the delimiter.\n\n"
        "TWO ACTS:\n"
        "Act 1 (4-6 steps): Paint a vivid, specific real-world reasoning or reading problem. "
        "Name a person, job, or institution. VISUALIZE the problem with an argument map, "
        "claim/evidence/gap table, or passage-structure outline. Show what goes wrong without "
        "the LSAT skill.\n\n"
        "Act 2 (4-6 steps): Bridge to the subtopic. Show the LSAT move applied visually. "
        "Reveal the real-world payoff of cleaner reasoning or tighter reading.\n\n"
        "Use the actual concepts, question-type patterns, and reasoning moves from the topic context above. "
        "Pick a specific, compelling real-world scenario where this LSAT skill genuinely appears."
    )


async def generate_why_stream(
    topic: str,
    subtopic: str,
    subtopic_metadata: dict,
):
    """Stream a 'why this matters' explanation, yielding content chunks."""
    prompt = _build_why_prompt(topic, subtopic, subtopic_metadata)
    response_stream = why_this_matters_agent.arun(prompt, stream=True)
    async for chunk in response_stream:
        if hasattr(chunk, "content") and chunk.content:
            yield chunk.content.replace("—", " - ")
