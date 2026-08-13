"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DetailPanel from "./DetailPanel";
import { getPage, MENU_NODES } from "@/lib/menu";
import { hubSvg } from "@/lib/shapes";

function pathToPageId(pathname: string): string {
  const id = pathname === "/" ? "/" : pathname.replace(/^\//, "");
  return getPage(id) ? id : "/";
}

function pageIdToPath(id: string): string {
  return id === "/" ? "/" : `/${id}`;
}

export default function AppShell() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const pageId = pathToPageId(pathname);

  useEffect(() => {
    const id = pathname === "/" ? "/" : pathname.replace(/^\//, "");
    if (!getPage(id) && pathname !== "/") router.replace("/");
  }, [pathname, router]);

  function go(id: string) {
    const next = pageIdToPath(getPage(id) ? id : "/");
    if (next !== pathname) router.push(next, { scroll: false });
  }

  return (
    <>
      <header className="site-header">
        <nav className="site-nav">
          <button
            type="button"
            className={pageId === "/" ? "is-active" : undefined}
            onClick={() => go("/")}
          >
            Home
          </button>
          {MENU_NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              className={pageId === n.id ? "is-active" : undefined}
              onClick={() => go(n.id)}
            >
              {n.title}
            </button>
          ))}
        </nav>
      </header>
      <div className="bg-mark" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: hubSvg() }} />
        ))}
      </div>
      <div className="topbar">
        <a
          className="powered-by"
          href="https://polymarket.com"
          target="_blank"
          rel="noreferrer"
        >
          Powered by
          <svg viewBox="0 0 24 38" aria-hidden>
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M24.0629 33.5654V4.43457L23.8087 4.5062L0.7366 11.0045L0.59082 11.0455V26.9545L0.736636 26.9955L24.0629 33.5654ZM21.4298 16.9078L5.41453 12.3971L21.4298 7.88593V16.9078ZM3.22391 23.5101V14.4899L19.2356 19.0001L3.22391 23.5101ZM21.4298 30.1141L5.41457 25.603L21.4298 21.0923V30.1141Z"
            />
          </svg>
          Polymarket
        </a>
      </div>
      <DetailPanel pageId={pageId} onPageChange={go} />
    </>
  );
}
