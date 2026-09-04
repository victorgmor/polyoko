export type PlayTab = "desk" | "book" | "bag";

export type PlaySide = "YES" | "NO";

export type PlayPosition = {
  id: string;
  market: string;
  side: PlaySide;
  shares: number;
  avg: number;
};

export type PlayState = {
  credits: number;
  mood: number;
  hunger: number;
  lastSeen: number;
  lastTrade: number;
  positions: PlayPosition[];
};

export type PlayMarket = {
  id: string;
  title: string;
  yes: number;
  no: number;
};

export const PLAY_MARKETS: PlayMarket[] = [
  { id: "fed", title: "Fed cut in October", yes: 64, no: 36 },
  { id: "btc", title: "BTC above 100k this year", yes: 41, no: 59 },
  { id: "rain", title: "Rain in NYC tomorrow", yes: 28, no: 72 },
];

export const PLAY_KEY = "polyoko-play-v1";
export const PLAY_EVENT = "polyoko-play";
export const SHARE_SIZE = 5;

const EMPTY: PlayState = {
  credits: 99,
  mood: 3,
  hunger: 2,
  lastSeen: 0,
  lastTrade: 0,
  positions: [],
};

function clamp(n: number, lo = 0, hi = 5) {
  return Math.max(lo, Math.min(hi, n));
}

export function loadPlay(): PlayState {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(PLAY_KEY);
    if (!raw) return { ...EMPTY, lastSeen: Date.now() };
    const parsed = JSON.parse(raw) as Partial<PlayState>;
    return decay({
      credits: Number(parsed.credits) || 0,
      mood: clamp(Number(parsed.mood) || 0),
      hunger: clamp(Number(parsed.hunger) || 0),
      lastSeen: Number(parsed.lastSeen) || 0,
      lastTrade: Number(parsed.lastTrade) || 0,
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
    });
  } catch {
    return { ...EMPTY, lastSeen: Date.now() };
  }
}

export function savePlay(state: PlayState) {
  try {
    localStorage.setItem(PLAY_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PLAY_EVENT));
  }
}

export function isLowEnergy(state: PlayState) {
  return state.mood <= 1 || state.hunger >= 4;
}

export function decay(state: PlayState): PlayState {
  const now = Date.now();
  const hours = state.lastSeen ? (now - state.lastSeen) / 3_600_000 : 0;
  const steps = Math.min(5, Math.floor(hours / 3));
  if (!steps) return state;
  return {
    ...state,
    mood: clamp(state.mood - steps),
    hunger: clamp(state.hunger + steps),
  };
}

export function tradeCost(price: number, shares = SHARE_SIZE) {
  return Math.max(1, Math.round((shares * price) / 100));
}

export function deskLine(state: PlayState): string {
  if (!state.lastSeen) return "You're here. I already made space on the desk.";
  if (state.mood <= 1) return "You left me alone with the book. I hated that.";
  if (state.hunger >= 4) return "I haven't placed anything. Don't make me sit pretty.";
  if (state.mood >= 5) return "There you are. I was waiting with the pencils lined up.";
  return "I keep the book. You come back. That's the deal.";
}

export function checkIn(state: PlayState): { state: PlayState; line: string } {
  const next: PlayState = {
    ...state,
    mood: clamp(state.mood + 2),
    hunger: clamp(state.hunger - 1),
    lastSeen: Date.now(),
  };
  return { state: next, line: "Good. I like when you show up. Stay a minute." };
}

export function stepOut(state: PlayState): { state: PlayState; line: string } {
  const next: PlayState = {
    ...state,
    mood: clamp(state.mood - 3),
    hunger: clamp(state.hunger + 3),
  };
  return {
    state: next,
    line: isLowEnergy(next)
      ? "Fine. I'll put my head down."
      : "You're going? I was just getting started.",
  };
}

export function placeTrade(
  state: PlayState,
  market: PlayMarket,
  side: PlaySide,
): { state: PlayState; line: string } {
  const price = side === "YES" ? market.yes : market.no;
  const cost = tradeCost(price);
  if (state.credits < cost) {
    return { state, line: "You're short. I can't print money." };
  }
  const existing = state.positions.find(
    (p) => p.id === market.id && p.side === side,
  );
  const positions = existing
    ? state.positions.map((p) =>
        p === existing
          ? {
              ...p,
              shares: p.shares + SHARE_SIZE,
              avg: Math.round(
                (p.avg * p.shares + price * SHARE_SIZE) /
                  (p.shares + SHARE_SIZE),
              ),
            }
          : p,
      )
    : [
        ...state.positions,
        {
          id: market.id,
          market: market.title,
          side,
          shares: SHARE_SIZE,
          avg: price,
        },
      ];
  const next: PlayState = {
    ...state,
    credits: state.credits - cost,
    mood: clamp(state.mood + 1),
    hunger: clamp(state.hunger - 2),
    lastSeen: Date.now(),
    lastTrade: Date.now(),
    positions,
  };
  return {
    state: next,
    line:
      side === "YES"
        ? "I put you on YES. Don't ghost me now."
        : "NO it is. I'll watch it. You come back.",
  };
}
