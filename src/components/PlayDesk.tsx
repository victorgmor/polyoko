import { useEffect, useState } from "react";
import {
  PLAY_MARKETS,
  SHARE_SIZE,
  checkIn,
  deskLine,
  loadPlay,
  placeTrade,
  savePlay,
  tradeCost,
  type PlayMarket,
  type PlaySide,
  type PlayState,
  type PlayTab,
} from "@/lib/play";
import { onSfxMove, playSfx } from "@/lib/sfx";

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="play-meter">
      <span>{label}</span>
      <span className="play-meter-bar" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={i < value ? "is-on" : undefined} />
        ))}
      </span>
    </div>
  );
}

function Btn({
  children,
  ghost,
  disabled,
  onClick,
}: {
  children: string;
  ghost?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`launch-btn${ghost ? " is-ghost" : ""}${disabled ? " is-disabled" : ""}`}
      disabled={disabled}
      onPointerEnter={onSfxMove}
      onClick={() => {
        if (disabled) return;
        playSfx("confirm");
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export default function PlayDesk() {
  const [tab, setTab] = useState<PlayTab>("desk");
  const [state, setState] = useState<PlayState | null>(null);
  const [line, setLine] = useState("");

  useEffect(() => {
    const next = loadPlay();
    setState(next);
    setLine(deskLine(next));
    savePlay(next);
  }, []);

  function commit(next: PlayState, say: string) {
    setState(next);
    setLine(say);
    savePlay(next);
  }

  function onCheckIn() {
    if (!state) return;
    const { state: next, line: say } = checkIn(state);
    commit(next, say);
  }

  function onTrade(market: PlayMarket, side: PlaySide) {
    if (!state) return;
    const { state: next, line: say } = placeTrade(state, market, side);
    commit(next, say);
    setTab("desk");
  }

  function goTab(next: PlayTab, sfx = true) {
    if (sfx) playSfx("open");
    setTab(next);
    if (!state) return;
    if (next === "book") {
      setLine(
        state.hunger >= 4
          ? "Pick one. I want to work."
          : "The book is open. Tell me what to buy.",
      );
    } else if (next === "bag") {
      setLine(
        state.positions.length
          ? "This is what you're in. Ask me anytime."
          : "Empty bag. That's on you.",
      );
    } else {
      setLine(deskLine(state));
    }
  }

  if (!state) return null;

  return (
    <div className="play-desk">
      <div className="dialog-type is-speech">
        <p>{line}</p>
      </div>

      {tab === "desk" && (
        <>
          <div className="play-meters">
            <Meter label="Mood" value={state.mood} />
            <Meter label="Desk" value={5 - state.hunger} />
            <Meter label="Book" value={Math.max(1, 5 - state.hunger)} />
          </div>
          <div className="play-stats">
            <span>Credits {String(state.credits).padStart(2, "0")}</span>
            <span>Holds {state.positions.length}</span>
          </div>
          <div className="launch-btns">
            <Btn onClick={onCheckIn}>Check in</Btn>
            <Btn ghost onClick={() => goTab("book", false)}>
              Open the book
            </Btn>
          </div>
        </>
      )}

      {tab === "book" && (
        <ul className="play-markets">
          {PLAY_MARKETS.map((m) => (
            <li key={m.id}>
              <p className="play-market-title">{m.title}</p>
              <p className="play-market-odds">
                <span>Yes {m.yes}c</span>
                <span>No {m.no}c</span>
              </p>
              <div className="launch-btns">
                <Btn
                  disabled={state.credits < tradeCost(m.yes)}
                  onClick={() => onTrade(m, "YES")}
                >
                  Buy yes
                </Btn>
                <Btn
                  ghost
                  disabled={state.credits < tradeCost(m.no)}
                  onClick={() => onTrade(m, "NO")}
                >
                  Buy no
                </Btn>
              </div>
              <p className="play-market-note">{SHARE_SIZE} shares</p>
            </li>
          ))}
        </ul>
      )}

      {tab === "bag" && (
        <div className="play-bag">
          <p className="play-stats">
            <span>Credits {String(state.credits).padStart(2, "0")}</span>
          </p>
          {state.positions.length === 0 ? (
            <p className="play-empty">Nothing yet. Come use me.</p>
          ) : (
            <ul className="play-holds">
              {state.positions.map((p) => (
                <li key={`${p.id}-${p.side}`}>
                  <span>
                    {p.side} {p.market}
                  </span>
                  <span>
                    {p.shares} @ {p.avg}c
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <nav className="play-dock" aria-label="Desk">
        {(
          [
            ["desk", "Desk"],
            ["book", "Book"],
            ["bag", "Bag"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-active" : undefined}
            onPointerEnter={onSfxMove}
            onClick={() => goTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
