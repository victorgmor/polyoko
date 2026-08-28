"""2A03-style pulse blips: NES duty, period table, envelope, mixer, analog filter."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

CPU = 1_789_772.727272  # NTSC
SR = 44_100
ENV_HZ = 240.0  # 4-step frame sequencer quarter-frame

DUTY = (
    (0, 1, 0, 0, 0, 0, 0, 0),  # 12.5% — thin NES beep
    (0, 1, 1, 0, 0, 0, 0, 0),  # 25%
    (0, 1, 1, 1, 1, 0, 0, 0),  # 50%
    (1, 0, 0, 1, 1, 1, 1, 1),  # 75%
)


def midi_to_period(midi: float) -> int:
    freq = 440.0 * (2.0 ** ((midi - 69.0) / 12.0))
    period = int(round(CPU / (16.0 * freq) - 1.0))
    return max(8, min(2047, period))


NOISE_PERIODS = (
    4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
)


def mix_pulse(p1: int, p2: int) -> float:
    s = p1 + p2
    if s <= 0:
        return 0.0
    return 95.88 / ((8128.0 / s) + 100.0)


def mix_noise(n: int) -> float:
    if n <= 0:
        return 0.0
    return 159.79 / ((12241.0 / n) + 100.0)


class Pulse:
    def __init__(self, duty: int = 1):
        self.duty = duty
        self.step = 0
        self.timer = 0
        self.period = 253
        self.vol = 0
        self.carry = 0.0

    def set_midi(self, midi: float | None) -> None:
        if midi is None:
            self.period = 0
            return
        self.period = midi_to_period(midi)

    def clock(self, cpu_cycles: float) -> None:
        if self.period < 8:
            return
        # Pulse timer ticks at CPU/2
        self.carry += cpu_cycles / 2.0
        ticks = int(self.carry)
        self.carry -= ticks
        for _ in range(ticks):
            if self.timer == 0:
                self.timer = self.period
                self.step = (self.step + 1) & 7
            else:
                self.timer -= 1

    def out(self) -> int:
        if self.period < 8 or self.vol <= 0:
            return 0
        return self.vol if DUTY[self.duty][self.step] else 0


class Noise:
    """NES LFSR noise — short mode is the metallic kirakira tick."""

    def __init__(self) -> None:
        self.shift = 1
        self.timer = 0
        self.period = 16
        self.mode = 1
        self.vol = 0
        self.on = False
        self.carry = 0.0

    def set(self, index: int | None, mode: int = 1) -> None:
        if index is None:
            self.on = False
            return
        self.on = True
        self.period = NOISE_PERIODS[max(0, min(15, index))]
        self.mode = mode

    def clock(self, cpu_cycles: float) -> None:
        if not self.on:
            return
        self.carry += cpu_cycles / 2.0
        ticks = int(self.carry)
        self.carry -= ticks
        tap = 6 if self.mode else 1
        for _ in range(ticks):
            if self.timer == 0:
                self.timer = self.period
                bit = (self.shift ^ (self.shift >> tap)) & 1
                self.shift = (self.shift >> 1) | (bit << 14)
            else:
                self.timer -= 1

    def out(self) -> int:
        if not self.on or self.vol <= 0:
            return 0
        return self.vol if (self.shift & 1) else 0


class Envelope:
    def __init__(self, start: int, decay: int, loop: bool = False):
        self.start = max(0, min(15, start))
        self.decay = max(0, min(15, decay))
        self.loop = loop
        self.vol = self.start
        self.div = self.decay
        self.acc = 0.0

    def clock(self, dt: float) -> int:
        self.acc += dt * ENV_HZ
        while self.acc >= 1.0:
            self.acc -= 1.0
            if self.div == 0:
                self.div = self.decay
                if self.vol > 0:
                    self.vol -= 1
                elif self.loop:
                    self.vol = 15
            else:
                self.div -= 1
        return self.vol


def analog(samples: list[float]) -> list[float]:
    """NES cart analog path: HP 90 Hz, HP 440 Hz, LP 14 kHz (blargg)."""

    def hp(xs: list[float], cutoff: float) -> list[float]:
        a = math.exp(-2.0 * math.pi * cutoff / SR)
        y = 0.0
        px = 0.0
        out = []
        for x in xs:
            y = a * (y + x - px)
            px = x
            out.append(y)
        return out

    def lp(xs: list[float], cutoff: float) -> list[float]:
        a = math.exp(-2.0 * math.pi * cutoff / SR)
        y = 0.0
        out = []
        for x in xs:
            y += (1.0 - a) * (x - y)
            out.append(y)
        return out

    return lp(hp(hp(samples, 90.0), 440.0), 14000.0)


def render(events: list[tuple[float, dict]], seconds: float) -> list[float]:
    """events: (time_sec, {p1_midi, p2_midi, p1_duty, p2_duty, env, noise, p2_soft})"""
    p1 = Pulse(2)
    p2 = Pulse(1)
    nz = Noise()
    env = Envelope(10, 2)
    ev_i = 0
    p2_soft = 3
    mixed: list[float] = []
    cpu_per_sample = CPU / SR
    n = int(seconds * SR)
    for i in range(n):
        t = i / SR
        while ev_i < len(events) and t >= events[ev_i][0]:
            e = events[ev_i][1]
            if "p1_midi" in e:
                p1.set_midi(e["p1_midi"])
            if "p2_midi" in e:
                p2.set_midi(e["p2_midi"])
            if "p1_duty" in e:
                p1.duty = e["p1_duty"]
            if "p2_duty" in e:
                p2.duty = e["p2_duty"]
            if "p2_soft" in e:
                p2_soft = e["p2_soft"]
            if "noise" in e:
                idx, mode = e["noise"]
                nz.set(idx, mode)
            if "env" in e:
                start, decay = e["env"]
                env = Envelope(start, decay)
            ev_i += 1
        v = env.clock(1.0 / SR)
        p1.vol = v
        p2.vol = max(0, v - p2_soft) if p2.period >= 8 else 0
        nz.vol = max(0, v - 6)
        p1.clock(cpu_per_sample)
        p2.clock(cpu_per_sample)
        nz.clock(cpu_per_sample)
        mixed.append(mix_pulse(p1.out(), p2.out()) + mix_noise(nz.out()) * 0.45)
    return analog(mixed)


def to_pcm(samples: list[float], peak: float = 0.42) -> bytes:
    m = max((abs(s) for s in samples), default=1.0) or 1.0
    scale = peak / m
    out = bytearray()
    for s in samples:
        v = int(max(-32767, min(32767, round(s * scale * 32767))))
        out += struct.pack("<h", v)
    return bytes(out)


def write_wav(path: Path, samples: list[float]) -> None:
    pcm = to_pcm(samples)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)
    print(f"{path.name}: {len(samples) / SR * 1000:.0f}ms {path.stat().st_size}b")


def frames(n: float) -> float:
    return n / 60.0988


def main() -> None:
    out = Path("/Users/victor/polyoko/public/sfx")
    out.mkdir(parents=True, exist_ok=True)

    # ピッ — high round 50% pulse, G6 + soft B6. Tamagotchi / kitty-menu cursor.
    move = render(
        [
            (
                0.0,
                {
                    "p1_midi": 91,
                    "p2_midi": 95,
                    "p1_duty": 2,
                    "p2_duty": 1,
                    "p2_soft": 4,
                    "env": (8, 1),
                },
            ),
            (frames(4), {"p1_midi": None, "p2_midi": None, "env": (0, 0)}),
        ],
        frames(8),
    )
    write_wav(out / "move.wav", move)

    # ピロン — rising major third, C6–E6–G6. Cute decide / yes.
    confirm = render(
        [
            (
                0.0,
                {
                    "p1_midi": 84,
                    "p2_midi": 88,
                    "p1_duty": 2,
                    "p2_duty": 2,
                    "p2_soft": 3,
                    "env": (11, 2),
                },
            ),
            (frames(4), {"p1_midi": 88, "p2_midi": 91}),
            (frames(8), {"p1_midi": 91, "p2_midi": 96, "env": (10, 2)}),
            (frames(15), {"p1_midi": None, "p2_midi": None, "env": (0, 0)}),
        ],
        frames(20),
    )
    write_wav(out / "confirm.wav", confirm)

    # キラキラ — rising twinkle + short metallic glitter. Album / card-open.
    sparkle = (84, 88, 91, 96, 100)  # C6 E6 G6 C7 E7
    third = (88, 91, 96, 100, 103)
    open_ev: list[tuple[float, dict]] = [
        (
            0.0,
            {
                "p1_midi": sparkle[0],
                "p2_midi": third[0],
                "p1_duty": 2,
                "p2_duty": 1,
                "p2_soft": 3,
                "noise": (1, 1),
                "env": (12, 2),
            },
        )
    ]
    step = frames(3)
    for i in range(1, 5):
        ev: dict = {"p1_midi": sparkle[i], "p2_midi": third[i]}
        if i == 2:
            ev["noise"] = (None, 1)
        open_ev.append((i * step, ev))
    open_ev.append(
        (frames(18), {"p1_midi": None, "p2_midi": None, "noise": (None, 1), "env": (0, 0)})
    )
    opened = render(open_ev, frames(24))
    write_wav(out / "open.wav", opened)


if __name__ == "__main__":
    main()
