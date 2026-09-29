#!/usr/bin/env python3
"""Build a synthetic talking-head clip + word-timed transcript to test the
pipeline without a real recording (no whisper model needed).

    python examples/demo/make_demo.py && python editor/render.py examples/demo
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "editor"))
from render import FFMPEG  # noqa: E402

HERE = Path(__file__).parent
SR, FPS, W, H = 48000, 30, 720, 1280

# (pause before sentence, sentence) — includes long silences and a filler to test jump cuts
SCRIPT = [
    (0.4, "Cùng là đau lưng, nhưng có người đỡ nhanh, có người kéo dài mãi."),
    (0.3, "Ranh giới quan trọng nằm ở chỗ: chưa tê hay đã tê."),
    (1.4, "ờ"),
    (0.5, "Giai đoạn sớm, chỉ đau lưng, chưa tê chân."),
    (1.1, "Khi đĩa đệm bị chèn ép, dây thần kinh bị kích thích."),
    (0.4, "Lúc đó sẽ có ba dấu hiệu: đau lan xuống chân, tê bì, và chân yếu dần."),
    (1.2, "Khoan! Đừng tự xoa bóp mạnh khi đã tê."),
    (0.5, "Muốn biết kỹ hơn, inbox cho Sơn nhé."),
]


def build_words():
    t, words, segs = 0.0, [], []
    for pause, sent in SCRIPT:
        t += pause
        s0, ws = t, []
        for w in sent.split():
            d = 0.16 + 0.045 * len(w)
            ws.append({"start": round(t, 3), "end": round(t + d, 3), "word": w, "prob": 0.95})
            t += d + (0.18 if w[-1] in ",:" else 0.04)
        segs.append({"start": round(s0, 3), "end": round(t, 3), "text": sent, "words": ws})
        words += ws
    return segs, t + 0.8


def main():
    segs, dur = build_words()
    (HERE / "transcript.json").write_text(json.dumps({"language": "vi", "duration": dur, "segments": segs},
                                                     ensure_ascii=False, indent=1))
    # voice-like audio: harmonic bursts per word, pitch wobble, noise floor
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for s in segs:
        for w in s["words"]:
            i, j = int(w["start"] * SR), int(w["end"] * SR)
            env[i:j] = np.sin(np.linspace(0, np.pi, j - i)) ** 0.6
    f0 = 135 + 18 * np.sin(2 * np.pi * 1.7 * t)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    voice = sum(np.sin(k * ph) / k for k in range(1, 9)) * env * 0.25
    voice += np.random.default_rng(0).standard_normal(n) * 0.003
    raw = (np.clip(voice, -1, 1) * 32767).astype(np.int16)
    (HERE / "voice.raw").write_bytes(raw.tobytes())

    enc = subprocess.Popen([FFMPEG, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-f", "s16le", "-ar", str(SR), "-ac", "1",
                            "-i", str(HERE / "voice.raw"), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                            "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(HERE / "source.mp4")],
                           stdin=subprocess.PIPE)
    bg = Image.new("RGB", (W, H))
    grad = np.linspace(0, 1, H)[:, None, None]
    bg = Image.fromarray((np.array([46, 58, 82]) * (1 - grad) + np.array([18, 22, 34]) * grad)
                         .repeat(W, 1).astype(np.uint8))
    d = ImageDraw.Draw(bg)
    d.rectangle((40, 120, 260, 560), fill=(70, 84, 110))           # "bookshelf"
    for k in range(5):
        d.rectangle((50, 140 + k * 85, 250, 150 + k * 85), fill=(95, 110, 140))
    for i in range(int(dur * FPS)):
        tt = i / FPS
        f = bg.copy()
        d = ImageDraw.Draw(f)
        bob = int(6 * np.sin(tt * 2.1))
        cx, cy = W // 2, int(H * 0.46) + bob
        d.ellipse((cx - 330, cy + 190, cx + 330, cy + 900), fill=(30, 64, 120))           # shoulders
        d.rectangle((cx - 55, cy + 110, cx + 55, cy + 220), fill=(224, 180, 150))           # neck
        d.ellipse((cx - 135, cy - 170, cx + 135, cy + 170), fill=(236, 192, 160))           # head
        d.chord((cx - 145, cy - 185, cx + 145, cy + 40), 180, 360, fill=(40, 30, 25))       # hair
        for ex in (-50, 50):
            d.ellipse((cx + ex - 12, cy - 20, cx + ex + 12, cy + 4), fill=(30, 30, 30))
        a = env[min(n - 1, int(tt * SR))]
        d.ellipse((cx - 38, cy + 70 - 4 - 22 * a, cx + 38, cy + 74 + 22 * a), fill=(150, 60, 60))
        enc.stdin.write(f.tobytes())
    enc.stdin.close()
    enc.wait()
    (HERE / "voice.raw").unlink()
    print(f"→ {HERE / 'source.mp4'} ({dur:.1f}s) and transcript.json")


if __name__ == "__main__":
    main()
