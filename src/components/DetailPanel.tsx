import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  getPage,
  HOME_MEDIA,
  WISHLIST_JSON,
  type MenuSection,
  type PageContent,
} from "@/lib/menu";
import { hubSvg, pageSvg } from "@/lib/shapes";

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
        <span
          className={`tab-title${/^v?\d/.test(section.heading) ? " is-version" : ""}`}
        >
          {section.heading}
        </span>
        <span className="tab-indicator" aria-hidden />
      </button>
      <div className="page-accordion-panel">
        <div className="page-accordion-clip">
          <div className="page-accordion-body">{body}</div>
        </div>
      </div>
    </div>
  );
}

type WishRow = { id: string; label: string; votes: number };

function WishlistRank() {
  const [rows, setRows] = useState<WishRow[] | null>(null);

  useEffect(() => {
    fetch(WISHLIST_JSON)
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

  if (rows == null) return <p>Loading…</p>;
  if (!rows.length) return <p>No votes yet.</p>;

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
}: {
  page: PageContent;
  isHome: boolean;
  onPageChange: (id: string) => void;
}) {
  const external = Boolean(page.href?.startsWith("http"));
  const sections = page.sections ?? [];
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setOpen({});
  }, [page.uri]);

  function goHref(href: string, e?: MouseEvent) {
    if (href.startsWith("http") || href === "#") return;
    e?.preventDefault();
    const id = href === "/" ? "/" : href.replace(/^\//, "");
    onPageChange(id);
  }

  return (
    <div className={`page-body${isHome ? " page-body-home" : ""}`}>
      <Paras text={page.description} />
      {page.uri === "wishlist" && <WishlistRank />}
      {sections.map((s, i) => (
        <Section
          key={s.heading ?? s.body?.slice(0, 24)}
          section={s}
          open={Boolean(open[i])}
          onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
        />
      ))}
      {isHome && page.ctas && page.ctas.length > 0 ? (
        <div className="launch-btns">
          {page.ctas.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className={`launch-btn${c.ghost ? " is-ghost" : ""}`}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noreferrer" : undefined}
              onClick={(e) => goHref(c.href, e)}
            >
              {c.icon === "telegram" && (
                <svg
                  className="launch-btn-icon"
                  viewBox="16 64 106 90"
                  aria-hidden
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M76.33 132.14L62.5 143.73L58.59 144.26L49.84 114.11L19.06 104L113.82 67.8799L118.29 67.9799L103.36 149.19L76.33 132.14ZM100.03 83.1399L56.61 109.17L61.61 130.5L62.98 130.19L68.2 113.73L102.9 83.4799L100.03 83.1399Z"
                  />
                </svg>
              )}
              {c.icon === "file" && (
                <svg
                  className="launch-btn-icon"
                  viewBox="3.5 2.5 9 11"
                  aria-hidden
                >
                  <path fill="currentColor" d="M4,3V13h8V7H8V3ZM9,3V6h3Z" />
                </svg>
              )}
              {c.label}
            </a>
          ))}
        </div>
      ) : (
        (page.href || page.hrefLabel) && (
          <p className="page-link">
            {page.href ? (
              <a
                href={page.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="index-link"
                onClick={(e) => goHref(page.href!, e)}
              >
                {page.hrefLabel ?? page.href}
              </a>
            ) : (
              <span>{page.hrefLabel}</span>
            )}
          </p>
        )
      )}
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

export default function DetailPanel({
  pageId,
  onPageChange,
}: {
  pageId: string;
  onPageChange: (id: string) => void;
}) {
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

  // Page change: animate height, then let CSS auto-size (accordions).
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;

    const next = Math.min(inner.offsetHeight, window.innerHeight * 0.7);
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
  }, [pageId]);

  return (
    <div className={`page${isHome ? " page-home" : ""}`}>
      <div className="page-container">
        {isHome && <HomeMedia show={mediaIn} />}
        <div className="page-stack">
          <div className="panel-heading">
            <div className="tab-titles page-header-titles">
              {isHome ? (
                <span
                  className="tab-icon icon-home"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: hubSvg() }}
                />
              ) : (
                <span
                  className="tab-icon icon-page"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: pageSvg() }}
                />
              )}
              <span className="tab-title">
                {isHome ? "Plusmarket" : page.title}
              </span>
              {isHome ? (
                <span className="tab-title panel-version">v0.2.1</span>
              ) : (
                <button
                  type="button"
                  className="panel-back"
                  aria-label="Back to home"
                  onClick={() => onPageChange("/")}
                />
              )}
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
                  page={page}
                  isHome={isHome}
                  onPageChange={onPageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
