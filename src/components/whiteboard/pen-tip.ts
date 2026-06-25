import type { GeoFigure, GeometryAction, LocalPoint, WhiteboardStep } from "@/types/whiteboard";

export type LocalVec = { x: number; y: number };
export type BoardPoint = { x: number; y: number };

export interface BoardBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StepFocus {
  box: BoardBox;
  svg: SVGSVGElement;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export interface OrbSpotlight {
  point: BoardPoint;
  anchor: BoardPoint;
  svg: SVGSVGElement;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

const CURVE_SEGMENTS = 48;
const TRAVEL_GAP = 0.18;
const STANDOFF_LOCAL = 16;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function toBoard(point: LocalPoint, box: BoardBox): BoardPoint {
  return {
    x: box.x + (point.x / 100) * box.width,
    y: box.y + (point.y / 100) * box.height,
  };
}

function arc(center: BoardPoint, rx: number, ry: number): BoardPoint[] {
  return Array.from({ length: CURVE_SEGMENTS + 1 }, (_, index) => {
    const angle = (index / CURVE_SEGMENTS) * 2 * Math.PI;
    return { x: center.x + rx * Math.cos(angle), y: center.y + ry * Math.sin(angle) };
  });
}

function figurePolyline(figure: GeoFigure, box: BoardBox): BoardPoint[] | null {
  switch (figure.type) {
    case "polygon": {
      if (!figure.vertices.length) return null;
      const points = figure.vertices.map((point) => toBoard(point, box));
      points.push(points[0]);
      return points;
    }
    case "line_segment":
      return [toBoard(figure.from, box), toBoard(figure.to, box)];
    case "circle": {
      const center = toBoard(figure.center, box);
      const radius = (figure.radius / 100) * Math.min(box.width, box.height);
      return arc(center, radius, radius);
    }
    case "ellipse": {
      const center = toBoard(figure.center, box);
      return arc(center, (figure.rx / 100) * box.width, (figure.ry / 100) * box.height);
    }
    default:
      return null;
  }
}

function polylineLength(points: BoardPoint[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length;
}

function sampleAtFraction(points: BoardPoint[], t: number): BoardPoint {
  if (points.length === 1) return points[0];
  const total = polylineLength(points);
  if (total === 0) return points[0];
  const target = clamp01(t) * total;
  let cursor = 0;

  for (let i = 1; i < points.length; i += 1) {
    const segment = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (cursor + segment >= target) {
      const local = segment === 0 ? 0 : (target - cursor) / segment;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * local,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * local,
      };
    }
    cursor += segment;
  }

  return points[points.length - 1];
}

export function geometryFigureSchedule(figures: GeoFigure[], box: BoardBox): { start: number; end: number }[] {
  const lengths = figures.map((figure) => {
    const polyline = figurePolyline(figure, box);
    return polyline ? polylineLength(polyline) : 0;
  });
  const traceable = lengths.filter((length) => length > 0).length;
  const gaps = Math.max(0, traceable - 1);
  const drawPortion = Math.max(0.1, 1 - gaps * TRAVEL_GAP);
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let cursor = 0;
  let seen = 0;

  return lengths.map((length) => {
    if (length <= 0) return { start: cursor, end: cursor };
    if (seen > 0) cursor += TRAVEL_GAP;
    const slice = drawPortion * (length / total);
    const segment = { start: cursor, end: cursor + slice };
    cursor += slice;
    seen += 1;
    return segment;
  });
}

function geometryPenTip(action: GeometryAction, progress: number, box: BoardBox): BoardPoint | null {
  const figures = action.figures ?? [];
  const schedule = geometryFigureSchedule(figures, box);
  const items: Array<{ segment: { start: number; end: number }; polyline: BoardPoint[] }> = [];

  for (let i = 0; i < figures.length; i += 1) {
    const segment = schedule[i];
    if (!segment || segment.end <= segment.start) continue;
    const polyline = figurePolyline(figures[i], box);
    if (polyline) items.push({ segment, polyline });
  }

  if (!items.length) return null;
  if (progress <= items[0].segment.start) return sampleAtFraction(items[0].polyline, 0);

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (progress >= item.segment.start && progress < item.segment.end) {
      return sampleAtFraction(item.polyline, (progress - item.segment.start) / (item.segment.end - item.segment.start));
    }

    if (progress < item.segment.start) {
      const previous = items[i - 1];
      const gapStart = previous.segment.end;
      const f = item.segment.start > gapStart ? (progress - gapStart) / (item.segment.start - gapStart) : 1;
      const from = sampleAtFraction(previous.polyline, 1);
      const to = sampleAtFraction(item.polyline, 0);
      const baseX = from.x + (to.x - from.x) * f;
      const baseY = from.y + (to.y - from.y) * f;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const side = i % 2 === 0 ? 1 : -1;
      const bow = Math.sin(f * Math.PI) * Math.min(0.42 * distance, 110) * side;
      return { x: baseX + (-dy / distance) * bow, y: baseY + (dx / distance) * bow };
    }
  }

  return sampleAtFraction(items[items.length - 1].polyline, 1);
}

export function isDiagramStep(step: WhiteboardStep | undefined): boolean {
  if (!step) return false;
  return (
    step.action.type === "geometry" ||
    step.action.type === "coordinate_plane" ||
    step.action.type === "number_line" ||
    step.action.type === "draw_shape"
  );
}

export function penTipForStep(step: WhiteboardStep | undefined, progress: number, box: BoardBox): BoardPoint | null {
  if (!step) return null;
  if (step.action.type === "geometry") return geometryPenTip(step.action, progress, box);
  if (isDiagramStep(step)) return { x: box.x + clamp01(progress) * box.width, y: box.y + box.height * 0.5 };
  return null;
}

export function boardToClient(
  point: BoardPoint,
  svg: SVGSVGElement,
  viewBoxWidth: number,
  viewBoxHeight: number,
): BoardPoint {
  const rect = svg.getBoundingClientRect();
  return {
    x: rect.left + (point.x / viewBoxWidth) * rect.width,
    y: rect.top + (point.y / Math.max(1, viewBoxHeight)) * rect.height,
  };
}

function shapeCentroid(action: GeometryAction): LocalPoint {
  const points: LocalPoint[] = [];
  for (const figure of action.figures ?? []) {
    if (figure.type === "polygon") points.push(...figure.vertices);
    else if (figure.type === "circle" || figure.type === "ellipse") points.push(figure.center);
    else if (figure.type === "line_segment") points.push(figure.from, figure.to);
  }
  if (!points.length) return { x: 50, y: 50 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

const mid = (a: LocalPoint, b: LocalPoint): LocalPoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const norm = (value: string) => value.trim().toLowerCase();

function vertexByLabel(action: GeometryAction, label: string): LocalPoint | null {
  const wanted = norm(label);
  for (const figure of action.figures ?? []) {
    if (figure.type !== "polygon" || !figure.vertexLabels) continue;
    const index = figure.vertexLabels.findIndex((candidate) => candidate && norm(candidate) === wanted);
    if (index >= 0 && index < figure.vertices.length) return figure.vertices[index];
  }
  return null;
}

function resolveShapePart(action: GeometryAction, part: string): { point: LocalPoint; outward: LocalVec } | null {
  if (!part) return null;
  const raw = part.trim();
  let point = vertexByLabel(action, raw);

  if (!point) {
    const letters = raw.replace(/[\s-]/g, "");
    if (letters.length === 2) {
      const a = vertexByLabel(action, letters[0]);
      const b = vertexByLabel(action, letters[1]);
      if (a && b) point = mid(a, b);
    }
  }

  if (!point) {
    const wanted = norm(raw);
    for (const label of action.labels ?? []) {
      if (norm(label.text) === wanted) {
        point = label.position;
        break;
      }
    }
    if (!point) {
      for (const annotation of action.annotations ?? []) {
        if (annotation.type === "dimension" && norm(annotation.label) === wanted) {
          point = mid(annotation.from, annotation.to);
          break;
        }
        if (annotation.type === "angle_arc" && annotation.label && norm(annotation.label) === wanted) {
          point = annotation.vertex;
          break;
        }
      }
    }
  }

  if (!point) return null;

  const center = shapeCentroid(action);
  let ox = point.x - center.x;
  let oy = point.y - center.y;
  const length = Math.hypot(ox, oy);
  if (length < 0.5) {
    ox = 0;
    oy = -1;
  } else {
    ox /= length;
    oy /= length;
  }

  return { point, outward: { x: ox, y: oy } };
}

export function shapePartBoard(action: GeometryAction, part: string, box: BoardBox): { point: BoardPoint; anchor: BoardPoint } | null {
  const resolved = resolveShapePart(action, part);
  if (!resolved) return null;
  return {
    point: toBoard(resolved.point, box),
    anchor: toBoard(
      {
        x: resolved.point.x + resolved.outward.x * STANDOFF_LOCAL,
        y: resolved.point.y + resolved.outward.y * STANDOFF_LOCAL,
      },
      box,
    ),
  };
}
