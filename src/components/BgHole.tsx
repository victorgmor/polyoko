import { useEffect, useRef } from "react";

// 21st.dev/@designali-in/components/vector-field
const LINE = "rgba(255,255,255,0.7)";
const WEIGHT = 2;
const PROXIMITY = 16; // ponytail: 8 melts a laptop
const SIZE = 10;
const PAD = 18; // panel radius 15 + stroke, so ticks miss the corners

type Hole = { l: number; t: number; r: number; b: number };

function walk(start: number, step: number, test: (v: number) => boolean) {
  const out: number[] = [];
  for (let v = start; test(v); v += step) out.push(v);
  return out;
}

function pointsAround(w: number, h: number, hole: Hole) {
  const { l, t, r, b } = hole;
  const xs = [...walk(l, -PROXIMITY, (x) => x >= -PROXIMITY), ...walk(l + PROXIMITY, PROXIMITY, (x) => x <= w + PROXIMITY)];
  const ys = [...walk(t, -PROXIMITY, (y) => y >= -PROXIMITY), ...walk(t + PROXIMITY, PROXIMITY, (y) => y <= h + PROXIMITY)];
  const pts: { x: number; y: number }[] = [];
  for (const y of ys) {
    for (const x of xs) {
      if (x >= l && x <= r && y >= t && y <= b) continue;
      pts.push({ x, y });
    }
  }
  return pts;
}

function clipEnd(x1: number, y1: number, x2: number, y2: number, hole: Hole) {
  const { l, t, r, b } = hole;
  if (x2 < l || x2 > r || y2 < t || y2 > b) return { x: x2, y: y2 };
  const dx = x2 - x1;
  const dy = y2 - y1;
  let best = 1;
  const hits = [dx ? (l - x1) / dx : 2, dx ? (r - x1) / dx : 2, dy ? (t - y1) / dy : 2, dy ? (b - y1) / dy : 2];
  for (const u of hits) {
    if (u <= 0 || u >= best) continue;
    const x = x1 + u * dx;
    const y = y1 + u * dy;
    if (x >= l - 0.6 && x <= r + 0.6 && y >= t - 0.6 && y <= b + 0.6) best = u;
  }
  return { x: x1 + best * dx, y: y1 + best * dy };
}

export default function BgHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    let pts: { x: number; y: number }[] = [];
    let hole: Hole = { l: 0, t: 0, r: 0, b: 0 };
    let key = "";
    let watched: Element | null = null;
    let raf = 0;
    const freeze = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ro = new ResizeObserver(() => {
      key = "";
      layout();
      if (freeze) draw();
    });

    const layout = () => {
      if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        key = "";
      }
      const el = document.querySelector(".page-stack");
      if (el !== watched) {
        if (watched) ro.unobserve(watched);
        if (el) ro.observe(el);
        watched = el;
      }
      const box = el?.getBoundingClientRect();
      const next = box
        ? `${innerWidth}x${innerHeight}:${Math.round(box.left)}:${Math.round(box.top)}:${Math.round(box.width)}:${Math.round(box.height)}`
        : `${innerWidth}x${innerHeight}`;
      if (next === key && pts.length) return;
      key = next;
      if (box && box.width > 8) {
        hole = { l: box.left - PAD, t: box.top - PAD, r: box.right + PAD, b: box.bottom + PAD };
        pts = pointsAround(canvas.width, canvas.height, hole);
      } else {
        hole = { l: 0, t: 0, r: 0, b: 0 };
        pts = [];
      }
    };

    const heading = (x: number, y: number) => Math.atan2(-x - y, y - x);

    const draw = () => {
      layout();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = WEIGHT;
      ctx.lineCap = "round";
      for (const p of pts) {
        const a = heading(p.x - mouse.x, p.y - mouse.y);
        const end = clipEnd(p.x, p.y, p.x + SIZE * Math.cos(a), p.y + SIZE * Math.sin(a), hole);
        if ((end.x - p.x) ** 2 + (end.y - p.y) ** 2 < 1) continue;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    };

    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };

    layout();
    if (freeze) draw();
    else raf = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    addEventListener("mousemove", onMove);
    addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("mousemove", onMove);
      removeEventListener("resize", layout);
    };
  }, []);

  return (
    <div className="bg-hole" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
