"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useAnimationFrame, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { boardToClient, type OrbSpotlight, type StepFocus } from "@/components/whiteboard/pen-tip";

export type OrbMode = "rest" | "draw" | "dock";

export interface OrbPoint {
  x: number;
  y: number;
}

export interface UseOrbPresenceArgs {
  enabled: boolean;
  mode: OrbMode;
  restAnchor: OrbPoint;
  penClientRef?: RefObject<OrbPoint | null>;
  stepFocusRef?: RefObject<StepFocus | null>;
  spotlightRef?: RefObject<OrbSpotlight | null>;
  dragTargetRef?: RefObject<OrbPoint | null>;
  dockAnchor?: OrbPoint | null;
  dockTargetRef?: RefObject<HTMLElement | null>;
  layerRef?: RefObject<HTMLElement | null>;
  cursorAttract?: boolean;
  reducedMotion?: boolean;
}

export interface OrbPresence {
  x: MotionValue<number>;
  y: MotionValue<number>;
  vx: MotionValue<number>;
  moving: MotionValue<boolean>;
  captionAbove: MotionValue<boolean>;
  movement: MotionValue<"left" | "right" | "none">;
  spotlightX: MotionValue<number>;
  spotlightY: MotionValue<number>;
  spotlightOn: MotionValue<boolean>;
}

const REST_SPRING = { stiffness: 240, damping: 20, mass: 0.7 } as const;
const DRAW_OFFSET = { x: 10, y: -12 } as const;
const PEN_LEAD_MS = 95;
const PEN_LEAD_MAX = 48;
const FLOAT_AMP_REST = 9;
const FLOAT_AMP_DRAW = 4;
const READING_BUBBLE = 150;
const ATTRACT_RANGE = 520;
const ATTRACT_GAIN = 0.18;
const REPEL_GAIN = 1.0;
const MOVING_EPS = 0.6;
const DIR_THRESHOLD = 0.8;
const CLAMP_MARGIN = 112;
const SIDE_PERIOD = 11000;
const DOCK_GAP = 64;
const STEP_SIDE_GAP = 124;
const LEFT_UI_CLEARANCE = 390;
const STEP_TOP_CLEARANCE = 118;
const MAX_STEP_W = 480;
const MAX_STEP_H = 260;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cursorForce(anchor: OrbPoint, cursor: OrbPoint | null | undefined): OrbPoint {
  if (!cursor) return anchor;
  const dx = anchor.x - cursor.x;
  const dy = anchor.y - cursor.y;
  const distance = Math.hypot(dx, dy) || 0.0001;
  const ux = dx / distance;
  const uy = dy / distance;

  if (distance < READING_BUBBLE) {
    const push = (READING_BUBBLE - distance) * REPEL_GAIN;
    return { x: anchor.x + ux * push, y: anchor.y + uy * push };
  }

  if (distance < ATTRACT_RANGE) {
    const targetDistance = READING_BUBBLE + 60;
    const pull = (distance - targetDistance) * ATTRACT_GAIN;
    return { x: anchor.x - ux * pull, y: anchor.y - uy * pull };
  }

  return anchor;
}

function stepSideAnchor(focus: StepFocus, layerRect: DOMRect, onLeft: boolean): OrbPoint | null {
  const topLeft = boardToClient({ x: focus.box.x, y: focus.box.y }, focus.svg, focus.viewBoxWidth, focus.viewBoxHeight);
  const bottomRight = boardToClient(
    { x: focus.box.x + focus.box.width, y: focus.box.y + focus.box.height },
    focus.svg,
    focus.viewBoxWidth,
    focus.viewBoxHeight,
  );
  const left = topLeft.x - layerRect.left;
  const top = topLeft.y - layerRect.top;
  const right = Math.min(bottomRight.x - layerRect.left, left + MAX_STEP_W);
  const bottom = Math.min(bottomRight.y - layerRect.top, top + MAX_STEP_H);
  const canUseLeft = left - STEP_SIDE_GAP > LEFT_UI_CLEARANCE;
  const side = onLeft && canUseLeft ? "left" : "right";
  const stepHeight = Math.max(1, bottom - top);
  const y = clamp(top + Math.min(stepHeight * 0.42, 86), STEP_TOP_CLEARANCE, layerRect.height - CLAMP_MARGIN);

  return {
    x: side === "left" ? left - STEP_SIDE_GAP : right + STEP_SIDE_GAP,
    y,
  };
}

function resolveTarget(
  args: UseOrbPresenceArgs,
  restAnchor: OrbPoint,
  cursor: OrbPoint | null,
  dockPoint: OrbPoint | null,
  penPoint: OrbPoint | null,
): OrbPoint {
  switch (args.mode) {
    case "draw":
      return penPoint ?? restAnchor;
    case "dock":
      return dockPoint ?? args.dockAnchor ?? restAnchor;
    case "rest":
    default:
      return args.cursorAttract ? cursorForce(restAnchor, cursor) : restAnchor;
  }
}

export function useOrbPresence(args: UseOrbPresenceArgs): OrbPresence {
  const argsRef = useRef(args);
  useEffect(() => {
    argsRef.current = args;
  });

  const tx = useMotionValue(args.restAnchor.x);
  const ty = useMotionValue(args.restAnchor.y);
  const restSpring = args.reducedMotion ? { stiffness: 500, damping: 50, mass: 1 } : REST_SPRING;
  const x = useSpring(tx, restSpring);
  const y = useSpring(ty, restSpring);
  const vx = useMotionValue(0);
  const moving = useMotionValue(false);
  const captionAbove = useMotionValue(false);
  const movement = useMotionValue<"left" | "right" | "none">("none");
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const spotlightOn = useMotionValue(false);
  const prev = useRef<OrbPoint>({ x: args.restAnchor.x, y: args.restAnchor.y });
  const penPrev = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastDir = useRef<"left" | "right">("right");
  const dragPhase = useRef<number | null>(null);
  const clientCursor = useRef<OrbPoint | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      clientCursor.current = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      clientCursor.current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useAnimationFrame((time) => {
    const current = argsRef.current;
    if (!current.enabled) return;

    const layerRect = current.layerRef?.current?.getBoundingClientRect();
    let cursor: OrbPoint | null = null;
    if (current.mode === "rest" && current.cursorAttract && clientCursor.current && layerRect) {
      cursor = {
        x: clientCursor.current.x - layerRect.left,
        y: clientCursor.current.y - layerRect.top,
      };
    }

    let dockPoint: OrbPoint | null = null;
    if (current.mode === "dock" && current.dockTargetRef?.current && layerRect) {
      const rect = current.dockTargetRef.current.getBoundingClientRect();
      dockPoint = { x: rect.left - layerRect.left - DOCK_GAP, y: rect.top - layerRect.top + 64 };
    }

    let penPoint: OrbPoint | null = null;
    if (current.mode === "draw" && current.penClientRef?.current && layerRect) {
      const pen = current.penClientRef.current;
      let leadX = 0;
      let leadY = 0;
      const previousPen = penPrev.current;
      if (previousPen && time > previousPen.t) {
        const dt = time - previousPen.t;
        leadX = clamp(((pen.x - previousPen.x) / dt) * PEN_LEAD_MS, -PEN_LEAD_MAX, PEN_LEAD_MAX);
        leadY = clamp(((pen.y - previousPen.y) / dt) * PEN_LEAD_MS, -PEN_LEAD_MAX, PEN_LEAD_MAX);
      }
      penPrev.current = { x: pen.x, y: pen.y, t: time };
      penPoint = {
        x: pen.x - layerRect.left + DRAW_OFFSET.x + leadX,
        y: pen.y - layerRect.top + DRAW_OFFSET.y + leadY,
      };
    } else {
      penPrev.current = null;
    }

    const phase = Math.floor(time / SIDE_PERIOD);
    let restAnchor = current.restAnchor;
    let capAbove = false;
    const focus = current.stepFocusRef?.current;
    if (current.mode === "rest" && focus && focus.svg.isConnected && layerRect) {
      const onLeft = phase % 2 === 0;
      const beside = stepSideAnchor(focus, layerRect, onLeft);
      if (beside) {
        restAnchor = beside;
        capAbove = onLeft;
      }
    }

    let spotOn = false;
    const spotlight = current.spotlightRef?.current;
    if (current.mode === "rest" && spotlight && spotlight.svg.isConnected && layerRect) {
      const anchorClient = boardToClient(spotlight.anchor, spotlight.svg, spotlight.viewBoxWidth, spotlight.viewBoxHeight);
      const pointClient = boardToClient(spotlight.point, spotlight.svg, spotlight.viewBoxWidth, spotlight.viewBoxHeight);
      restAnchor = { x: anchorClient.x - layerRect.left, y: anchorClient.y - layerRect.top };
      spotlightX.set(pointClient.x - layerRect.left);
      spotlightY.set(pointClient.y - layerRect.top);
      capAbove = anchorClient.x >= pointClient.x;
      spotOn = true;
    }

    const drag = current.dragTargetRef?.current ?? null;
    if (current.mode === "rest" && drag) {
      if (dragPhase.current === null) dragPhase.current = phase;
      if (phase !== dragPhase.current) {
        if (current.dragTargetRef) current.dragTargetRef.current = null;
        dragPhase.current = null;
      } else {
        restAnchor = drag;
        spotOn = false;
      }
    } else {
      if (current.mode !== "rest" && current.dragTargetRef?.current) current.dragTargetRef.current = null;
      dragPhase.current = null;
    }

    if (captionAbove.get() !== capAbove) captionAbove.set(capAbove);
    if (spotlightOn.get() !== spotOn) spotlightOn.set(spotOn);

    const resolved = resolveTarget(current, restAnchor, cursor, dockPoint, penPoint);
    const target = { x: resolved.x, y: resolved.y };

    if (!current.reducedMotion) {
      const amp = current.mode === "draw" ? FLOAT_AMP_DRAW : FLOAT_AMP_REST;
      target.x += Math.sin(time / 820) * amp;
      target.y += Math.sin(time / 1100 + 1.3) * amp * 0.8;
    }

    if (layerRect && layerRect.width > 0) {
      target.x = clamp(target.x, CLAMP_MARGIN, layerRect.width - CLAMP_MARGIN);
      target.y = clamp(target.y, CLAMP_MARGIN, layerRect.height - CLAMP_MARGIN);
    }

    tx.set(target.x);
    ty.set(target.y);

    const cx = x.get();
    const cy = y.get();
    const dx = cx - prev.current.x;
    const dy = cy - prev.current.y;
    vx.set(dx);
    const isMoving = Math.hypot(dx, dy) > MOVING_EPS;
    moving.set(isMoving);

    if (isMoving) {
      if (dx > DIR_THRESHOLD) lastDir.current = "right";
      else if (dx < -DIR_THRESHOLD) lastDir.current = "left";
      if (movement.get() !== lastDir.current) movement.set(lastDir.current);
    } else if (movement.get() !== "none") {
      movement.set("none");
    }

    prev.current = { x: cx, y: cy };
  });

  return { x, y, vx, moving, captionAbove, movement, spotlightX, spotlightY, spotlightOn };
}
