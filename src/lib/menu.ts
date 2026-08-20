/** Map navigation nodes. Each has its own info page. */
export type MenuSection = {
  heading?: string;
  body?: string;
  items?: string[];
  /** 3-col comparison: [label, ours, theirs] */
  compare?: { head: [string, string, string]; rows: [string, string, string][] };
};

export type NodeShape = "triangle" | "square" | "circle" | "hex";

export type MenuNode = {
  id: string;
  title: string;
  shape: NodeShape;
  body: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
};

export type PageContent = {
  title: string;
  uri: string;
  description: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
  ctas?: {
    href: string;
    label: string;
    icon?: "telegram" | "file";
    ghost?: boolean;
    disabled?: boolean;
  }[];
};

export const MENU_NODES: MenuNode[] = [
  {
    id: "changelog",
    title: "Changelog",
    shape: "circle",
    body: "Release notes and product updates for Plusmarket.",
    sections: [
      {
        heading: "v0.8.0-beta",
        items: [
          "Confirm fills at the live book (real fill size only)",
          "Live ask/bid prices, not stale quotes",
          "Home: open / free / orders / net worth",
          "Display currency",
          "Up/Down labels on up-or-down markets",
          "Team names on sports sides",
          "Trade cards after a fill",
          "Copy or counter a shared trade",
          "Inline search and deep links",
          "Polymarket profile from home",
          "Roadmap wishlist (/vote)",
        ],
      },
      {
        heading: "v0.7.0-alpha",
        items: [
          "Auto-wrap USDC → pUSD (/wrap)",
          "Withdraw as USDC or POL",
          "Limit buy/sell with optional expiry",
          "Open orders: edit or cancel",
          "Buy more, sell %, sell all",
          "Redeem resolved markets (auto-redeem on)",
          "Browse categories",
          "Settings + wallet reset",
          "Typo-tolerant commands",
        ],
      },
      {
        heading: "v0.6.0-alpha",
        items: [
          "Encrypted wallet create / import / export",
          "Deposit USDC on Polygon",
          "Market buy and sell",
          "Open positions",
          "Type a market name or paste a Polymarket URL",
          "Private-chat only",
        ],
      },
    ],
  },
  {
    id: "wishlist",
    title: "Wishlist",
    shape: "circle",
    body: "Vote through our Telegram bot with /vote.\n\nRanked here by votes.",
  },
  {
    id: "docs",
    title: "Docs",
    shape: "circle",
    body: "Your Polymarket trading bot — built to execute, track, and manage positions with less friction.",
    sections: [
      {
        heading: "Introduction",
        body: "Plusmarket is a trading bot for Polymarket prediction markets. It is built for people who want a fast path from idea to order — browse markets, size positions, and manage risk without living inside a heavyweight web UI.\n\nPolymarket is powerful, but the day-to-day flow can be slow. Plusmarket sits on top of that stack and turns common actions into a tight loop: find a market, place a trade, watch the book, adjust.\n\nWhether you are new to prediction markets or already trading volume on Polygon, Plusmarket is meant to make Polymarket feel immediate.",
      },
      {
        heading: "Overview",
        body: "Plusmarket focuses on binary YES/NO markets across politics, sports, crypto, and current events. Trades settle on-chain on Polygon for transparency; the bot handles the interaction layer so you spend time on markets, not plumbing.\n\nCore loop: discover markets, open and close positions, place limit orders where supported, and keep a clear view of exposure and PnL. Automation-minded users can lean on bot-driven workflows; discretionary traders can stay fully hands-on.",
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
          head: ["Cost", "Plusmarket", "Polymarket Interface"],
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
        body: "By using Plusmarket you verify and agree that:",
        items: [
          "You are at least 18 years of age.",
          "You are not located in or trading from a restricted location where prediction market trading is prohibited.",
          "You have read and agree to Polymarket’s Terms of Service.",
          "You are solely responsible for ensuring compliance with all applicable laws and regulations in your jurisdiction.",
          "Prediction markets involve risk of loss. Nothing here is financial advice.",
        ],
      },
      {
        heading: "Privacy Policy",
        body: "Plusmarket collects only what it needs to run the site and Telegram bot.",
        items: [
          "The website does not require an account. We do not sell personal data.",
          "Votes are cast in Telegram. We store your Telegram user id against each option so you can vote once. Rankings on the site show counts only — not your name or user id.",
          "If you write to us on Telegram or X, we see whatever that platform already shows.",
          "Hosting and analytics providers may process standard request logs (IP, browser, pages) to keep the service up.",
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    shape: "circle",
    body: "Get updates, market talk, and bot status.",
    href: "https://t.me/+Q0aItbvNIGM5MzVh",
    hrefLabel: "Join on Telegram  →",
  },
  {
    id: "x",
    title: "X",
    shape: "circle",
    body: "Follow Plusmarket for announcements and updates.",
    href: "https://x.com/PlusmarketTrade",
    hrefLabel: "Open X",
  },
];

export const PAGES: Record<string, PageContent> = {
  "/": {
    title: "Plusmarket",
    uri: "/",
    description:
      "The easiest way to trade on Polymarket — automate entries, size positions, and manage risk without living in a heavyweight UI.",
    // ponytail: bot URL placeholder until live
    ctas: [
      { href: "https://t.me/+Q0aItbvNIGM5MzVh", label: "＋ Join the waitlist" },
      { href: "/changelog", label: "Changelog", ghost: true },
    ],
  },
  ...Object.fromEntries(
    MENU_NODES.map((n) => [
      n.id,
      {
        title: n.title,
        uri: n.id,
        description: n.body,
        sections: n.sections,
        href: n.href,
        hrefLabel: n.hrefLabel,
      } satisfies PageContent,
    ])
  ),
};

export const WISHLIST_JSON = "/wishlist.json";

export function getPage(id: string | null): PageContent | null {
  if (!id) return null;
  return PAGES[id] ?? null;
}
