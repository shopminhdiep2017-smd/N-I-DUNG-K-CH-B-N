#!/usr/bin/env python3
"""Render a short 9:16 showcase of the procedural illustrations.

    python examples/minh-hoa/showcase.py   ->  examples/minh-hoa/showcase.mp4
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "editor"))
import style as S  # noqa: E402

S.apply_theme("editorial")
import graphics as G  # noqa: E402
import illustrations as I  # noqa: E402
from render import FFMPEG  # noqa: E402

SCENES = [
    ("Minh họa 1", "Cục máu đông trong lòng mạch",
     I.Vessel(dict(type="vessel", start=0, end=6.5, clot_at=1.6, y=0.5,
                   label="Dòng máu lưu thông", label_after="Cục máu đông làm dòng máu chậm lại"))),
    ("Minh họa 2", "Bộ não và vùng thiếu máu",
     I.Brain(dict(type="brain", start=0, end=6.5, y=0.5, label="Não bộ cần máu nuôi dưỡng",
                  region=dict(center=[0.38, 0.38], at=3.0, color="red", label="Vùng não thiếu máu")))),
]
out = Path(__file__).with_name("showcase.mp4")
enc = subprocess.Popen([FFMPEG, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{S.W}x{S.H}",
                        "-r", str(S.FPS), "-i", "-", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
for kicker, title, el in SCENES:
    bg = Image.new("RGB", (S.W, S.H), (38, 44, 62))
    head = Image.new("RGBA", (S.W, S.H), (0, 0, 0, 0))
    G.draw_text(head, (S.W // 2, int(S.H * 0.27)), " ".join(kicker.upper()), G.font(S.FONT_XBOLD, 40),
                (245, 197, 66), stroke=0, anchor="mm", on_video=True)
    G.draw_text(head, (S.W // 2, int(S.H * 0.31)), title, G.font(S.FONT_BLACK, 64), (250, 246, 236),
                stroke=0, anchor="mm", on_video=True)
    bg.paste(head.convert("RGB"), (0, 0), head.getchannel("A"))
    for i in range(int(el.end * S.FPS)):
        f = bg.copy()
        for sp, x, y, a, sc in el.frame(i / S.FPS):
            if sc != 1:
                sp = sp.resize((int(sp.width * sc), int(sp.height * sc)))
            m = sp.getchannel("A").point(lambda v, a=a: int(v * a))
            f.paste(sp.convert("RGB"), (x, y), m)
        enc.stdin.write(f.tobytes())
enc.stdin.close()
enc.wait()
print("->", out)
