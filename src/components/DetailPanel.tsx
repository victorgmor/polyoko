import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  getPage,
  WISHLIST_JSON,
  type CtaChoice,
  type MenuSection,
  type PageContent,
} from "@/lib/menu";
import PlayDesk from "./PlayDesk";
import { onSfxMove, playSfx } from "@/lib/sfx";

function MenuGirl() {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: number[] = [];

    function later(ms: number, fn: () => void) {
      timers.push(window.setTimeout(fn, ms));
    }

    function schedule() {
      if (cancelled) return;
      later(2200 + Math.random() * 7000, () => {
        if (cancelled) return;
        setBlink(true);
        later(100 + Math.random() * 80, () => {
          if (cancelled) return;
          setBlink(false);
          if (Math.random() < 0.25) {
            later(80 + Math.random() * 60, () => {
              if (cancelled) return;
              setBlink(true);
              later(100 + Math.random() * 50, () => {
                if (cancelled) return;
                setBlink(false);
                schedule();
              });
            });
          } else {
            schedule();
          }
        });
      });
    }

    schedule();
    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, []);

  return (
    <>
      <img className="menu-girl" src="/img/menu-girl.png" alt="" aria-hidden />
      <img
        className={`menu-girl menu-girl-lid${blink ? " is-on" : ""}`}
        src="/img/menu-girl-blink.png"
        alt=""
        aria-hidden
      />
    </>
  );
}

function Paras({ text }: { text: string }) {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((block, i) => <p key={i}>{block}</p>);
}

function TypedParas({ text, caret }: { text: string; caret: boolean }) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  if (!blocks.length) {
    return caret ? (
      <p>
        <span className="dialog-caret" aria-hidden />
      </p>
    ) : null;
  }
  return blocks.map((block, i) => (
    <p key={i}>
      {block}
      {caret && i === blocks.length - 1 ? (
        <span className="dialog-caret" aria-hidden />
      ) : null}
    </p>
  ));
}

function useTypewriter(text: string, enabled = true) {
  const [n, setN] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setN(0);
    if (!enabled) return;
    if (!text.length) {
      doneRef.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doneRef.current = true;
      setN(text.length);
      return;
    }
    let i = 0;
    let id = 0;
    const step = () => {
      if (doneRef.current) return;
      i += 1;
      setN(i);
      if (i >= text.length) {
        doneRef.current = true;
        return;
      }
      const ch = text[i - 1];
      const wait = /[.!?]/.test(ch) ? 70 : /[,—–-]/.test(ch) ? 36 : 16;
      id = window.setTimeout(step, wait);
    };
    id = window.setTimeout(step, 30);
    return () => clearTimeout(id);
  }, [text, enabled]);

  const skip = useCallback(() => {
    if (doneRef.current || !enabled) return;
    doneRef.current = true;
    setN(text.length);
  }, [enabled, text.length]);

  useEffect(() => {
    if (!enabled) return;
    const onPtr = (e: PointerEvent) => {
      if (e.button !== 0) return;
      skip();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") skip();
    };
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPtr, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onPtr, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [enabled, skip]);

  return { n, typing: enabled && n < text.length, skip };
}

function TypeDialog({
  text,
  onDone,
  speech = false,
  side = "her",
}: {
  text: string;
  onDone?: () => void;
  speech?: boolean;
  side?: "her" | "you";
}) {
  const { n, typing, skip } = useTypewriter(text);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const notified = useRef(false);

  useEffect(() => {
    notified.current = false;
  }, [text]);

  useEffect(() => {
    if (typing || notified.current || n < text.length) return;
    notified.current = true;
    onDoneRef.current?.();
  }, [typing, n, text.length]);

  return (
    <div
      className={`dialog-type${speech ? " is-speech" : ""}${speech && side === "you" ? " is-you" : ""}${typing ? " is-typing" : ""}`}
      onClick={skip}
      role={typing ? "button" : undefined}
      tabIndex={typing ? 0 : undefined}
      onKeyDown={
        typing
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                skip();
              }
            }
          : undefined
      }
      aria-label={typing ? "Skip dialog" : undefined}
    >
      <div className="dialog-measure" aria-hidden>
        <Paras text={text} />
      </div>
      <div className="dialog-live">
        <TypedParas text={text.slice(0, n)} caret={typing} />
      </div>
    </div>
  );
}

function SpeechBox({
  text,
  side,
}: {
  text: string;
  side: "her" | "you";
}) {
  return (
    <div className={`dialog-type is-speech${side === "you" ? " is-you" : ""}`}>
      <Paras text={text} />
    </div>
  );
}

function CtaButtons({
  choices,
  onPick,
}: {
  choices: CtaChoice[];
  onPick: (c: CtaChoice) => void;
}) {
  return (
    <div className="launch-btns retro-enter">
      {choices.map((c) => (
        <a
          key={c.label}
          href={c.href ?? "#"}
          className={`launch-btn${c.ghost ? " is-ghost" : ""}${c.disabled ? " is-disabled" : ""}`}
          target={c.href?.startsWith("http") ? "_blank" : undefined}
          rel={c.href?.startsWith("http") ? "noreferrer" : undefined}
          aria-disabled={c.disabled || undefined}
          tabIndex={c.disabled ? -1 : undefined}
          onPointerEnter={onSfxMove}
          onClick={(e) => {
            e.preventDefault();
            if (c.disabled) return;
            onPick(c);
          }}
        >
          {c.label}
        </a>
      ))}
    </div>
  );
}

function ItemList({
  items,
  shown,
  caretAt,
}: {
  items: string[];
  shown?: string[];
  caretAt?: number;
}) {
  const rows = shown ?? items;
  return (
    <ul className="page-bullets">
      {items.map((item, i) => {
        const text = rows[i];
        if (text == null) return null;
        return (
          <li key={item}>
            {text}
            {caretAt === i ? <span className="dialog-caret" aria-hidden /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function TypedItems({ items, enabled }: { items: string[]; enabled: boolean }) {
  const joined = items.join("");
  const { n, typing, skip } = useTypewriter(joined, enabled);
  const shown: string[] = [];
  let caretAt = -1;
  let used = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (n <= used) break;
    const take = Math.min(item.length, n - used);
    shown.push(item.slice(0, take));
    if (typing && n > used && n <= used + item.length) caretAt = i;
    used += item.length;
  }

  return (
    <div
      className={`dialog-type${typing ? " is-typing" : ""}`}
      onClick={typing ? skip : undefined}
      role={typing ? "button" : undefined}
      tabIndex={typing ? 0 : undefined}
      onKeyDown={
        typing
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                skip();
              }
            }
          : undefined
      }
      aria-label={typing ? "Skip dialog" : undefined}
    >
      <div className="dialog-measure" aria-hidden>
        <ItemList items={items} />
      </div>
      <div className="dialog-live">
        <ItemList items={items} shown={shown} caretAt={caretAt} />
      </div>
    </div>
  );
}

function FactsTable({ facts }: { facts: [string, string, string?][] }) {
  return (
    <table className="cv-facts">
      <tbody>
        {facts.map(([label, value, icon]) => {
          const struck = /^~(.*)~$/.exec(value);
          const shown = struck ? struck[1] : value;
          const parts = icon ? shown.split("{icon}") : [shown];
          return (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>
                {struck ? (
                  <span className="is-struck">{shown}</span>
                ) : (
                  parts.map((part, i) => (
                    <span key={i}>
                      {part}
                      {icon && i < parts.length - 1 ? (
                        <img
                          className="cv-fact-icon"
                          src={icon}
                          alt=""
                          aria-hidden
                        />
                      ) : null}
                    </span>
                  ))
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CompareTable({
  compare,
}: {
  compare: NonNullable<MenuSection["compare"]>;
}) {
  return (
    <table className="fee-compare">
      <thead>
        <tr>
          {compare.head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {compare.rows.map(([label, ours, theirs]) => (
          <tr key={label}>
            <td>{label}</td>
            <td className="fee-ours">{ours}</td>
            <td>{theirs}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccordionTyped({ section }: { section: MenuSection }) {
  const [bodyDone, setBodyDone] = useState(!section.body);

  return (
    <>
      {section.body && (
        <TypeDialog text={section.body} onDone={() => setBodyDone(true)} />
      )}
      {section.items && section.items.length > 0 && (
        <TypedItems items={section.items} enabled={bodyDone} />
      )}
      {section.facts && section.facts.length > 0 && (
        <FactsTable facts={section.facts} />
      )}
      {section.compare && <CompareTable compare={section.compare} />}
    </>
  );
}

function Section({
  section,
  open,
  onToggle,
}: {
  section: MenuSection;
  open: boolean;
  onToggle: () => void;
}) {
  if (!section.heading) {
    return (
      <section className="page-section">
        {section.body && <Paras text={section.body} />}
        {section.facts && section.facts.length > 0 && (
          <FactsTable facts={section.facts} />
        )}
        {section.compare && <CompareTable compare={section.compare} />}
        {section.items && section.items.length > 0 && (
          <ItemList items={section.items} />
        )}
      </section>
    );
  }

  return (
    <div className={`page-accordion${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="page-accordion-title"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span
          className={`tab-title${/^v?\d/.test(section.heading) ? " is-version" : ""}`}
        >
          {section.heading}
        </span>
        <span className="tab-indicator" aria-hidden />
      </button>
      {open && (
        <div className="page-accordion-body">
          <AccordionTyped section={section} />
        </div>
      )}
    </div>
  );
}

type WishRow = { id: string; label: string; votes: number };

function WishlistRank() {
  const [rows, setRows] = useState<WishRow[] | null>(null);

  useEffect(() => {
    fetch(WISHLIST_JSON, { signal: AbortSignal.timeout(10000) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const options = Array.isArray(data?.options) ? data.options : [];
        setRows(
          [...options]
            .map((o) => ({
              id: String(o.id ?? o.label ?? ""),
              label: String(o.label ?? o.id ?? ""),
              votes: Number(o.votes) || 0,
            }))
            .filter((o) => o.id)
            .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label)),
        );
      })
      .catch(() => setRows([]));
  }, []);

  if (rows == null) return <p className="wishlist-rank">Loading…</p>;
  if (!rows.length) return <p className="wishlist-rank">No votes yet.</p>;

  return (
    <ol className="wishlist-rank">
      {rows.map((o) => (
        <li key={o.id}>
          <span>{o.label}</span>
          <span>{o.votes}</span>
        </li>
      ))}
    </ol>
  );
}

function PageBody({
  page,
  isHome,
  onPageChange,
  onDialogReady,
}: {
  page: PageContent;
  isHome: boolean;
  onPageChange: (id: string) => void;
  onDialogReady: () => void;
}) {
  const external = Boolean(page.href?.startsWith("http"));
  const sections = page.sections ?? [];
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<
    { id: number; side: "her" | "you"; text: string }[]
  >([]);
  const [choices, setChoices] = useState<CtaChoice[] | null>(null);
  const pendingRef = useRef<CtaChoice | null>(null);
  const lineId = useRef(0);

  useEffect(() => {
    setOpen({});
    setLines([]);
    setChoices(null);
    pendingRef.current = null;
    lineId.current = 0;
    if (page.description) {
      setReady(false);
      return;
    }
    setReady(true);
    onDialogReady();
    if (isHome && page.ctas) setChoices(page.ctas);
  }, [page.uri]);

  function followHref(href: string) {
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noreferrer");
      return;
    }
    onPageChange(href === "/" ? "/" : href.replace(/^\//, ""));
  }

  function finishChoice(c: CtaChoice) {
    pendingRef.current = null;
    if (c.then && c.then.length > 0) {
      setChoices(c.then);
      return;
    }
    setChoices(null);
    if (c.href) followHref(c.href);
  }

  function onLineDone(side: "her" | "you") {
    const c = pendingRef.current;
    if (!c) return;
    if (side === "you" && c.reply) {
      lineId.current += 1;
      setLines((prev) => [
        ...prev,
        { id: lineId.current, side: "her", text: c.reply! },
      ]);
      return;
    }
    finishChoice(c);
  }

  function pickChoice(c: CtaChoice) {
    playSfx("confirm");
    pendingRef.current = c;
    setChoices(null);
    if (c.say) {
      lineId.current += 1;
      setLines((prev) => [
        ...prev,
        { id: lineId.current, side: "you", text: c.say! },
      ]);
      return;
    }
    finishChoice(c);
  }

  function goHref(href: string, e?: MouseEvent) {
    if (href.startsWith("http") || href === "#") return;
    e?.preventDefault();
    const id = href === "/" ? "/" : href.replace(/^\//, "");
    onPageChange(id);
  }

  return (
    <div className={`page-body${isHome ? " page-body-home" : ""}`}>
      {page.description ? (
        <TypeDialog
          key={page.uri}
          text={page.description}
          speech
          onDone={() => {
            setReady(true);
            onDialogReady();
            if (isHome && page.ctas) setChoices(page.ctas);
          }}
        />
      ) : null}
      {ready && page.uri === "play" && <PlayDesk />}
      {ready && page.uri === "wishlist" && <WishlistRank />}
      {ready &&
        sections.map((s, i) => (
        <Section
          key={s.heading ?? s.facts?.[0]?.[0] ?? s.body?.slice(0, 24)}
          section={s}
          open={Boolean(open[i])}
          onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
        />
      ))}
      {ready &&
        isHome &&
        lines.map((line, i) =>
          i < lines.length - 1 ? (
            <SpeechBox key={line.id} text={line.text} side={line.side} />
          ) : (
            <TypeDialog
              key={line.id}
              text={line.text}
              speech
              side={line.side}
              onDone={() => onLineDone(line.side)}
            />
          ),
        )}
      {ready && isHome && choices && choices.length > 0 && (
        <CtaButtons choices={choices} onPick={pickChoice} />
      )}
      {ready && !isHome && (page.href || page.hrefLabel) && (
          <p className="page-link retro-enter">
            {page.href ? (
              <a
                href={page.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="index-link"
                onPointerEnter={onSfxMove}
                onClick={(e) => {
                  if (external) playSfx("confirm");
                  goHref(page.href!, e);
                }}
              >
                {page.hrefLabel ?? page.href}
              </a>
            ) : (
              <span>{page.hrefLabel}</span>
            )}
          </p>
      )}
    </div>
  );
}

export default function DetailPanel({
  pageId,
  onPageChange,
}: {
  pageId: string;
  onPageChange: (id: string) => void;
}) {
  const page = getPage(pageId) ?? getPage("/")!;
  const isHome = pageId === "/";
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prevH = useRef(0);
  const sizingRef = useRef(false);
  const [panelH, setPanelH] = useState<number | undefined>(undefined);
  const [sizing, setSizing] = useState(false);
  const [dialogReady, setDialogReady] = useState(false);

  useLayoutEffect(() => {
    setDialogReady(false);
  }, [pageId]);

  // Page change: animate height, then let CSS auto-size (accordions).
  useLayoutEffect(() => {
    if (page.uri === "play") {
      prevH.current = 0;
      setPanelH(undefined);
      setSizing(false);
      return;
    }

    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;

    const pageEl = shell.closest(".page");
    const heading = shell.previousElementSibling as HTMLElement | null;
    let cap = window.innerHeight * 0.55;
    if (pageEl instanceof HTMLElement) {
      const cs = getComputedStyle(pageEl);
      const pad =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      cap = Math.max(
        80,
        pageEl.clientHeight - pad - (heading?.offsetHeight ?? 52) - 12,
      );
    }
    const next = Math.min(inner.offsetHeight, cap);
    const from = prevH.current;
    if (!from || Math.abs(from - next) < 1) {
      prevH.current = next;
      setPanelH(undefined);
      setSizing(false);
      return;
    }

    sizingRef.current = true;
    setSizing(true);
    setPanelH(from);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelH(next));
    });
  }, [pageId, dialogReady, page.uri]);

  return (
    <div className={`page${isHome ? " page-home" : ""}${page.uri === "play" ? " page-play" : ""}`}>
      <div className="page-container">
        <MenuGirl />
        <div className="page-stack">
          <div className="panel-heading">
            <div className="tab-titles page-header-titles">
              <span className="tab-title">
                {isHome ? "Polyoko" : page.title}
              </span>
              {isHome || page.uri === "play" ? (
                <span className="tab-title panel-version panel-online">
                  <svg
                    className="panel-online-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 8 8"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M2 0h4v1H2zM1 1h6v1H1zM0 2h8v4H0zM1 6h6v1H1zM2 7h4v1H2z"
                    />
                  </svg>
                  Online
                </span>
              ) : null}
            </div>
          </div>
          <div
            ref={shellRef}
            className={`main-content${sizing ? " is-sizing" : ""}`}
            style={panelH != null ? { height: panelH } : undefined}
            onTransitionEnd={(e) => {
              if (e.propertyName !== "height") return;
              prevH.current = shellRef.current?.offsetHeight ?? 0;
              sizingRef.current = false;
              setPanelH(undefined);
              setSizing(false);
            }}
          >
            <div className="main-content-inner" ref={innerRef}>
              <div className="tab-content">
                <PageBody
                  key={page.uri}
                  page={page}
                  isHome={isHome}
                  onPageChange={onPageChange}
                  onDialogReady={() => setDialogReady(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
