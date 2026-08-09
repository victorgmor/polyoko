"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NodeMap from "./NodeMap";
import DetailPanel from "./DetailPanel";
import { getPage } from "@/lib/menu";

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
      <div className="topbar">
        <p>
          Only open Polynex from this
          site. Never paste a private key into chat.
        </p>
      </div>
      <NodeMap pageId={pageId} onPageChange={go} />
      <DetailPanel pageId={pageId} onPageChange={go} />
    </>
  );
}
