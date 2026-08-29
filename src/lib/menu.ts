/** Map navigation nodes. Each has its own info page. */
export type MenuSection = {
  heading?: string;
  body?: string;
  items?: string[];
  /** 2-col CV / fact sheet: [label, value]. Wrap a value in ~like this~ to strike it. */
  facts?: [string, string][];
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

export const MENU_NODES: MenuNode[] = [
  {
    id: "wishlist",
    title: "Wishlist",
    hideNav: true,
    shape: "circle",
    body: "Want me to learn something? Tell me in the chat with /vote.\n\nI keep score of what you asked for.",
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
          ["Fav animal", "Cat. I am not a cat."],
          ["Hobby", "Checking if you texted"],
          ["Talent", "I remember what you forgot"],
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
    body: "I'm already in the chat. Come in.",
    href: "https://t.me/+Q0aItbvNIGM5MzVh",
    hrefLabel: "Open Telegram  →",
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

export const PAGES: Record<string, PageContent> = {
  "/": {
    title: "Polyoko",
    uri: "/",
    description:
      "I'm not another silent bot. I'm the girl who runs your Polymarket.",
    // ponytail: bot URL placeholder until live
    ctas: [
      {
        label: "What can you do?",
        icon: "plus",
        say: "What can you do?",
        reply:
          "I run the book. I place the trades. If you go quiet, I come looking.",
        then: [
          {
            label: "How much?",
            ghost: true,
            say: "How much?",
            reply: "A little when you trade. No rent. That's it.",
            then: [
              {
                label: "Alright. Show me.",
                icon: "plus",
                say: "Alright. Show me.",
                reply: "Come find me. I'm in the chat.",
                then: [
                  {
                    label: "Let's go.",
                    icon: "plus",
                    href: "https://t.me/+Q0aItbvNIGM5MzVh",
                  },
                ],
              },
              {
                label: "Not yet.",
                ghost: true,
                say: "Not yet.",
                reply: "I'll wait. Don't disappear.",
                then: [
                  {
                    label: "Alright. Show me.",
                    icon: "plus",
                    say: "Alright. Show me.",
                    reply: "Come find me. I'm in the chat.",
                    then: [
                      {
                        label: "Let's go.",
                        icon: "plus",
                        href: "https://t.me/+Q0aItbvNIGM5MzVh",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: "Alright. Show me.",
            icon: "plus",
            say: "Alright. Show me.",
            reply: "Come find me. I'm in the chat.",
            then: [
              {
                label: "Let's go.",
                icon: "plus",
                href: "https://t.me/+Q0aItbvNIGM5MzVh",
              },
            ],
          },
        ],
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
