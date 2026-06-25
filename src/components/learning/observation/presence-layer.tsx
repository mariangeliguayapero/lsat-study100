"use client";

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { MathContent } from "@/components/quiz/math-content";
import { useOrbPresence, type OrbMode, type OrbPoint } from "@/hooks/use-orb-presence";
import { ObservationOrb, type ObservationOrbState } from "./observation-orb";
import type { OrbSpotlight, StepFocus } from "@/components/whiteboard/pen-tip";

type PresenceLayerProps = {
  orbState: ObservationOrbState;
  amplitude: number;
  size: number;
  captionText: string | null;
  mode: OrbMode;
  restAnchor: OrbPoint;
  penClientRef?: RefObject<OrbPoint | null>;
  stepFocusRef?: RefObject<StepFocus | null>;
  spotlightRef?: RefObject<OrbSpotlight | null>;
  dockAnchor?: OrbPoint | null;
  dockTargetRef?: RefObject<HTMLElement | null>;
  reducedMotion?: boolean;
  suppressCaption?: boolean;
};

export function PresenceLayer({
  orbState,
  amplitude,
  size,
  captionText,
  mode,
  restAnchor,
  penClientRef,
  stepFocusRef,
  spotlightRef,
  dockAnchor,
  dockTargetRef,
  reducedMotion,
  suppressCaption,
}: PresenceLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const dragRef = useRef<OrbPoint | null>(null);
  const dragState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const { x, y, captionAbove, movement, spotlightX, spotlightY, spotlightOn } = useOrbPresence({
    enabled: true,
    mode,
    restAnchor,
    penClientRef,
    stepFocusRef,
    spotlightRef,
    dockAnchor,
    dockTargetRef,
    dragTargetRef: dragRef,
    layerRef,
    cursorAttract: false,
    reducedMotion: reducedMotion ?? prefersReduced ?? false,
  });

  const [capAbove, setCapAbove] = useState(false);
  const [moveDir, setMoveDir] = useState<"left" | "right" | null>(null);
  const [spotOn, setSpotOn] = useState(false);
  useMotionValueEvent(captionAbove, "change", (value) => setCapAbove(!!value));
  useMotionValueEvent(movement, "change", (value) => setMoveDir(value === "none" ? null : value));
  useMotionValueEvent(spotlightOn, "change", (value) => setSpotOn(!!value));

  const onOrbPointerDown = (event: ReactPointerEvent) => {
    dragState.current = { startX: event.clientX, startY: event.clientY, moved: false };
  };

  const onOrbPointerMove = (event: ReactPointerEvent) => {
    const state = dragState.current;
    const layer = layerRef.current;
    if (!state || !layer) return;

    if (event.buttons === 0) {
      dragState.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore missing capture
      }
      return;
    }

    if (!state.moved && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) > 5) {
      state.moved = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore unsupported capture
      }
    }

    if (state.moved) {
      const rect = layer.getBoundingClientRect();
      dragRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
  };

  const onOrbPointerUp = (event: ReactPointerEvent) => {
    if (dragState.current?.moved) justDragged.current = true;
    dragState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer already released
    }
  };

  const onOrbClickCapture = (event: ReactMouseEvent) => {
    if (!justDragged.current) return;
    justDragged.current = false;
    event.stopPropagation();
    event.preventDefault();
  };

  const text = (captionText ?? "").trim();
  const showCaption = !suppressCaption && !!text;

  return (
    <div ref={layerRef} data-orb-layer data-orb-mode={mode} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {spotOn && (
        <motion.div data-orb-pulse className="absolute left-0 top-0" style={{ x: spotlightX, y: spotlightY }}>
          <motion.span
            className="absolute block rounded-full"
            style={{ width: 64, height: 64, marginLeft: -32, marginTop: -32, border: "2px solid var(--obs-glow-mid)" }}
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
          />
          <span
            className="absolute block rounded-full"
            style={{
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              background: "var(--obs-glow-mid)",
              boxShadow: "0 0 8px var(--obs-glow-mid)",
            }}
          />
        </motion.div>
      )}

      <motion.div
        data-orb
        className="absolute left-0 top-0"
        style={{ x, y, marginLeft: -size / 2, marginTop: -size / 2, width: size }}
      >
        <div
          className="pointer-events-auto"
          style={{ width: size, height: size, cursor: "grab", touchAction: "none" }}
          onPointerDown={onOrbPointerDown}
          onPointerMove={onOrbPointerMove}
          onPointerUp={onOrbPointerUp}
          onPointerCancel={onOrbPointerUp}
          onClickCapture={onOrbClickCapture}
        >
          <ObservationOrb state={orbState} amplitude={amplitude} size={size} movement={moveDir} />
        </div>

        <div
          className={`absolute flex ${capAbove ? "justify-start" : "justify-end"}`}
          style={{
            top: size / 2,
            transform: "translateY(-50%)",
            width: 360,
            ...(capAbove ? { left: size + 8 } : { right: size + 8 }),
          }}
        >
          <AnimatePresence mode="wait">
            {showCaption && (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: capAbove ? -4 : 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: capAbove ? -4 : 4 }}
                transition={{ duration: 0.25 }}
                className={`obs-serif max-w-[360px] rounded-xl border border-white/5 px-4 py-2 ${capAbove ? "text-left" : "text-right"} text-base leading-snug text-[var(--obs-fg)] shadow-lg shadow-black/10 backdrop-blur-md`}
                style={{ background: "color-mix(in oklch, var(--obs-surface) 70%, transparent)" }}
              >
                <MathContent content={text} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
