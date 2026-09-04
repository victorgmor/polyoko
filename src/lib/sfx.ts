export type SfxName = "move" | "confirm" | "open";

const SRC: Record<SfxName, string> = {
  move: "/sfx/move.wav?kawaii=1",
  confirm: "/sfx/confirm.wav?kawaii=1",
  open: "/sfx/open.wav?kawaii=1",
};

const MUTE_KEY = "polyoko-sfx-muted";
const NAMES = Object.keys(SRC) as SfxName[];

let muted = false;
let ctx: AudioContext | null = null;
const buffers: Partial<Record<SfxName, AudioBuffer>> = {};
const raw: Partial<Record<SfxName, ArrayBuffer>> = {};
let decode: Promise<void> | null = null;

export function loadSfxMuted(): boolean {
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
  return muted;
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function audioCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null;
}

function audioCtx(): AudioContext | null {
  const Ctor = audioCtor();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function warmupSfx() {
  if (typeof fetch === "undefined") return;
  NAMES.forEach((name) => {
    if (raw[name]) return;
    void fetch(SRC[name])
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        raw[name] = buf;
      })
      .catch(() => {});
  });
}

function decodeAll(ac: AudioContext) {
  if (decode) return decode;
  decode = Promise.all(
    NAMES.map(async (name) => {
      if (buffers[name]) return;
      const buf = raw[name] ?? (await fetch(SRC[name]).then((r) => r.arrayBuffer()));
      raw[name] = buf;
      buffers[name] = await ac.decodeAudioData(buf.slice(0));
    }),
  ).then(() => undefined);
  return decode;
}

export function unlockSfx() {
  const ac = audioCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  void decodeAll(ac);
}

function start(name: SfxName) {
  const ac = ctx;
  const buf = buffers[name];
  if (!ac || ac.state !== "running" || !buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = 0.55;
  src.connect(gain);
  gain.connect(ac.destination);
  src.start(0);
}

export function playSfx(name: SfxName) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  if (ac.state === "running" && buffers[name]) {
    start(name);
    return;
  }
  const kick = ac.state === "suspended" ? ac.resume() : Promise.resolve();
  void kick.then(() => decodeAll(ac)).then(() => {
    if (!muted) start(name);
  });
}

export function onSfxMove(e: { pointerType: string }) {
  if (e.pointerType !== "mouse") return;
  playSfx("move");
}
