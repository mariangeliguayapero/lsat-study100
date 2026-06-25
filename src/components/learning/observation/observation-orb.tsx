"use client";

import { animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodexPetSprite } from "@/components/tutor/codex-pet-sprite";
import {
  DEFAULT_TUTOR_CHARACTER,
  TUTOR_CHARACTERS,
  getTutorCharacter,
  isTutorCharacterId,
  type TutorCharacter,
  type TutorCharacterId,
} from "@/lib/tutor-characters";

export type ObservationOrbState = "idle" | "thinking" | "speaking" | "listening";

type ObservationOrbProps = {
  state: ObservationOrbState;
  amplitude?: number;
  size?: number;
  movement?: "left" | "right" | null;
};

const PARALLAX_MAX = 22;
const HIGHLIGHT_MAX = 18;
const STORAGE_KEY = "athena.localTutorCharacter";

function getInitialCharacter(): TutorCharacterId {
  if (typeof window === "undefined") return DEFAULT_TUTOR_CHARACTER;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTutorCharacterId(stored) ? stored : DEFAULT_TUTOR_CHARACTER;
}

function CharacterAvatar({
  character,
  size,
  orbState,
  movement,
}: {
  character: TutorCharacter;
  size: number;
  orbState: ObservationOrbState;
  movement?: "left" | "right" | null;
}) {
  if (!character.spritesheet) {
    return (
      <span
        className="flex items-center justify-center rounded-full text-white"
        style={{ width: size, height: size, backgroundColor: "var(--athena-navy)" }}
      >
        <Mic style={{ width: size * 0.45, height: size * 0.45 }} />
      </span>
    );
  }

  return <CodexPetSprite pet={character.spritesheet} size={size} orbState={orbState} movement={movement} />;
}

export function ObservationOrb({ state, amplitude = 0, size = 260, movement = null }: ObservationOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [characterId, setCharacterId] = useState<TutorCharacterId>(() => getInitialCharacter());
  const character = getTutorCharacter(characterId);
  const hasCharacter = character.spritesheet !== null;
  const isActive = state === "speaking" || state === "listening";
  const haloScale = isActive ? 1 + amplitude * 0.35 : 1;
  const coreScale = state === "idle" ? [1, 1.025, 1] : state === "thinking" ? [1, 1.05, 1] : 1 + amplitude * 0.08;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 80, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 80, damping: 20, mass: 0.6 });
  const hue = useMotionValue(245);

  useEffect(() => {
    const controls = animate(hue, [210, 230, 245, 258, 230, 210], {
      duration: 18,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [hue]);

  const haloX = useTransform(sx, (value) => value * PARALLAX_MAX);
  const haloY = useTransform(sy, (value) => value * PARALLAX_MAX);
  const midHaloX = useTransform(sx, (value) => value * PARALLAX_MAX * 0.75);
  const midHaloY = useTransform(sy, (value) => value * PARALLAX_MAX * 0.75);
  const coreX = useTransform(sx, (value) => value * PARALLAX_MAX * 0.55);
  const coreY = useTransform(sy, (value) => value * PARALLAX_MAX * 0.55);
  const highlightX = useTransform(sx, (value) => 32 + value * HIGHLIGHT_MAX);
  const highlightY = useTransform(sy, (value) => 30 + value * HIGHLIGHT_MAX);
  const highlightBg = useTransform<number, string>(
    [highlightX, highlightY, hue],
    ([x, y, h]) =>
      `radial-gradient(circle at ${x}% ${y}%, oklch(0.95 0.08 ${h}) 0%, oklch(0.62 0.24 ${h}) 40%, oklch(0.22 0.14 ${h}) 95%)`,
  );
  const outerHaloBg = useTransform(hue, (h) => `radial-gradient(circle, oklch(0.42 0.22 ${h}), transparent 65%)`);
  const midHaloBg = useTransform(hue, (h) => `radial-gradient(circle, oklch(0.65 0.26 ${h}), transparent 60%)`);
  const ringBorder = useTransform(hue, (h) => `oklch(0.78 0.20 ${h})`);
  const coreShadow = useTransform(
    hue,
    (h) =>
      `0 0 100px oklch(0.62 0.24 ${h} / 0.6), inset -14px -18px 40px oklch(0.10 0.08 ${h} / 0.7), inset 10px 12px 24px oklch(0.95 0.08 ${h} / 0.3)`,
  );

  useEffect(() => {
    const handleMouse = (event: MouseEvent) => {
      const element = containerRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      px.set(Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth * 0.6))));
      py.set(Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight * 0.6))));
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [px, py]);

  const cycleCharacter = () => {
    const currentIndex = TUTOR_CHARACTERS.findIndex((entry) => entry.id === characterId);
    const next = TUTOR_CHARACTERS[(currentIndex + 1) % TUTOR_CHARACTERS.length] ?? TUTOR_CHARACTERS[0];
    setCharacterId(next.id);
    window.localStorage.setItem(STORAGE_KEY, next.id);
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {[1.0, 1.35, 1.75, 2.2].map((mult, index) => (
          <div
            key={mult}
            className="absolute rounded-full border border-[var(--obs-muted)]"
            style={{ width: size * 0.55 * mult, height: size * 0.55 * mult, opacity: 0.12 - index * 0.025 }}
          />
        ))}
      </div>

      {state === "thinking" && (
        <motion.div
          aria-hidden
          className="absolute rounded-full border border-dashed"
          style={{
            width: size * 0.82,
            height: size * 0.82,
            borderColor: ringBorder,
            opacity: 0.3,
            animation: "obs-ring-rotate 8s linear infinite",
          }}
        />
      )}

      <motion.div
        className="absolute rounded-full"
        style={{ width: size * 0.95, height: size * 0.95, background: outerHaloBg, filter: "blur(28px)", x: haloX, y: haloY }}
        animate={{ opacity: isActive ? [0.55, 0.85, 0.55] : [0.45, 0.65, 0.45], scale: haloScale }}
        transition={{ duration: isActive ? 1.8 : 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{ width: size * 0.7, height: size * 0.7, background: midHaloBg, filter: "blur(18px)", x: midHaloX, y: midHaloY }}
        animate={{ opacity: [0.55, 0.85, 0.55], scale: state === "thinking" ? [1, 1.06, 1] : 1 }}
        transition={{ duration: state === "thinking" ? 2 : 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.button
        type="button"
        onClick={cycleCharacter}
        aria-label="Change tutor character"
        title="Change tutor character"
        className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--obs-glow-mid)]"
        style={{ width: size * 0.42, height: size * 0.42, background: highlightBg, boxShadow: coreShadow, x: coreX, y: coreY }}
        animate={{ scale: coreScale }}
        transition={{ duration: state === "thinking" ? 2 : 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {hasCharacter && (
          <span className="pointer-events-none flex items-center justify-center">
            <CharacterAvatar character={character} size={size * 0.32} orbState={state} movement={movement} />
          </span>
        )}
      </motion.button>

      {state === "listening" && (
        <>
          <motion.span
            aria-hidden
            className="absolute rounded-full border"
            style={{ width: size * 0.42, height: size * 0.42, borderColor: ringBorder, animation: "obs-ripple 1.8s ease-out infinite" }}
          />
          <motion.span
            aria-hidden
            className="absolute rounded-full border"
            style={{ width: size * 0.42, height: size * 0.42, borderColor: ringBorder, animation: "obs-ripple 1.8s ease-out 0.6s infinite" }}
          />
        </>
      )}
    </div>
  );
}
