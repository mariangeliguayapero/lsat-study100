import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "ElevenLabs not configured" },
      { status: 500 }
    );
  }

  try {
    const { text } = (await req.json()) as { text: string };
    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`ElevenLabs TTS error ${res.status}:`, body);
      return NextResponse.json(
        { error: "Text-to-speech failed", detail: body },
        { status: 503 }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: "Text-to-speech failed" },
      { status: 503 }
    );
  }
}
