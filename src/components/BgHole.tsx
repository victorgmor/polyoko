import { useEffect, useRef } from "react";
import * as THREE from "three";

const BAND_H = 120;
const IMG_H = 100;
const GAP = 20;
const MAX_W = 300;
const CLONES = 3;
const IMAGES = Array.from({ length: 32 }, (_, i) => `/img/markets/${String(i).padStart(2, "0")}.jpg`);

const BANDS = [
  { speed: 1.0 },
  { speed: 1.3 },
  { speed: 1.6 },
  { speed: 0.7 },
  { speed: 0.4 },
  { speed: 1.2 },
  { speed: 0.8 },
  { speed: 1.4 },
];

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform float uTextureWidth;
uniform float uSequenceWidth;
uniform float uBandHeight;
uniform float uScroll;
uniform float uSpeed;
uniform float uOffsetY;
varying vec2 vUv;

void main() {
  vec2 pixelCoord = vUv * uResolution;
  float bandTop = (uResolution.y - uBandHeight) * 0.5 + uOffsetY;
  float bandBottom = bandTop + uBandHeight;
  float margin = 3.0;
  if (pixelCoord.y < bandTop - margin || pixelCoord.y > bandBottom + margin) discard;

  float textureX = (mod(pixelCoord.x + uScroll * uSpeed, uSequenceWidth) + uSequenceWidth) / uTextureWidth;
  float texY = (pixelCoord.y - bandTop) / (bandBottom - bandTop);
  if (textureX < 0.0 || textureX > 1.0 || texY < 0.0 || texY > 1.0) discard;

  vec4 color = texture2D(uTexture, vec2(textureX, texY));
  if (color.a < 0.08) discard;

  float edge = min(pixelCoord.y - bandTop, bandBottom - pixelCoord.y);
  if (edge < margin) color.a *= smoothstep(0.0, margin, edge);
  if (color.a < 0.01) discard;

  gl_FragColor = vec4(color.rgb, color.a * 0.05);
}
`;

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function bandTexture(imgs: HTMLImageElement[]) {
  const sized = imgs.map((img) => {
    let h = IMG_H;
    let w = Math.round(h * (img.naturalWidth / img.naturalHeight));
    if (w > MAX_W) {
      w = MAX_W;
      h = Math.round(w / (img.naturalWidth / img.naturalHeight));
    }
    return { img, w, h };
  });
  const seq = sized.reduce((n, i) => n + i.w + GAP, 0) - GAP;
  const canvas = document.createElement("canvas");
  canvas.width = seq * CLONES;
  canvas.height = BAND_H;
  const ctx = canvas.getContext("2d", { alpha: true })!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let x = 0;
  for (let c = 0; c < CLONES; c++) {
    for (const { img, w, h } of sized) {
      const y = (BAND_H - h) / 2;
      const r = Math.min(16, w / 2, h / 2);
      const tile = document.createElement("canvas");
      tile.width = w;
      tile.height = h;
      const t = tile.getContext("2d")!;
      t.drawImage(img, 0, 0, w, h);
      t.globalCompositeOperation = "destination-in";
      t.beginPath();
      t.roundRect(0, 0, w, h, r);
      t.fill();
      ctx.drawImage(tile, x, y);
      x += w + GAP;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = true;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, total: canvas.width, seq };
}

export default function BgHole() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const freeze = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dead = false;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x2f62ff, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    el.appendChild(renderer.domElement);

    const materials: THREE.ShaderMaterial[] = [];
    const meshes: THREE.Mesh[] = [];
    const textures: THREE.CanvasTexture[] = [];

    const layout = () => {
      const w = innerWidth;
      const h = innerHeight;
      const n = materials.length || BANDS.length;
      const bandH = (h / n) * 0.72;
      renderer.setSize(w, h);
      materials.forEach((m, i) => {
        m.uniforms.uResolution.value.set(w, h);
        m.uniforms.uBandHeight.value = bandH;
        m.uniforms.uOffsetY.value = h * ((i + 0.5) / n - 0.5);
      });
    };
    addEventListener("resize", layout);

    let scroll = 0;
    const tick = () => {
      if (!freeze) scroll += 0.7;
      for (const m of materials) {
        m.uniforms.uScroll.value = scroll;
        m.uniforms.uResolution.value.set(innerWidth, innerHeight);
      }
      renderer.render(scene, camera);
    };

    (async () => {
      const loaded = (await Promise.allSettled(IMAGES.map(loadImg)))
        .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled")
        .map((r) => r.value);
      if (dead || loaded.length < 8) return;

      BANDS.forEach((cfg, i) => {
        const slice = Array.from({ length: 8 }, (_, j) => loaded[(i * 4 + j) % loaded.length]);
        const { tex, total, seq } = bandTexture(slice);
        textures.push(tex);
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
            uTexture: { value: tex },
            uTextureWidth: { value: total },
            uSequenceWidth: { value: seq },
            uBandHeight: { value: 0 },
            uScroll: { value: 0 },
            uSpeed: { value: cfg.speed },
            uOffsetY: { value: 0 },
          },
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          toneMapped: false,
          depthTest: false,
          depthWrite: false,
        });
        materials.push(material);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        mesh.position.z = i * -0.1;
        scene.add(mesh);
        meshes.push(mesh);
      });
      layout();

      if (freeze) tick();
      else renderer.setAnimationLoop(tick);
    })();

    return () => {
      dead = true;
      renderer.setAnimationLoop(null);
      removeEventListener("resize", layout);
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        scene.remove(mesh);
      }
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="bg-hole" ref={host} aria-hidden />;
}
