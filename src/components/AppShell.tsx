import { useEffect, useState } from "react";
import DetailPanel from "./DetailPanel";
import { getPage, MENU_NODES } from "@/lib/menu";
import { loadSfxMuted, onSfxMove, playSfx, setSfxMuted, unlockSfx, warmupSfx } from "@/lib/sfx";

function pathToPageId(pathname: string): string {
  const id = pathname === "/" ? "/" : pathname.replace(/^\//, "");
  return getPage(id) ? id : "/";
}

function pageIdToPath(id: string): string {
  return id === "/" ? "/" : `/${id}`;
}

export default function AppShell({ pathname: initialPath }: { pathname: string }) {
  const [pathname, setPathname] = useState(initialPath);
  const [muted, setMuted] = useState(true);
  const [booted, setBooted] = useState(false);
  const pageId = pathToPageId(pathname);

  useEffect(() => {
    setMuted(loadSfxMuted());
    warmupSfx();
  }, []);

  useEffect(() => {
    if (booted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        boot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booted]);

  useEffect(() => {
    if (!booted) return;
    const onPop = () => setPathname(window.location.pathname);
    const unlock = () => unlockSfx();
    window.addEventListener("popstate", onPop);
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
    };
  }, [booted]);

  function boot() {
    if (booted) return;
    loadSfxMuted();
    unlockSfx();
    setBooted(true);
    playSfx("confirm");
  }

  function go(id: string) {
    const next = pageIdToPath(getPage(id) ? id : "/");
    if (next === pathname) {
      playSfx("confirm");
      return;
    }
    playSfx("open");
    history.pushState(null, "", next);
    setPathname(next);
  }

  if (!booted) {
    return (
      <button
        type="button"
        className="boot-screen"
        autoFocus
        onClick={boot}
      >
        <span className="boot-press">PRESS START</span>
      </button>
    );
  }

  return (
    <div className={pageId === "play" ? "app-shell is-play" : "app-shell"}>
      <header className="site-header">
        <nav className="site-nav">
          <button
            type="button"
            className={pageId === "/" ? "is-active" : undefined}
            onPointerEnter={onSfxMove}
            onClick={() => go("/")}
          >
            START
          </button>
          {MENU_NODES.filter((n) => !n.hideNav).map((n) =>
            n.href?.startsWith("http") ? (
              <a
                key={n.id}
                href={n.href}
                target="_blank"
                rel="noreferrer"
                onPointerEnter={onSfxMove}
                onClick={() => playSfx("confirm")}
              >
                {n.navTitle ?? n.title}
              </a>
            ) : (
              <button
                key={n.id}
                type="button"
                className={pageId === n.id ? "is-active" : undefined}
                onPointerEnter={onSfxMove}
                onClick={() => go(n.id)}
              >
                {n.navTitle ?? n.title}
              </button>
            ),
          )}
        </nav>
      </header>
      <div className="topbar">
        <button
          type="button"
          className={`hud-chip hud-mute${muted ? " is-muted" : ""}`}
          aria-pressed={muted}
          aria-label={muted ? "Unmute" : "Mute"}
          onPointerEnter={onSfxMove}
          onClick={() => {
            if (muted) {
              setSfxMuted(false);
              setMuted(false);
              playSfx("confirm");
            } else {
              setSfxMuted(true);
              setMuted(true);
            }
          }}
        >
          <span className="hud-mute-wrap" aria-hidden>
            {muted ? (
              <svg className="hud-mute-icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 22h-2v-2H9v-2h2V6H9V4h2V2h2v20Zm-4-4H7v-2h2v2Zm-2-8H5v4h2v2H3V8h4v2Zm10.001 5.224h-2v-2H17v-2h-1.999v-2h2v2H19v2h-1.999v2Zm3.999 0h-2v-2h2v2Zm0-4h-2v-2h2v2ZM9 8H7V6h2v2Z" />
              </svg>
            ) : (
              <svg className="hud-mute-icon" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 22h-2v-2H9v-2h2V6H9V4h2V2h2v20Zm-4-4H7v-2h2v2Zm10 0h-4v-2h4v2ZM7 10H5v4h2v2H3V8h4v2Zm14 6h-2V8h2v8Zm-4-2h-2v-4h2v4ZM9 8H7V6h2v2Zm10 0h-4V6h4v2Z" />
              </svg>
            )}
          </span>
        </button>
        <a
          className="powered-by"
          href="https://polymarket.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="powered-by-kicker">Powered by</span>
          <span className="powered-by-brand">
            <span className="powered-by-logo-wrap" aria-hidden>
              <span className="powered-by-logo" />
            </span>
            Polymarket
          </span>
        </a>
        <span className="hud-chip" aria-hidden>
          00
        </span>
      </div>
      <DetailPanel pageId={pageId} onPageChange={go} />
    </div>
  );
}
