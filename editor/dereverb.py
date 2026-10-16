"""Late-reverberation suppression for a single speech microphone.

Classic statistical model (Lebart / Habets): the late reverb power at time t is the
signal power Td seconds earlier, attenuated by the room's exponential decay
exp(-2·δ·Td) with δ = 3·ln10 / RT60. A Wiener-style gain then removes that part
of the spectrum, which is what makes a voice sound "vang" (echoey) in a bare room.

    "audio": {"dereverb": {"rt60": 0.5, "strength": 1.0}}
"""
from __future__ import annotations

import numpy as np


def dereverb(x: np.ndarray, sr: int, rt60: float = 0.5, strength: float = 1.0,
             floor_db: float = -12.0, early_ms: float = 50.0) -> np.ndarray:
    n_fft = 1024 if sr >= 32000 else 512
    hop = n_fft // 4
    win = np.hanning(n_fft).astype(np.float32)
    pad = np.pad(x.astype(np.float32), (n_fft, n_fft))
    frames = np.lib.stride_tricks.sliding_window_view(pad, n_fft)[::hop] * win
    X = np.fft.rfft(frames, axis=1)
    P = np.abs(X) ** 2

    # smooth the power a little over time so the estimate isn't noisy
    a = 0.6
    Ps = np.empty_like(P)
    Ps[0] = P[0]
    for i in range(1, len(P)):
        Ps[i] = a * Ps[i - 1] + (1 - a) * P[i]

    delay = max(1, int(round(early_ms / 1000 * sr / hop)))
    delta = 3 * np.log(10) / max(rt60, 0.1)
    decay = np.exp(-2 * delta * delay * hop / sr)
    late = np.zeros_like(P)
    late[delay:] = decay * Ps[:-delay] * strength

    gmin = 10 ** (floor_db / 20)
    G = np.maximum(1 - late / (P + 1e-10), gmin ** 2)
    G = np.sqrt(G)
    # soften gain changes over time to avoid "musical noise"
    for i in range(1, len(G)):
        G[i] = np.maximum(G[i], 0.5 * G[i - 1])
    Y = X * G

    y = np.fft.irfft(Y, n=n_fft, axis=1) * win
    out = np.zeros(len(pad), np.float32)
    norm = np.zeros(len(pad), np.float32)
    for i, frame in enumerate(y):
        s = i * hop
        out[s:s + n_fft] += frame
        norm[s:s + n_fft] += win ** 2
    out = out / np.maximum(norm, 1e-6)
    return out[n_fft:n_fft + len(x)]
