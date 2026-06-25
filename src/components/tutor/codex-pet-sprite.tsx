"use client";

import { useId } from "react";

const ATLAS_COLS = 8;
const ATLAS_ROWS = 9;

const STATES = {
  idle: { row: 0, frames: 6 },
  "running-right": { row: 1, frames: 8 },
  "running-left": { row: 2, frames: 8 },
  waving: { row: 3, frames: 4 },
  waiting: { row: 6, frames: 6 },
  review: { row: 8, frames: 6 },
} as const;

type StateId = keyof typeof STATES;

const ORB_TO_STATE: Record<string, StateId> = {
  idle: "idle",
  thinking: "review",
  processing: "review",
  speaking: "waving",
  listening: "waiting",
};

export type CodexPetSpriteData = {
  src: string;
  cellWidth: number;
  cellHeight: number;
};

type Props = {
  pet: CodexPetSpriteData;
  orbState?: string;
  movement?: "left" | "right" | null;
  size: number;
};

export function CodexPetSprite({ pet, orbState = "idle", movement = null, size }: Props) {
  const animKey = useId().replace(/:/g, "_");
  const stateId: StateId =
    movement === "right"
      ? "running-right"
      : movement === "left"
        ? "running-left"
        : (ORB_TO_STATE[orbState] ?? "idle");
  const { row, frames } = STATES[stateId];
  const { cellWidth, cellHeight, src } = pet;
  const scale = Math.min(size / cellWidth, size / cellHeight);
  const renderW = cellWidth * scale;
  const renderH = cellHeight * scale;
  const bgW = ATLAS_COLS * cellWidth * scale;
  const bgH = ATLAS_ROWS * cellHeight * scale;
  const rowOffset = -row * cellHeight * scale;
  const frameStepPx = cellWidth * scale;
  const totalShiftPx = -frames * frameStepPx;
  const durationMs =
    stateId === "idle"
      ? 900
      : stateId === "waving"
        ? 480
        : stateId === "waiting"
          ? 1200
          : stateId === "review"
            ? 1100
            : 620;
  const animationName = `codex-pet-${animKey}-${stateId}`;

  return (
    <>
      <style>{`@keyframes ${animationName} { from { background-position: 0 ${rowOffset}px; } to { background-position: ${totalShiftPx}px ${rowOffset}px; } }`}</style>
      <div
        aria-hidden="true"
        style={{
          width: renderW,
          height: renderH,
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `0 ${rowOffset}px`,
          imageRendering: "pixelated",
          animation: `${animationName} ${durationMs}ms steps(${frames}) infinite`,
        }}
      />
    </>
  );
}
