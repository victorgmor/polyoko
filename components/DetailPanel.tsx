"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getPage,
  HOME_MEDIA,
  MENU_NODES,
  type MenuSection,
  type PageContent,
} from "@/lib/menu";

const MENU_N = Object.fromEntries(MENU_NODES.map((n) => [n.id, n.n]));

function Paras({ text }: { text: string }) {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((block, i) => <p key={i}>{block}</p>);
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
  const body = (
    <>
      {section.body && <Paras text={section.body} />}
      {section.compare && (
        <table className="fee-compare">
          <thead>
            <tr>
              {section.compare.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.compare.rows.map(([label, ours, theirs]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="fee-ours">{ours}</td>
                <td>{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {section.items && section.items.length > 0 && (
        <ul className="page-bullets">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </>
  );

  if (!section.heading) {
    return <section className="page-section">{body}</section>;
  }

  return (
    <div className={`page-accordion${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="page-accordion-title"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="tab-title">{section.heading}</span>
        <span className="tab-indicator" aria-hidden />
      </button>
      <div className="page-accordion-panel">
        <div className="page-accordion-body">{body}</div>
      </div>
    </div>
  );
}

function PageBody({ page, isHome }: { page: PageContent; isHome: boolean }) {
  const external = Boolean(page.href?.startsWith("http"));
  const sections = page.sections ?? [];
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setOpen({});
  }, [page.uri]);

  return (
    <div className={`page-body${isHome ? " page-body-home" : ""}`}>
      {page.summary && !isHome && <p className="page-lead">{page.summary}</p>}
      <Paras text={page.description} />
      {sections.map((s, i) => (
        <Section
          key={s.heading ?? s.body?.slice(0, 24)}
          section={s}
          open={Boolean(open[i])}
          onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
        />
      ))}
      {page.href &&
        (isHome ? (
          <a href={page.href} className="launch-btn">
            {page.hrefLabel ?? "Launch bot"}
          </a>
        ) : (
          <p className="page-link">
            <a
              href={page.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="index-link"
            >
              {page.hrefLabel ?? page.href}
            </a>
          </p>
        ))}
    </div>
  );
}

function HomeMedia({ show }: { show: boolean }) {
  return (
    <div className="page-media" aria-hidden>
      {HOME_MEDIA.map((m, i) => (
        <div
          key={m.src}
          className={[
            "media-item",
            `media-index-${i + 1}`,
            m.landscape ? "media-landscape" : "",
            show ? "show-media-item" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <img src={m.src} alt="" />
        </div>
      ))}
    </div>
  );
}

export default function DetailPanel({ pageId }: { pageId: string }) {
  const page = getPage(pageId) ?? getPage("/")!;
  const isHome = pageId === "/";
  const [mediaIn, setMediaIn] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prevH = useRef(0);
  const sizingRef = useRef(false);
  const [panelH, setPanelH] = useState<number | undefined>(undefined);
  const [sizing, setSizing] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setMediaIn(false);
      return;
    }
    const t = window.setTimeout(() => setMediaIn(true), 80);
    return () => clearTimeout(t);
  }, [isHome]);

  // Page change: animate height. Accordion/content resize: track up to 70vh (same max as CSS).
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;

    const cap = () =>
      Math.min(inner.offsetHeight, window.innerHeight * 0.7);

    const next = cap();
    const from = sizingRef.current ? shell.offsetHeight : prevH.current;
    if (!from || Math.abs(from - next) < 1) {
      prevH.current = next;
      sizingRef.current = false;
      setPanelH(next);
      setSizing(false);
    } else {
      sizingRef.current = true;
      setSizing(true);
      setPanelH(from);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPanelH(next));
      });
    }

    const ro = new ResizeObserver(() => {
      if (sizingRef.current) return;
      const h = cap();
      if (Math.abs(h - prevH.current) < 1) return;
      prevH.current = h;
      setPanelH(h);
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, [pageId]);

  return (
    <div className={`page${isHome ? " page-home" : ""}`}>
      <div className="page-container">
        {isHome && <HomeMedia show={mediaIn} />}
        <div
          ref={shellRef}
          className={`main-content${sizing ? " is-sizing" : ""}`}
          style={panelH != null ? { height: panelH } : undefined}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "height") return;
            const h = shellRef.current?.offsetHeight ?? 0;
            prevH.current = h;
            sizingRef.current = false;
            setPanelH(h);
            setSizing(false);
          }}
        >
          <div className="main-content-inner" ref={innerRef}>
            <div className="tab-titles page-header-titles">
              {isHome ? (
                <span className="tab-icon icon-home" />
              ) : (
                <span className="tab-icon icon-path" aria-hidden>
                  <img src="/img/node-path.svg" alt="" width={20} height={18} />
                  <span className="tab-number">{MENU_N[pageId]}</span>
                </span>
              )}
              <span className="tab-title">
                {isHome ? "POLYNEX" : page.title.toUpperCase()}
              </span>
              <span className="tab-indicator" />
            </div>
            <div className="tab-content">
              <PageBody page={page} isHome={isHome} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
