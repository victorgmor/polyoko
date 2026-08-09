/** Map navigation nodes (besides Polynex hub). Each has its own info page. */
export type MenuSection = {
  heading?: string;
  body?: string;
  items?: string[];
  /** 3-col comparison: [label, ours, theirs] */
  compare?: { head: [string, string, string]; rows: [string, string, string][] };
};

export type MenuNode = {
  id: string;
  title: string;
  n: number;
  summary?: string;
  body: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
};

export type PageContent = {
  title: string;
  uri: string;
  summary: string;
  description: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
  ctas?: {
    href: string;
    label: string;
    icon?: "telegram" | "file";
    ghost?: boolean;
  }[];
};

export const MENU_NODES: MenuNode[] = [
  {
    id: "changelog",
    title: "Changelog",
    n: 1,
    summary: "What's new",
    body: "Release notes and product updates for Polynex.",
    sections: [
      {
        heading: "v0.2.1",
        body: "August 2026 — initial public site.",
        items: [
          "Map navigation with hub and satellite pages.",
          "Docs — overview, fees, community, and terms.",
          "Changelog, Telegram, and X nodes.",
        ],
      },
      {
        heading: "Coming next",
        body: "Planned work — not shipped yet.",
        items: [
          "Live bot link from the home panel.",
          "Telegram and X destinations.",
        ],
      },
    ],
  },
  {
    id: "docs",
    title: "Docs",
    n: 2,
    summary: "How Polynex works",
    body: "Your Polymarket trading bot — built to execute, track, and manage positions with less friction.",
    sections: [
      {
        heading: "Introduction",
        body: "Polynex is a trading bot for Polymarket prediction markets. It is built for people who want a fast path from idea to order — browse markets, size positions, and manage risk without living inside a heavyweight web UI.\n\nPolymarket is powerful, but the day-to-day flow can be slow. Polynex sits on top of that stack and turns common actions into a tight loop: find a market, place a trade, watch the book, adjust.\n\nWhether you are new to prediction markets or already trading volume on Polygon, Polynex is meant to make Polymarket feel immediate.",
      },
      {
        heading: "Overview",
        body: "Polynex focuses on binary YES/NO markets across politics, sports, crypto, and current events. Trades settle on-chain on Polygon for transparency; the bot handles the interaction layer so you spend time on markets, not plumbing.\n\nCore loop: discover markets, open and close positions, place limit orders where supported, and keep a clear view of exposure and PnL. Automation-minded users can lean on bot-driven workflows; discretionary traders can stay fully hands-on.",
      },
      {
        heading: "Highlights",
        items: [
          "Fast market access — jump from a Polymarket link or search into a tradeable view.",
          "Position management — see open exposure, average entry, and exit options in one place.",
          "Limit-style control — set levels instead of only hitting the market when timing matters.",
          "Wallet-aware flow — deposits, withdrawals, and on-chain settlement stay tied to your Polygon wallet.",
          "Alerts — get notified on fills, big moves, and markets you care about.",
          "Bot workflows — run repeatable strategies around entries, size, and exits without babysitting every tick.",
        ],
      },
      {
        heading: "Fees",
        body: "Transparent pricing versus trading through the Polymarket interface.",
        compare: {
          head: ["Cost", "Polynex", "Polymarket Interface"],
          rows: [
            ["Fee per trade", "0.5%", "2%"],
            ["Gas fees", "$0 (covered)", "Variable"],
            ["Deposit fee", "$0", "$0"],
            ["Withdrawal fee", "$0", "$0"],
            ["Monthly subscription", "None", "None"],
            ["Bot / automation", "Included", "Not available"],
          ],
        },
      },
      {
        heading: "Community",
        body: "Updates and support live on Telegram and X. Use those channels for product notes, market talk, and status — the map nodes link out when you want the live rooms.",
      },
      {
        heading: "Terms of Use",
        body: "By using Polynex you verify and agree that:",
        items: [
          "You are at least 18 years of age.",
          "You are not located in or trading from a restricted location where prediction market trading is prohibited.",
          "You have read and agree to Polymarket’s Terms of Service.",
          "You are solely responsible for ensuring compliance with all applicable laws and regulations in your jurisdiction.",
          "Prediction markets involve risk of loss. Nothing here is financial advice.",
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    n: 3,
    summary: "Telegram",
    body: "Join the Polynex community on Telegram.",
    href: "https://t.me/",
    hrefLabel: "Open Telegram",
  },
  {
    id: "x",
    title: "X",
    n: 4,
    summary: "Updates",
    body: "Follow Polynex for announcements and updates.",
    href: "https://x.com/",
    hrefLabel: "Open X",
  },
];

/** Backdrop images behind the home panel (Trousdale-style corners). */
export const HOME_MEDIA: { src: string; landscape?: boolean }[] = [
  { src: "/img/home/1.png", landscape: true },
  { src: "/img/home/2.png", landscape: true },
  { src: "/img/home/3.png", landscape: true },
  { src: "/img/home/4.png", landscape: true },
];

export const PAGES: Record<string, PageContent> = {
  "/": {
    title: "Polynex",
    uri: "/",
    summary: "",
    description:
      "Polynex is a trading bot for Polymarket — automate entries, size positions, and manage risk without living in a heavyweight UI.",
    // ponytail: bot URL placeholder until live
    ctas: [
      { href: "#", label: "Launch bot", icon: "telegram" },
      { href: "/docs", label: "Docs", icon: "file", ghost: true },
    ],
  },
  ...Object.fromEntries(
    MENU_NODES.map((n) => [
      n.id,
      {
        title: n.title,
        uri: n.id,
        summary: n.summary ?? "",
        description: n.body,
        sections: n.sections,
        href: n.href,
        hrefLabel: n.hrefLabel,
      } satisfies PageContent,
    ])
  ),
};

export function getPage(id: string | null): PageContent | null {
  if (!id) return null;
  return PAGES[id] ?? null;
}

/** Polymarket-logo seats (x,y in 0..1). MR = Polynex tip. */
export const LOGO_SEAT: Record<string, { x: number; y: number }> = {
  "/": { x: 0.78, y: 0.5 },
  changelog: { x: 0.22, y: 0.28 },
  docs: { x: 0.78, y: 0.08 },
  community: { x: 0.22, y: 0.72 },
  x: { x: 0.78, y: 0.92 },
};

/** Polymarket mark edges. */
export const LOGO_EDGES: [string, string][] = [
  ["changelog", "docs"],
  ["docs", "/"],
  ["/", "x"],
  ["x", "community"],
  ["community", "changelog"],
  ["changelog", "/"],
  ["community", "/"],
];

/** Extra chords — low opacity diagonals (not logo edges). */
export const SOFT_EDGES: { a: string; b: string; offset: number }[] = [
  { a: "changelog", b: "x", offset: 0 },
  { a: "docs", b: "community", offset: 0 },
];

export const HOME_IDS = Object.keys(LOGO_SEAT);
