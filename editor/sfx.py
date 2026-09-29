"""Small, tasteful sound effects synthesised in numpy (no stock assets)."""
import numpy as np

SR = 48000


def _env(n, attack=0.005, decay=0.1):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def pop(n_ms=90):
    n = int(SR * n_ms / 1000)
    t = np.arange(n) / SR
    f = 950 * np.exp(-t * 28) + 260
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.03)


def tick():
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2200 * t) * _env(n, 0.0005, 0.006)


def click():
    n = int(SR * 0.02)
    rng = np.random.default_rng(1)
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(4) / 4, "same")
    return x * _env(n, 0.0005, 0.004) * 0.8


def whoosh(dur=0.38):
    n = int(SR * dur)
    rng = np.random.default_rng(2)
    x = rng.standard_normal(n + 400)
    out = np.zeros(n)
    # sweeping moving-average low-pass: dull → bright → dull
    k = (40 - 34 * np.sin(np.linspace(0, np.pi, n))).astype(int)
    cs = np.cumsum(np.insert(x, 0, 0))
    idx = np.arange(n) + 200
    out = (cs[idx + k // 2] - cs[idx - k // 2]) / k
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return out * env * 2.2


def ding():
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 880 * t) + 0.5 * np.sin(2 * np.pi * 1320 * t) + 0.2 * np.sin(2 * np.pi * 1760 * t)
    return x * _env(n, 0.002, 0.14) / 1.7


BANK = {"pop": pop, "tick": tick, "click": click, "whoosh": whoosh, "ding": ding}


def render_track(events, duration, gain_db=-16.0):
    """events: [(t_out, kind)] → mono float32 track."""
    track = np.zeros(int(SR * (duration + 1)), dtype=np.float32)
    g = 10 ** (gain_db / 20)
    for t, kind in events:
        fn = BANK.get(kind)
        if not fn:
            continue
        s = fn()
        s = s / (np.abs(s).max() + 1e-9) * g
        i = int(t * SR)
        j = min(len(track), i + len(s))
        if i < j:
            track[i:j] += s[: j - i]
    return track[: int(SR * duration)]


def write_wav(path, x):
    import wave
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
