export type SfxName = "move" | "confirm" | "open";

const SRC: Record<SfxName, string> = {
  move: "/sfx/move.wav?kawaii=1",
  confirm: "/sfx/confirm.wav?kawaii=1",
  open: "/sfx/open.wav?kawaii=1",
};

const MUTE_KEY = "polyoko-sfx-muted";
let muted = false;

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

export function unlockSfx() {
  if (typeof Audio === "undefined") return;
  (Object.keys(SRC) as SfxName[]).forEach((name) => {
    const a = new Audio(SRC[name]);
    a.preload = "auto";
  });
}

export function playSfx(name: SfxName) {
  if (muted || typeof Audio === "undefined") return;
  const a = new Audio(SRC[name]);
  a.volume = 0.55;
  void a.play().catch(() => {});
}

export function onSfxMove(e: { pointerType: string }) {
  if (e.pointerType !== "mouse") return;
  playSfx("move");
}
