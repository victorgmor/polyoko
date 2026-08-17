import { useEffect, useRef } from "react";

// 21st.dev/@designali-in/components/vector-field
const LINE = "rgba(255,255,255,0.7)";
const PROXIMITY = 16; // ponytail: 8 melts a laptop
const ICON = 14;
const MARK_D =
  "M18 7.36981C16.7435 5.91657 14.9052 5 12.8571 5C9.07005 5 6 8.13401 6 12C6 15.866 9.07005 19 12.8571 19C14.9052 19 16.7435 18.0834 18 16.6302M13 5V3M13 21V19";
const PAD = 18; // panel radius 15 + stroke, so ticks miss the corners
const IN_L = 2 * PROXIMITY;
const IN_T = 2 * PROXIMITY;
const IN_R = PROXIMITY;
const IN_B = PROXIMITY;

type Hole = { l: number; t: number; r: number; b: number };

function walk(start: number, step: number, test: (v: number) => boolean) {
  const out: number[] = [];
  for (let v = start; test(v); v += step) out.push(v);
  return out;
}

function inHole(x: number, y: number, hole: Hole) {
  return x >= hole.l && x <= hole.r && y >= hole.t && y <= hole.b;
}

function pointsAround(w: number, h: number, holes: Hole[]) {
  const o = holes[0] ?? { l: 0, t: 0, r: 0, b: 0 };
  const xs = [...walk(o.l, -PROXIMITY, (x) => x >= -PROXIMITY), ...walk(o.l + PROXIMITY, PROXIMITY, (x) => x <= w + PROXIMITY)];
  const ys = [...walk(o.t, -PROXIMITY, (y) => y >= -PROXIMITY), ...walk(o.t + PROXIMITY, PROXIMITY, (y) => y <= h + PROXIMITY)];
  const pts: { x: number; y: number }[] = [];
  for (const y of ys) {
    for (const x of xs) {
      if (holes.some((hole) => inHole(x, y, hole))) continue;
      pts.push({ x, y });
    }
  }
  return pts;
}

export default function BgHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mark = new Path2D(MARK_D);

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
      for (const el of [panel, nav]) {
        if (el && !watched.has(el)) {
          ro.observe(el);
          watched.add(el);
        }
      }
      const box = panel?.getBoundingClientRect();
      const navBox = nav?.getBoundingClientRect();
      const next = `${innerWidth}x${innerHeight}:${box ? `${Math.round(box.left)}:${Math.round(box.top)}:${Math.round(box.width)}:${Math.round(box.height)}` : ""}:${navBox ? `${Math.round(navBox.left)}:${Math.round(navBox.top)}:${Math.round(navBox.width)}:${Math.round(navBox.height)}` : ""}`;
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
      if (navBox && navBox.width > 8) {
        const row = 2 * PROXIMITY;
        holes.push({
          l: navBox.left,
          t: navBox.top - row,
          r: navBox.right,
          b: navBox.bottom + row,
        });
      }
      pts = holes.length ? pointsAround(canvas.width, canvas.height, holes) : [];
    };

    const draw = () => {
      layout();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const s = ICON / 24;
      for (const p of pts) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const vx = dy - dx;
        const len = Math.hypot(vx, -dx - dy) || 1;
        const sx = vx / len; // XZ flip (around Y), not XY spin
        if (Math.abs(sx) < 0.06) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(s * sx, s);
        ctx.translate(-12, -12);
        ctx.stroke(mark);
        ctx.restore();
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
