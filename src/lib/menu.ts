/** Map navigation nodes. Each has its own info page. */
export type MenuSection = {
  heading?: string;
  body?: string;
  items?: string[];
  /** 2-col CV / fact sheet: [label, value]. Wrap a value in ~like this~ to strike it. */
  facts?: [string, string, string?][];
  /** 3-col comparison: [label, ours, theirs] */
  compare?: { head: [string, string, string]; rows: [string, string, string][] };
};

export type NodeShape = "triangle" | "square" | "circle" | "hex";

export type MenuNode = {
  id: string;
  title: string;
  /** Nav label; falls back to title. */
  navTitle?: string;
  shape: NodeShape;
  body: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
  hideNav?: boolean;
};

export type CtaChoice = {
  href?: string;
  label: string;
  icon?: "telegram" | "file" | "plus" | "coin";
  ghost?: boolean;
  disabled?: boolean;
  say?: string;
  reply?: string;
  then?: CtaChoice[];
};

export type PageContent = {
  title: string;
  uri: string;
  description: string;
  sections?: MenuSection[];
  href?: string;
  hrefLabel?: string;
  ctas?: CtaChoice[];
};

const WAITLIST_HREF = "https://t.me/+Q0aItbvNIGM5MzVh";

export const MENU_NODES: MenuNode[] = [
  {
    id: "wishlist",
    title: "Wishlist",
    hideNav: true,
    shape: "circle",
    body: "Want me to learn something? Tell me in the chat with /vote.\n\nI keep score of what you asked for.",
  },
  {
    id: "play",
    title: "Desk",
    navTitle: "Play",
    hideNav: true,
    shape: "circle",
    body: "",
  },
  {
    id: "docs",
    title: "About me",
    navTitle: "About me",
    shape: "circle",
    body: "",
    sections: [
      {
        facts: [
          ["Name", "Polyoko"],
          ["Age", "~Classified~"],
          ["Birthday", "June 11"],
          ["Zodiac", "Gemini"],
          ["Blood type", "AB. I think."],
          ["Height", "158 cm"],
          ["Fav color", "Pink. The loud one."],
          ["Fav food", "Dango"],
          ["Fav animal", "Cat{icon}", "/img/cat-face.png"],
          ["Hobby", "Checking if you texted"],
          ["Talent", "Reading the book"],
          ["Weakness", "When you don't come back"],
          ["Crush", "~Classified~"],
          ["Best friend", "My coin pile"],
          ["Dream job", "Your secretary"],
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Talk",
    navTitle: "Trade",
    hideNav: true,
    shape: "circle",
    body: "I'm not taking visitors yet. Leave your name. I'll open the door.",
    href: WAITLIST_HREF,
    hrefLabel: "Join the waitlist  →",
  },
  {
    id: "x",
    title: "X",
    shape: "circle",
    body: "I post when I have something to say.",
    href: "https://x.com/PlusmarketTrade",
    hrefLabel: "Open X",
  },
];

const PUT_ME_ON_THE_LIST: CtaChoice = {
  label: "Put me on the list.",
  icon: "plus",
  href: WAITLIST_HREF,
};

export const PAGES: Record<string, PageContent> = {
  "/": {
    title: "Polyoko",
    uri: "/",
    description:
      "I'm not another silent bot. I'm the girl who runs your Polymarket.",
    ctas: [
      {
        label: "What can you do?",
        icon: "plus",
        say: "What can you do?",
        reply:
          "I'll run the book. I'll place the trades. Not today. I'm still getting my desk how I like it.",
        then: [PUT_ME_ON_THE_LIST],
      },
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
