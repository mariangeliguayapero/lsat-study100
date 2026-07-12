import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  InvalidQuizChatPayloadError,
  normalizeQuizChatPayload,
} from "@/lib/agent/quiz-chat-payload";

const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8080";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = normalizeQuizChatPayload(await req.json());
  } catch (error) {
    const issues =
      error instanceof InvalidQuizChatPayloadError
        ? error.issues
        : ["Request body is not valid JSON"];
    console.warn("[my-learning/quiz-chat/stream] Invalid tutor context:", issues);
    return NextResponse.json(
      { error: "Tutor context is incomplete", details: issues },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${AGENT_URL}/my-learning/quiz-chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !res.body) {
      const errorBody = await res.text().catch(() => "no body");
      throw new Error(`Agent service returned ${res.status}: ${errorBody}`);
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[my-learning/quiz-chat/stream] Error:", err);
    return NextResponse.json(
      { error: "AI tutor is currently unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
