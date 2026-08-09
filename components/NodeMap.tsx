"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { HOME_IDS, LOGO_EDGES, LOGO_SEAT, MENU_NODES, PAGES, SOFT_EDGES } from "@/lib/menu";

const NODE = 36;
const half = NODE / 2;

type MapNode = {
  id: string;
  cls: string;
  x: number;
  y: number;
  title: string;
  n?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
};

type MapLink = {
  source: string | MapNode;
  target: string | MapNode;
  cls: string;
  offset: number;
};

function nodeClass(id: string): string {
  if (id === "/") return "node home-node";
  return "node node-type-path";
}

const HUB = { x: 320, y: 360 };

const INITIAL_NODES: MapNode[] = [
  {
    id: "/",
    cls: nodeClass("/"),
    x: HUB.x,
    y: HUB.y,
    title: PAGES["/"].title,
  },
  ...MENU_NODES.map((n, i) => {
    const a = (i / MENU_NODES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: n.id,
      cls: nodeClass(n.id),
      x: HUB.x + Math.cos(a) * 160,
      y: HUB.y + Math.sin(a) * 140,
      title: n.title,
      n: n.n,
    };
  }),
];

function buildLinks(): MapLink[] {
  return [
    ...LOGO_EDGES.map(([a, b]) => ({
      source: a,
      target: b,
      cls: "link logo-link",
      offset: 0,
    })),
    ...SOFT_EDGES.map(({ a, b, offset }) => ({
      source: a,
      target: b,
      cls: "link logo-link-soft",
      offset,
    })),
  ];
}

/** Half-pixel snap — integer coords make 1px verticals paint 2 device px (look thicker than diagonals). */
function px(n: number) {
  return Math.round(n) + 0.5;
}

const EDGE = 13; // stop at hex rim so strokes don't run under the glyph

function straight(a: MapNode, b: MapNode, offset = 0) {
  let x1 = a.x + half;
  let y1 = a.y + half;
  let x2 = b.x + half;
  let y2 = b.y + half;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  if (offset) {
    x1 += -uy * offset;
    y1 += ux * offset;
    x2 += -uy * offset;
    y2 += ux * offset;
  }
  // inset from centers → node faces stay opaque over the map
  if (len > EDGE * 2) {
    x1 += ux * EDGE;
    y1 += uy * EDGE;
    x2 -= ux * EDGE;
    y2 -= uy * EDGE;
  }
  return `M${px(x1)},${px(y1)} L${px(x2)},${px(y2)}`;
}

export default function NodeMap({
  pageId,
  onPageChange,
}: {
  pageId: string;
  onPageChange: (id: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const applyRef = useRef<() => void>(() => {});
  const pageRef = useRef(pageId);
  pageRef.current = pageId;
  const onPageRef = useRef(onPageChange);
  onPageRef.current = onPageChange;

  useEffect(() => {
    const stage = stageRef.current;
    const svgEl = svgRef.current;
    if (!stage || !svgEl) return;

    const nodes: MapNode[] = INITIAL_NODES.map((n) => ({ ...n }));
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const links: MapLink[] = buildLinks()
      .map((l) => ({
        ...l,
        source: byId[l.source as string],
        target: byId[l.target as string],
      }))
      .filter((l) => l.source && l.target);

    const svg = d3.select(svgEl);
    let W = window.innerWidth;
    let H = window.innerHeight;
    let dragCount = 0;

    const linkSel = svg
      .selectAll<SVGPathElement, MapLink>("path")
      .data(
        links,
        (d) =>
          `${typeof d.source === "object" ? d.source.id : d.source}->${
            typeof d.target === "object" ? d.target.id : d.target
          }:${d.offset}`
      )
      .join("path")
      .attr("class", (d) => d.cls)
      .attr("fill", "none")
      .attr("shape-rendering", "geometricPrecision");

    svg.attr("shape-rendering", "geometricPrecision");

    const nodeSel = d3
      .select(stage)
      .selectAll<HTMLDivElement, MapNode>("div.node")
      .data(nodes, (d) => d.id)
      .join("div")
      .attr("class", (d) => d.cls)
      .attr("data-uri", (d) => d.id)
      .html(
        (d) =>
          `<div class="node-inner">${
            d.n != null ? `<span class="number">${d.n}</span>` : ""
          }</div>` +
          `<span class="node-label"><span><h2>${d.title}</h2>${
            d.id === "/" ? "<br /><h3>v0.2.1</h3>" : ""
          }</span></span>`
      );

    function mapW() {
      return W > 768 ? Math.min(W * 0.52, W - 420) : W * 0.9;
    }

    function bounds() {
      return { minX: 24, maxX: mapW() - NODE - 24, minY: 64, maxY: H - NODE - 64 };
    }

    function clampNode(n: MapNode) {
      const b = bounds();
      n.x = Math.max(b.minX, Math.min(b.maxX, n.x));
      n.y = Math.max(b.minY, Math.min(b.maxY, n.y));
      if (n.fx != null) n.fx = n.x;
      if (n.fy != null) n.fy = n.y;
    }

    // Axis: width 1 + half-px snap = one sharp pixel column (wider spills → grey fringe/"glare")
    // Diagonals: AA already blooms; keep slightly under so they don't read heavier
    function strokeWidth(s: MapNode, t: MapNode) {
      const dx = Math.abs(s.x - t.x);
      const dy = Math.abs(s.y - t.y);
      return Math.min(dx, dy) < 8 ? 1.43 : 1.25;
    }

    function paint() {
      nodeSel
        .style("left", (d) => `${Math.round(d.x)}px`)
        .style("top", (d) => `${Math.round(d.y)}px`);
      linkSel
        .attr("d", (d) => {
          const s = d.source as MapNode;
          const t = d.target as MapNode;
          if (!s || !t) return "";
          return straight(s, t, d.offset);
        })
        .attr("stroke-width", (d) => {
          const s = d.source as MapNode;
          const t = d.target as MapNode;
          return s && t ? strokeWidth(s, t) : 1.25;
        });
    }

    // short-range only — old distanceMax 300 / collide 72 shoved from across the mark
    const simulation = d3
      .forceSimulation<MapNode>([])
      .stop()
      .velocityDecay(0.7)
      .force("charge", d3.forceManyBody<MapNode>().strength(-80).distanceMax(56).distanceMin(8))
      .force("collide", d3.forceCollide<MapNode>().radius(28).strength(0.9).iterations(2))
      .on("tick", () => {
        for (const n of simulation.nodes()) clampNode(n);
        paint();
      });

    function logoSeed(active: MapNode[]) {
      const b = bounds();
      const w = b.maxX - b.minX;
      const h = b.maxY - b.minY;
      const boxW = Math.min(w * 0.9, h * 0.98);
      const boxH = Math.min(h * 0.82, boxW * 0.95);
      const ox = b.minX + (w - boxW) / 2;
      const oy = b.minY + (h - boxH) / 2;
      for (const n of active) {
        const seat = LOGO_SEAT[n.id];
        if (!seat) continue;
        n.x = ox + seat.x * boxW - half;
        n.y = oy + seat.y * boxH - half;
        n.vx = 0;
        n.vy = 0;
      }
    }

    let previousNodes = new Set<string>();
    let previousLinks = new Set<string>();
    let revealGen = 0;

    function linkKey(d: MapLink) {
      const s = d.source as MapNode;
      const t = d.target as MapNode;
      return `${s.id}->${t.id}:${d.offset}`;
    }

    function syncChrome(show: Set<string>) {
      nodeSel.classed("is-hidden", (d) => !show.has(d.id));
      linkSel.classed("is-hidden", (d) => {
        const s = d.source as MapNode;
        const t = d.target as MapNode;
        return !show.has(s.id) || !show.has(t.id);
      });
    }

    let hoverId: string | null = null;
    const MUTE_STAGGER = 280; // ms — wave from hub out / reverse in

    function armMute(
      el: Element & { _muteT?: ReturnType<typeof setTimeout> },
      cls: string,
      on: boolean,
      delay: number
    ) {
      clearTimeout(el._muteT);
      if (el.classList.contains(cls) === on) return;
      if (delay <= 0) {
        el.classList.toggle(cls, on);
        return;
      }
      el._muteT = setTimeout(() => el.classList.toggle(cls, on), delay);
    }

    /** Focus preview: page, or hover (home→satellite, satellite→hub clears mute). */
    function syncFocus() {
      const cur = pageRef.current;
      let focus: string | null;
      if (hoverId === "/") {
        focus = null; // hover hub = as if main is open
      } else if (cur === "/") {
        focus = hoverId && hoverId !== "/" ? hoverId : null;
      } else {
        focus = cur;
      }
      const focusing = focus != null;
      const keep = (id: string) => id === focus || id === "/";
      const hub = byId["/"];
      const maxD =
        Math.max(
          ...nodes.map((n) => Math.hypot(n.x - hub.x, n.y - hub.y)),
          1
        ) || 1;
      const rad = (n: MapNode) => Math.hypot(n.x - hub.x, n.y - hub.y) / maxD;

      nodeSel.each(function (d) {
        const on = focusing && !keep(d.id);
        const t = rad(d);
        const was = this.classList.contains("muted-node");
        // mute: hub → out; unmute: rim → in (opposite)
        const delay = on && !was ? t * MUTE_STAGGER : !on && was ? (1 - t) * MUTE_STAGGER : 0;
        armMute(this, "muted-node", on, delay);
      });

      linkSel.each(function (d) {
        const s = d.source as MapNode;
        const t = d.target as MapNode;
        const on = focusing && (!keep(s.id) || !keep(t.id));
        const mid = (rad(s) + rad(t)) / 2;
        const was = this.classList.contains("muted-link");
        const delay = on && !was ? mid * MUTE_STAGGER : !on && was ? (1 - mid) * MUTE_STAGGER : 0;
        armMute(this, "muted-link", on, delay);
      });
    }

    applyRef.current = syncFocus;

    // keepers stay; newcomers stagger in (+100ms each)
    function reveal(show: Set<string>) {
      const gen = ++revealGen;
      const nextNodes = new Set<string>();
      const nextLinks = new Set<string>();
      let delay = 0;

      nodeSel.each(function (d) {
        if (!show.has(d.id)) {
          this.classList.remove("newly-visible", "previously-visible");
          return;
        }
        nextNodes.add(d.id);
        if (previousNodes.has(d.id)) {
          this.classList.remove("newly-visible");
          this.classList.add("previously-visible");
        } else {
          this.classList.remove("newly-visible", "previously-visible");
          const el = this;
          setTimeout(() => {
            if (gen !== revealGen) return;
            el.classList.add("newly-visible");
          }, delay);
          delay += 100;
        }
      });

      linkSel.each(function (d) {
        const s = d.source as MapNode;
        const t = d.target as MapNode;
        if (!show.has(s.id) || !show.has(t.id)) {
          this.classList.remove("newly-visible", "previously-visible");
          return;
        }
        const k = linkKey(d);
        nextLinks.add(k);
        if (previousLinks.has(k)) {
          this.classList.remove("newly-visible");
          this.classList.add("previously-visible");
        } else {
          this.classList.remove("newly-visible", "previously-visible");
          const el = this;
          setTimeout(() => {
            if (gen !== revealGen) return;
            el.classList.add("newly-visible");
          }, delay);
          delay += 100;
        }
      });

      previousNodes = nextNodes;
      previousLinks = nextLinks;
    }

    function layout() {
      const show = new Set(HOME_IDS);
      const active = nodes.filter((n) => show.has(n.id));
      logoSeed(active);
      syncChrome(show);
      reveal(show);
      syncFocus();
      paint();
    }

    function selectPage(id: string) {
      onPageRef.current(id);
      pageRef.current = id;
      syncFocus();
    }

    nodeSel.each(function (d) {
      this.addEventListener("pointerenter", () => {
        if (this.classList.contains("is-hidden")) return;
        hoverId = d.id;
        syncFocus();
      });
      this.addEventListener("pointerleave", () => {
        if (hoverId === d.id) hoverId = null;
        syncFocus();
      });
      this.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (this.classList.contains("is-hidden")) return;
        this.setPointerCapture(e.pointerId);
        let dragged = false;
        const x0 = e.clientX;
        const y0 = e.clientY;
        d.fx = d.x;
        d.fy = d.y;

        const onMove = (ev: PointerEvent) => {
          if (!dragged) {
            if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
            dragged = true;
            dragCount++;
            if (dragCount === 1) {
              simulation.nodes(nodes.filter((n) => HOME_IDS.includes(n.id)));
              simulation.alphaTarget(0.12).restart();
            }
          }
          d.fx = d.x = ev.clientX - half;
          d.fy = d.y = ev.clientY - half;
          clampNode(d);
          paint();
        };

        const onUp = () => {
          this.releasePointerCapture(e.pointerId);
          this.removeEventListener("pointermove", onMove);
          this.removeEventListener("pointerup", onUp);
          this.removeEventListener("pointercancel", onUp);
          if (dragged) {
            dragCount = Math.max(0, dragCount - 1);
            if (dragCount === 0) simulation.alphaTarget(0).stop();
            paint();
          } else if (d.id !== pageRef.current) {
            selectPage(d.id);
          }
          d.fx = null;
          d.fy = null;
        };
        this.addEventListener("pointermove", onMove);
        this.addEventListener("pointerup", onUp);
        this.addEventListener("pointercancel", onUp);
      });
    });

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      svg.attr("width", W).attr("height", H);
      layout();
    }

    svg.attr("width", W).attr("height", H);
    layout();
    // after stagger-in, enable mute-wave transitions (keeps load stroke instant)
    const readyT = window.setTimeout(() => stage.classList.add("focus-ready"), 700);
    window.addEventListener("resize", resize);

    return () => {
      clearTimeout(readyT);
      window.removeEventListener("resize", resize);
      simulation.stop();
      nodeSel.remove();
      linkSel.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyRef.current();
  }, [pageId]);

  return (
    <section className="map-container" id="map">
      <div className="map-stage" ref={stageRef}>
        <svg className="map-lines" ref={svgRef} />
      </div>
    </section>
  );
}
