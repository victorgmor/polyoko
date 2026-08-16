export const PAGE_FONT = "Brunswick Grotesque";
const KEY = "pm-font";

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
  el.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}&display=swap`;
  localStorage.setItem(KEY, name);
}

export function restoreFont() {
  const name = localStorage.getItem(KEY);
  if (name) applyFont(name);
}

export function savedFont() {
  return localStorage.getItem(KEY) ?? PAGE_FONT;
}
