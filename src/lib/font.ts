export const PAGE_FONT = "Brunswick Grotesque";
export const SIZE_MIN = 11;
export const SIZE_MAX = 22;
const KEY = "pm-font";
const KEY_W = "pm-font-w";
const KEY_S = "pm-font-s";

export function applyFont(name: string) {
  document.documentElement.style.setProperty("--font", JSON.stringify(name));
  const id = "gfont";
  if (name === PAGE_FONT) {
    document.getElementById(id)?.remove();
    localStorage.removeItem(KEY);
    return;
  }
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.id = id;
    el.rel = "stylesheet";
    document.head.appendChild(el);
  }
  el.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;700&display=swap`;
  localStorage.setItem(KEY, name);
}

export function applyWeight(bold: boolean) {
  document.documentElement.style.setProperty("--font-weight", bold ? "700" : "400");
  localStorage.setItem(KEY_W, bold ? "1" : "0");
}

export function applySize(px: number) {
  const size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, px));
  document.documentElement.style.setProperty("--type-size", `${size}px`);
  localStorage.setItem(KEY_S, String(size));
  return size;
}

export function restoreFont() {
  const name = localStorage.getItem(KEY);
  if (name) applyFont(name);
  applyWeight(localStorage.getItem(KEY_W) === "1");
  const s = Number(localStorage.getItem(KEY_S));
  if (s) applySize(s);
}

export function savedFont() {
  return localStorage.getItem(KEY) ?? PAGE_FONT;
}

export function savedBold() {
  return localStorage.getItem(KEY_W) === "1";
}

export function savedSize() {
  const s = Number(localStorage.getItem(KEY_S));
  return s || 13;
}
