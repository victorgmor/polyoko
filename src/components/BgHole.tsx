import { useEffect, useRef } from "react";

const RINGS = 20;
const SEG = 24;
const DEG = Math.PI / 180;
const PAPER = "rgba(47, 98, 255, 0.2)";

function rx(x: number, y: number, z: number, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c] as const;
}
function ry(x: number, y: number, z: number, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c] as const;
}
function rz(x: number, y: number, z: number, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z] as const;
}
function apply(p: readonly [number, number, number], rot: [number, number, number]) {
  let [x, y, z] = rz(p[0], p[1], p[2], rot[2]);
  [x, y, z] = ry(x, y, z, rot[1]);
  return rx(x, y, z, rot[0]);
}

export default function BgHole() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const spin = new Array(RINGS).fill(0);

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    };
    resize();
    addEventListener("resize", resize);

    const frame = () => {
      const w = canvas.width;
      const h = canvas.height;
      const zoom = Math.min(w, h) / 900;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1.6 * Math.min(devicePixelRatio, 2);

      for (let i = 0; i < RINGS; i++) {
        const frac = i / (RINGS - 1);
        const scale = frac * 300 + 1;
        const tilt = (((1 - frac) * -45) + 65) * DEG;
        spin[i] += (RINGS - i) * 0.2 * DEG;
        const rot: [number, number, number] = [spin[i], tilt, 0.6 * tilt];
        const origin = apply([-250 + (1 - frac) * 700, 0, 0], rot);

        ctx.beginPath();
        for (let s = 0; s <= SEG; s++) {
          const a = (s / SEG) * Math.PI * 2;
          let p = apply([Math.cos(a) * scale, Math.sin(a) * scale, 0], rot);
          p = [p[0] + origin[0], p[1] + origin[1], p[2] + origin[2]];
          const f = 420 / (420 + p[2]);
          const x = w / 2 + p[0] * f * zoom;
          const y = h / 2 + p[1] * f * zoom;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(224, 100%, 48%, ${0.12 + frac * 0.5})`;
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas className="bg-hole" ref={ref} aria-hidden />;
}
