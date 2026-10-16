"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Point = {
  readonly x: number;
  readonly y: number;
};

type Stroke = Point[];

type InkBox = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

const INK_COLOR = "#14212b";
const INK_WIDTH = 2.4;
const EXPORT_PADDING = 18;
const EXPORT_TARGET_WIDTH = 640;
const MAX_EXPORT_SCALE = 3;
const DOT_RADIUS = INK_WIDTH / 2;

function inkBoxOf(strokes: readonly Stroke[]): InkBox | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const stroke of strokes) {
    for (const point of stroke) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { minX, minY, maxX, maxY };
}

function drawStrokes(
  context: CanvasRenderingContext2D,
  strokes: readonly Stroke[],
): void {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = INK_COLOR;
  context.fillStyle = INK_COLOR;
  context.lineWidth = INK_WIDTH;
  for (const stroke of strokes) {
    if (stroke.length === 1) {
      const point = stroke[0];
      if (point === undefined) continue;
      context.beginPath();
      context.arc(point.x, point.y, DOT_RADIUS, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.beginPath();
    const first = stroke[0];
    if (first === undefined) continue;
    context.moveTo(first.x, first.y);
    for (let index = 1; index < stroke.length; index += 1) {
      const point = stroke[index];
      if (point === undefined) continue;
      context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
}

function capturePointer(element: HTMLCanvasElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    return;
  }
}

function exportSignature(strokes: readonly Stroke[]): string | null {
  const box = inkBoxOf(strokes);
  if (box === null) return null;
  const width = box.maxX - box.minX + EXPORT_PADDING * 2;
  const height = box.maxY - box.minY + EXPORT_PADDING * 2;
  const scale = Math.min(
    MAX_EXPORT_SCALE,
    Math.max(1, EXPORT_TARGET_WIDTH / width),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (context === null) return null;
  context.scale(scale, scale);
  context.translate(EXPORT_PADDING - box.minX, EXPORT_PADDING - box.minY);
  drawStrokes(context, strokes);
  return canvas.toDataURL("image/png");
}

type SignaturePadProps = {
  readonly onChange: (dataUrl: string | null) => void;
  readonly disabled?: boolean;
  readonly className?: string;
};

function SignaturePad({
  onChange,
  disabled = false,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (context === null) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      drawStrokes(context, strokesRef.current);
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
    };
  }, []);

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    capturePointer(event.currentTarget, event.pointerId);
    const stroke: Stroke = [pointFrom(event)];
    strokesRef.current.push(stroke);
    activeStrokeRef.current = stroke;
    if (!hasInk) setHasInk(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    const canvas = canvasRef.current;
    if (disabled || stroke === null || canvas === null) return;
    const point = pointFrom(event);
    const previous = stroke[stroke.length - 1];
    stroke.push(point);
    const context = canvas.getContext("2d");
    if (context === null || previous === undefined) return;
    const ratio = window.devicePixelRatio || 1;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = INK_COLOR;
    context.lineWidth = INK_WIDTH;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function handlePointerEnd() {
    activeStrokeRef.current = null;
    onChange(exportSignature(strokesRef.current));
  }

  function clear() {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    setHasInk(false);
    onChange(null);
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const context = canvas.getContext("2d");
    if (context === null) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-9 border-border border-b border-dotted"
        />
        <canvas
          ref={canvasRef}
          aria-label="Area tanda tangan"
          className={cn(
            "h-40 w-full cursor-crosshair touch-none",
            disabled && "pointer-events-none opacity-50",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />
        {hasInk ? null : (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-foreground-subtle">
            Gambar tanda tanganmu di sini
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xs leading-4 text-foreground-subtle">
          Pakai jari di layar sentuh atau mouse di komputer.
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasInk}
          className="shrink-0 text-xs font-medium text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

export { SignaturePad };