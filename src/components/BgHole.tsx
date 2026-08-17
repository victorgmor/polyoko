import { useEffect, useRef } from "react";

// 21st.dev/@designali-in/components/vector-field
const LINE = "rgba(255,255,255,0.45)";
const WEIGHT = 2;
const PROXIMITY = 16; // ponytail: 8 melts a laptop
const SIZE = 10;

export default function BgHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    let pts: { x: number; y: number }[] = [];
    let raf = 0;
    const freeze = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      pts = [];
      const cols = Math.ceil(canvas.width / PROXIMITY) + 1;
      const rows = Math.ceil(canvas.height / PROXIMITY) + 1;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          pts.push({ x: PROXIMITY * i, y: PROXIMITY * j });
        }
      }
    };

    const heading = (x: number, y: number) => Math.atan2(-x - y, y - x);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = WEIGHT;
      ctx.lineCap = "round";
      for (const p of pts) {
        const a = heading(p.x - mouse.x, p.y - mouse.y);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + SIZE * Math.cos(a), p.y + SIZE * Math.sin(a));
        ctx.stroke();
      }
    };

    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };

    init();
    if (freeze) draw();
    else raf = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    addEventListener("mousemove", onMove);
    addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMove);
      removeEventListener("resize", init);
    };
  }, []);

  return (
    <div className="bg-hole" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
