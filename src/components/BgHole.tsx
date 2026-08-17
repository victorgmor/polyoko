import { useEffect, useRef } from "react";

// 21st.dev/@designali-in/components/vector-field
const LINE = "rgba(255,255,255,0.7)";
const WEIGHT = 2;
const PROXIMITY = 16; // ponytail: 8 melts a laptop
const SIZE = 10;
const PAD = 18;
const IN_L = PROXIMITY;
const IN_T = PROXIMITY;
const IN_R = PROXIMITY;
const IN_B = PROXIMITY;
const WRAP = 4;
const SHIFT_X = -12;
const SHIFT_Y = -8;

type Hole = { l: number; t: number; r: number; b: number };

function walk(start: number, step: number, test: (v: number) => boolean) {
  const out: number[] = [];
  for (let v = start; test(v); v += step) out.push(v);
  return out;
}

function holeFrom(el: Element | null, pad = WRAP): Hole | null {
  const r = el?.getBoundingClientRect();
  if (!r || r.width < 8) return null;
  return { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad };
}

function inHole(x: number, y: number, hole: Hole) {
  return x >= hole.l && x <= hole.r && y >= hole.t && y <= hole.b;
}

function pointsAround(w: number, h: number, holes: Hole[]) {
  const o = holes[0] ?? { l: 0, t: 0, r: 0, b: 0 };
  const xs = [...walk(o.l + SHIFT_X, -PROXIMITY, (x) => x >= -PROXIMITY), ...walk(o.l + SHIFT_X + PROXIMITY, PROXIMITY, (x) => x <= w + PROXIMITY)];
  const ys = [...walk(o.t + SHIFT_Y, -PROXIMITY, (y) => y >= -PROXIMITY), ...walk(o.t + SHIFT_Y + PROXIMITY, PROXIMITY, (y) => y <= h + PROXIMITY)];
  const pts: { x: number; y: number }[] = [];
  for (const y of ys) {
    for (const x of xs) {
      if (holes.some((hole) => inHole(x, y, hole))) continue;
      pts.push({ x, y });
    }
  }
  return pts;
}

function clipOne(x1: number, y1: number, x2: number, y2: number, hole: Hole) {
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

function clipEnd(x1: number, y1: number, x2: number, y2: number, holes: Hole[]) {
  let end = { x: x2, y: y2 };
  for (const hole of holes) end = clipOne(x1, y1, end.x, end.y, hole);
  return end;
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
    let holes: Hole[] = [];
    let key = "";
    const watched = new Set<Element>();
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
      const panel = document.querySelector(".page-stack");
      const nav = document.querySelector(".site-nav");
      const foot = document.querySelector(".powered-by");
      for (const el of [panel, nav, foot]) {
        if (el && !watched.has(el)) {
          ro.observe(el);
          watched.add(el);
        }
      }
      const box = panel?.getBoundingClientRect();
      const navBox = nav?.getBoundingClientRect();
      const footBox = foot?.getBoundingClientRect();
      const next = `${innerWidth}x${innerHeight}:${box ? `${Math.round(box.left)}:${Math.round(box.top)}:${Math.round(box.width)}:${Math.round(box.height)}` : ""}:${navBox ? `${Math.round(navBox.left)}:${Math.round(navBox.top)}:${Math.round(navBox.width)}:${Math.round(navBox.height)}` : ""}:${footBox ? `${Math.round(footBox.left)}:${Math.round(footBox.top)}:${Math.round(footBox.width)}` : ""}`;
      if (next === key && pts.length) return;
      key = next;
      holes = [];
      if (box && box.width > 8) {
        holes.push({
          l: box.left - PAD + IN_L,
          t: box.top - PAD + IN_T,
          r: box.right + PAD - IN_R,
          b: box.bottom + PAD - IN_B,
        });
      }
      const navHole = holeFrom(nav);
      if (navHole) holes.push(navHole);
      const footHole = holeFrom(foot);
      if (footHole) holes.push(footHole);
      pts = holes.length ? pointsAround(canvas.width, canvas.height, holes) : [];
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
        const end = clipEnd(p.x, p.y, p.x + SIZE * Math.cos(a), p.y + SIZE * Math.sin(a), holes);
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
