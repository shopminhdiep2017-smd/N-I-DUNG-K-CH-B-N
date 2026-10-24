"""Animated medical illustrations drawn procedurally (no stock footage needed).

    {"type": "vessel", "start": 21.0, "end": 26.0, "clot_at": 22.0,
     "label": "Dòng máu lưu thông", "label_after": "Cục máu đông cản dòng máu"}
    {"type": "brain", "start": 30.0, "end": 35.0,
     "label": "Não bộ hoạt động", "region": {"center": [0.42, 0.40], "at": 32.0,
                                            "color": "red", "label": "Vùng thiếu máu"}}

Each frame is drawn fresh from the local time, so motion is smooth and
deterministic. Flat, clean style on the theme's card, never gory.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import graphics as G
import style as S

CW, CH = S.W - 2 * S.SIDE_MARGIN, 520      # card size


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


class Animated(G.Element):
    """Base: a card whose content is redrawn every frame."""

    def __init__(self, spec):
        super().__init__(spec)
        self.h = int(spec.get("height", CH))
        self._card = None

    def card(self):
        if self._card is None:
            self._card = G.panel(CW, self.h, accent=self.spec.get("accent", "red"))
        return self._card

    def bbox(self):
        y = int(S.H * self.cy - self.h / 2)
        x = (S.W - CW) // 2
        return x, y, x + CW, y + self.h

    def change_times(self):
        return [self.start] + [float(v) for k, v in self.spec.items() if k.endswith("_at")]

    def draw(self, img, t):           # t = seconds since start
        raise NotImplementedError

    def label(self, img, text, color="ink"):
        if not text:
            return
        f, lines = G.fit(text, S.FONT_XBOLD, CW - 80, 44, 30, 1)
        y = self.h - G.line_h(f) - 26
        G.draw_text(img, ((CW - G.text_w(lines[0], f)) // 2, y), lines[0], f, S.color(color), stroke=3)

    def frame(self, t):
        if not (self.start <= t < self.end):
            return []
        img = self.card().copy()
        content = Image.new("RGBA", img.size, (0, 0, 0, 0))
        self.draw(content, t - self.start)
        mask = Image.new("L", img.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, CW - 1, self.h - 1), radius=34, fill=255)
        content.putalpha(Image.fromarray(np.minimum(np.asarray(content.getchannel("A")),
                                                    np.asarray(mask))))
        img.alpha_composite(content)
        p = min(1.0, (t - self.start) / G.INTRO)
        q = min(1.0, (self.end - t) / G.OUTRO)
        e = 1 - (1 - p) ** 3
        scale = 0.94 + 0.06 * e
        return [self._place(img, e * min(1.0, q * 1.2), scale, 0)]


# --------------------------------------------------------------- vessel ----
class Vessel(Animated):
    """Blood vessel, red cells flowing; a clot grows and the flow slows."""
    kind = "vessel"
    WALL, LUMEN = (196, 78, 86), (253, 232, 228)
    CELL, CELL_IN = (206, 42, 52), (168, 26, 36)
    CLOT, FIBRIN = (122, 18, 30), (244, 214, 170)

    def __init__(self, spec):
        super().__init__(spec)
        self.cy_v = self.h * 0.43            # vessel centre line
        self.r_l = 118                       # lumen half-height
        self.cx = CW * 0.56                  # clot position
        rng = np.random.default_rng(7)
        n = 30
        self.lane = rng.uniform(-0.78, 0.78, n) * self.r_l
        self.size = rng.uniform(15, 21, n)
        self.tilt = rng.uniform(0.62, 0.85, n)
        x0 = rng.uniform(-60, CW + 60, n)
        # integrate positions once; speed drops as the clot grows
        dur = self.end - self.start
        steps = int(dur * S.FPS) + 2
        clot_at = float(spec.get("clot_at", self.start + 1.0)) - self.start
        self.grow = [ease((i / S.FPS - clot_at) / 1.4) for i in range(steps)]
        self.pos = np.zeros((steps, n))
        x = x0.copy()
        for i in range(steps):
            g = self.grow[i]
            v = 260 * (1 - 0.7 * g)
            near = np.clip(1 - np.abs(x - (self.cx - 70)) / 160, 0, 1)
            x = x + v * (1 - 0.6 * g * near) / S.FPS
            x = np.where(x > CW + 60, x - (CW + 120), x)
            self.pos[i] = x
        blob_rng = np.random.default_rng(3)
        self.blobs = [(blob_rng.uniform(-1, 1), blob_rng.uniform(0, 1), blob_rng.uniform(0.45, 1.0))
                      for _ in range(14)]
        self.fibers = [(blob_rng.uniform(-1, 1), blob_rng.uniform(0, 1),
                        blob_rng.uniform(-1, 1), blob_rng.uniform(0, 1)) for _ in range(9)]

    def clot_top(self, g):
        return self.cy_v + self.r_l - g * self.r_l * 1.25    # y of the clot's top edge

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        i = min(len(self.grow) - 1, int(t * S.FPS))
        g = self.grow[i]
        cy, rl, wall = self.cy_v, self.r_l, 26
        d.rectangle((0, cy - rl - wall, CW, cy + rl + wall), fill=self.WALL + (255,))
        d.rectangle((0, cy - rl, CW, cy + rl), fill=self.LUMEN + (255,))
        d.rectangle((0, cy - rl + 10, CW, cy - rl + 22), fill=(255, 245, 242, 255))   # highlight
        # cells
        top = self.clot_top(g)
        for x, lane, sz, tl in zip(self.pos[i], self.lane, self.size, self.tilt):
            y = cy + lane
            if g > 0 and abs(x - self.cx) < 95 * g + sz:
                y = min(y, top - sz - 4)          # squeeze over the clot
            y = max(cy - rl + sz, y)
            rx, ry = sz, sz * tl
            d.ellipse((x - rx, y - ry, x + rx, y + ry), fill=self.CELL + (255,))
            d.ellipse((x - rx * 0.45, y - ry * 0.4, x + rx * 0.45, y + ry * 0.4), fill=self.CELL_IN + (255,))
        # clot
        if g > 0.01:
            base = cy + rl
            hgt = g * rl * 1.25
            wid = 100 * g + 20
            for bx, by, br in self.blobs:
                px = self.cx + bx * wid * 0.8
                py = base - by * hgt
                r = br * (28 + 30 * g)
                d.ellipse((px - r, py - r, px + r, py + r), fill=self.CLOT + (255,))
            for x1, y1, x2, y2 in self.fibers:
                d.line((self.cx + x1 * wid, base - y1 * hgt, self.cx + x2 * wid, base - y2 * hgt),
                       fill=self.FIBRIN + (230,), width=3)
            d.rectangle((0, cy + rl, CW, cy + rl + wall), fill=self.WALL + (255,))
        # flow chevrons upstream show the slowdown
        for k in range(3):
            sp = 1 - 0.7 * g
            ox = (t * 120 * sp + k * 60) % 180
            ax = 40 + ox
            d.line((ax, cy - 20, ax + 18, cy, ax, cy + 20), fill=(255, 255, 255, 180), width=6)
        # pointer + label after the clot forms
        if g > 0.6:
            a = int(255 * ease((g - 0.6) / 0.4))
            tip = (self.cx - 30, top + 12)
            tag = self.spec.get("tag", "Cục máu đông")
            f = G.font(S.FONT_XBOLD, 36)
            tx = int(self.cx - 190 - G.text_w(tag, f))
            ty = int(cy - rl - wall - 4)
            d.line((tx + G.text_w(tag, f) + 10, ty + 24, tip[0], tip[1]), fill=S.color("ink") + (a,), width=5)
            d.ellipse((tip[0] - 7, tip[1] - 7, tip[0] + 7, tip[1] + 7), fill=S.color("ink") + (a,))
            box = Image.new("RGBA", img.size, (0, 0, 0, 0))
            ImageDraw.Draw(box).rounded_rectangle((tx - 14, ty - 6, tx + G.text_w(tag, f) + 14, ty + 50),
                                                  radius=14, fill=(250, 246, 236, int(235 * a / 255)))
            img.alpha_composite(box)
            G.draw_text(img, (tx, ty), tag, f, S.color("red"), stroke=3)
        self.label(img, self.spec.get("label_after") if g > 0.5 else self.spec.get("label"))


# ---------------------------------------------------------------- brain ----
class Brain(Animated):
    """Stylised brain with travelling neural signals; optional region alert."""
    kind = "brain"
    FILL, GYRI = (240, 184, 192), (206, 128, 146)

    def __init__(self, spec):
        super().__init__(spec)
        self._static, self.nodes, self.edges = self._build()

    def _build(self):
        w, h = CW, self.h
        mask = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(mask)
        sx, sy, ox, oy = w * 0.56, h * 0.66, w * 0.22, h * 0.03
        def ell(cx, cy, rx, ry):
            d.ellipse((ox + (cx - rx) * sx, oy + (cy - ry) * sy, ox + (cx + rx) * sx, oy + (cy + ry) * sy), fill=255)
        ell(0.30, 0.45, 0.26, 0.33)   # frontal
        ell(0.52, 0.36, 0.25, 0.31)   # parietal
        ell(0.74, 0.48, 0.21, 0.27)   # occipital
        ell(0.47, 0.64, 0.27, 0.18)   # temporal
        mask = mask.filter(ImageFilter.GaussianBlur(10)).point(lambda v: 255 if v > 128 else 0)
        cereb = Image.new("L", (w, h), 0)
        dc = ImageDraw.Draw(cereb)
        dc.ellipse((ox + 0.62 * sx, oy + 0.70 * sy, ox + 0.90 * sx, oy + 0.92 * sy), fill=255)
        stem = (ox + 0.56 * sx, oy + 0.72 * sy, ox + 0.66 * sx, oy + 1.02 * sy)
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        di = ImageDraw.Draw(img)
        di.rounded_rectangle(stem, radius=20, fill=(214, 150, 160, 255))
        img.paste(Image.new("RGBA", (w, h), (222, 150, 164, 255)), (0, 0), cereb)
        for k in range(7):   # cerebellum folds
            yy = oy + (0.74 + k * 0.025) * sy
            di.arc((ox + 0.63 * sx, yy - 20, ox + 0.89 * sx, yy + 20), 200, 340, fill=(190, 110, 128, 255), width=3)
        img.paste(Image.new("RGBA", (w, h), self.FILL + (255,)), (0, 0), mask)
        gy = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        dg = ImageDraw.Draw(gy)
        rng = np.random.default_rng(11)
        ys, xs = np.nonzero(np.asarray(mask) > 0)
        for _ in range(46):
            j = rng.integers(len(xs))
            x, y = float(xs[j]), float(ys[j])
            ang = rng.uniform(0, math.pi)
            pts = []
            for s in range(9):
                x += math.cos(ang) * 14
                y += math.sin(ang) * 14
                ang += rng.uniform(-0.9, 0.9)
                pts.append((x, y))
            dg.line(pts, fill=self.GYRI + (255,), width=5, joint="curve")
        gy.putalpha(Image.fromarray(np.minimum(np.asarray(gy.getchannel("A")),
                                               np.asarray(mask.filter(ImageFilter.MinFilter(15))))))
        img.alpha_composite(gy)
        # outline
        edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(5))
        img.paste(Image.new("RGBA", (w, h), (186, 104, 124, 255)), (0, 0), edge)
        # neural graph
        inner = np.asarray(mask.filter(ImageFilter.MinFilter(41))) > 0
        ys, xs = np.nonzero(inner)
        idx = rng.choice(len(xs), 24, replace=False)
        nodes = [(float(xs[k]), float(ys[k])) for k in idx]
        edges = set()
        for a, (x, y) in enumerate(nodes):
            dists = sorted(range(len(nodes)), key=lambda b: (nodes[b][0] - x) ** 2 + (nodes[b][1] - y) ** 2)
            for b in dists[1:3]:
                edges.add((min(a, b), max(a, b)))
        edges = [(a, b, rng.uniform(0, 1), rng.uniform(0.7, 1.3)) for a, b in sorted(edges)]
        return img, nodes, edges

    def draw(self, img, t):
        img.alpha_composite(self._static)
        d = ImageDraw.Draw(img)
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dg = ImageDraw.Draw(glow)
        gold = (255, 196, 70)
        for a, b, ph, sp in self.edges:
            (x1, y1), (x2, y2) = self.nodes[a], self.nodes[b]
            d.line((x1, y1, x2, y2), fill=(255, 255, 255, 110), width=3)
            u = (t * 0.9 * sp + ph) % 1.0
            px, py = x1 + (x2 - x1) * u, y1 + (y2 - y1) * u
            dg.ellipse((px - 11, py - 11, px + 11, py + 11), fill=gold + (230,))
            d.ellipse((px - 5, py - 5, px + 5, py + 5), fill=(255, 250, 230, 255))
        for k, (x, y) in enumerate(self.nodes):
            pulse = 0.5 + 0.5 * math.sin(t * 4 + k)
            r = 6 + 3 * pulse
            dg.ellipse((x - r * 2, y - r * 2, x + r * 2, y + r * 2), fill=gold + (int(120 * pulse),))
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 236, 190, 255))
        reg = self.spec.get("region")
        if reg:
            at = float(reg.get("at", self.start)) - self.start
            k = ease((t - at) / 0.8)
            if k > 0:
                cx, cy = reg["center"][0] * CW, reg["center"][1] * self.h
                rr = reg.get("radius", 0.12) * CW
                col = S.color(reg.get("color", "red"))
                pulse = 0.75 + 0.25 * math.sin(t * 5)
                dg.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col + (int(170 * k * pulse),))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(9)))
        if reg and t >= float(reg.get("at", self.start)) - self.start + 0.5:
            self.label(img, reg.get("label"), reg.get("color", "red"))
        else:
            self.label(img, self.spec.get("label"))


def _at(spec, key, start, default=None):
    v = spec.get(key, default)
    return None if v is None else float(v) - start


# ---------------------------------------------------------------- heart ----
class Heart(Animated):
    """Beating heart with a scrolling ECG trace; optional faster beat at `fast_at`."""
    kind = "heart"
    RED, DARK = (214, 52, 64), (160, 28, 40)

    def __init__(self, spec):
        super().__init__(spec)
        th = np.linspace(0, 2 * math.pi, 240)
        self.shape = np.stack([16 * np.sin(th) ** 3,
                               -(13 * np.cos(th) - 5 * np.cos(2 * th) - 2 * np.cos(3 * th) - np.cos(4 * th))], 1)
        self.fast_at = _at(spec, "fast_at", self.start)

    def bpm(self, t):
        return 72 + (38 * ease((t - self.fast_at) / 1.0) if self.fast_at is not None else 0)

    def phase(self, t):
        # closed-form integral of bpm/60 so the tempo change stays continuous
        ph = 1.2 * t
        if self.fast_at is not None and t > self.fast_at:
            u = min(1.0, t - self.fast_at)
            ramp = u ** 3 - u ** 4 / 2 + max(0.0, t - self.fast_at - 1.0)
            ph += 38 / 60 * ramp
        return ph

    @staticmethod
    def beat(ph):
        f = ph % 1.0                        # lub (big) then dub (small)
        return math.exp(-((f - 0.05) / 0.05) ** 2) + 0.55 * math.exp(-((f - 0.28) / 0.05) ** 2)

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        ph = self.phase(t)
        k = 1 + 0.10 * self.beat(ph)
        cx, cy, sc = CW * 0.5, self.h * 0.36, 7.2 * k
        pts = [(cx + x * sc, cy + y * sc) for x, y in self.shape]
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).polygon(pts, fill=self.RED + (int(110 * self.beat(ph)),))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
        d.polygon(pts, fill=self.RED + (255,))
        d.ellipse((cx - 70 * sc / 7, cy - 60 * sc / 7, cx - 20 * sc / 7, cy - 25 * sc / 7), fill=(240, 120, 128, 255))
        # ECG strip
        y0, x0, x1 = self.h * 0.70, 60, CW - 60
        d.line((x0, y0, x1, y0), fill=(220, 200, 196, 255), width=2)
        xs = np.linspace(x0, x1, 260)
        tt = t - (x1 - xs) / 260.0          # trace scrolls right-to-left, 1 s per 260 px
        trace = []
        for x, ti in zip(xs, tt):
            f = (self.phase(max(ti, 0)) if ti > 0 else ti * 1.2) % 1.0
            v = (-1.0 * math.exp(-((f - 0.05) / 0.012) ** 2) + 0.35 * math.exp(-((f - 0.09) / 0.015) ** 2)
                 - 0.15 * math.exp(-((f - 0.30) / 0.05) ** 2))
            trace.append((x, y0 + v * 60))
        d.line(trace, fill=self.DARK + (255,), width=4, joint="curve")
        fast = self.fast_at is not None and t >= self.fast_at + 0.6
        self.label(img, self.spec.get("label_after") if fast else self.spec.get("label"), "red" if fast else "ink")


# ------------------------------------------------------------- pressure ----
class Pressure(Animated):
    """Gauge whose needle rises from the normal zone into the high zone at `high_at`."""
    kind = "pressure"

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        cx, cy, r = CW * 0.5, self.h * 0.62, 210
        zones = [(180, 252, (46, 160, 90)), (252, 300, (232, 176, 40)), (300, 360, (206, 52, 60))]
        for a0, a1, col in zones:
            d.arc((cx - r, cy - r, cx + r, cy + r), a0, a1, fill=col + (255,), width=44)
        for k in range(0, 13):                 # ticks
            a = math.radians(180 + k * 15)
            d.line((cx + (r - 30) * math.cos(a), cy + (r - 30) * math.sin(a),
                    cx + (r - 56) * math.cos(a), cy + (r - 56) * math.sin(a)), fill=(120, 110, 100, 255), width=3)
        hi = _at(self.spec, "high_at", self.start)
        k = ease((t - hi) / 1.6) if hi is not None else 0
        wob = 2.5 * math.sin(t * 9) * (0.3 + k)
        ang = math.radians(180 + 40 + (120 * k) + wob)    # 220° (normal) -> 340° (high)
        L = r - 40
        d.line((cx, cy, cx + L * math.cos(ang), cy + L * math.sin(ang)), fill=S.color("ink") + (255,), width=10)
        d.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), fill=S.color("ink") + (255,))
        f = G.font(S.FONT_XBOLD, 34)
        for txt, x, col in (("Bình thường", cx - r - 10, "green"), ("Cao", cx + r + 10, "red")):
            G.draw_text(img, (int(x), int(cy + 42)), txt, f, S.color(col), stroke=2, anchor="mt")
        self.label(img, self.spec.get("label_after") if k > 0.6 else self.spec.get("label"),
                   "red" if k > 0.6 else "ink")


# ---------------------------------------------------------------- nerve ----
class Nerve(Animated):
    """Neuron passing signals; from `tingle_at` the signal flickers with sparks (numbness)."""
    kind = "nerve"
    BODY, AXON = (124, 92, 196), (150, 126, 214)

    def __init__(self, spec):
        super().__init__(spec)
        rng = np.random.default_rng(5)
        self.cx, self.cy = CW * 0.18, self.h * 0.40
        self.dend = []
        for k in range(7):
            a = math.pi * (0.55 + k / 6 * 0.9)
            pts = [(self.cx, self.cy)]
            x, y = self.cx, self.cy
            for _ in range(4):
                x += math.cos(a) * 26
                y += math.sin(a) * 26
                a += rng.uniform(-0.5, 0.5)
                pts.append((x, y))
            self.dend.append(pts)
        xs = np.linspace(self.cx + 40, CW - 70, 120)
        self.axon = [(x, self.cy + 18 * math.sin((x - self.cx) / 70)) for x in xs]
        self.sparks = rng.uniform(0, 1, (18, 3))

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        for pts in self.dend:
            d.line(pts, fill=self.AXON + (255,), width=7, joint="curve")
        d.line(self.axon, fill=self.AXON + (255,), width=12, joint="curve")
        for k in range(0, len(self.axon) - 10, 14):        # myelin segments
            seg = self.axon[k:k + 9]
            d.line(seg, fill=(232, 206, 150, 255), width=22, joint="curve")
        ex, ey = self.axon[-1]
        for a in (-0.6, 0, 0.6):
            d.line((ex, ey, ex + 34 * math.cos(a), ey + 34 * math.sin(a)), fill=self.AXON + (255,), width=6)
        d.ellipse((self.cx - 46, self.cy - 46, self.cx + 46, self.cy + 46), fill=self.BODY + (255,))
        d.ellipse((self.cx - 16, self.cy - 16, self.cx + 16, self.cy + 16), fill=(84, 58, 150, 255))
        ti = _at(self.spec, "tingle_at", self.start)
        bad = ti is not None and t >= ti
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dg = ImageDraw.Draw(glow)
        n = len(self.axon)
        for j in range(3):
            u = (t * 0.7 + j / 3) % 1.0
            if bad and (math.sin(t * 23 + j * 2) > 0.2 or u > 0.55):
                continue                         # signal drops out = numbness
            x, y = self.axon[min(n - 1, int(u * n))]
            dg.ellipse((x - 20, y - 20, x + 20, y + 20), fill=(255, 210, 80, 230))
            d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(255, 250, 220, 255))
        if bad:
            k = ease((t - ti) / 0.6)
            for sx, sy, sp in self.sparks:
                x, y = self.axon[int(0.45 * n + sx * 0.5 * n) % n]
                if math.sin(t * 17 + sp * 40) > 0.3:
                    yy = y + (sy - 0.5) * 70
                    for a in range(4):
                        aa = a * math.pi / 2 + t * 3
                        dg.line((x, yy, x + 16 * math.cos(aa), yy + 16 * math.sin(aa)), fill=(230, 60, 60, int(240 * k)),
                                width=4)
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(4)))
        img.alpha_composite(glow)
        self.label(img, self.spec.get("label_after") if bad else self.spec.get("label"), "red" if bad else "ink")


# ---------------------------------------------------------------- sleep ----
class Sleep(Animated):
    """Night scene: moon, stars, a clock running through the night, floating Zzz.
    `wake_at` stops the Zzz and highlights the clock (waking in the night)."""
    kind = "sleep"

    def __init__(self, spec):
        super().__init__(spec)
        rng = np.random.default_rng(9)
        self.stars = rng.uniform(0, 1, (26, 3))
        self.h0 = float(spec.get("from_hour", 22))
        self.h1 = float(spec.get("to_hour", 26))     # 26 = 2 am next day

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, CW, self.h - 96), fill=(30, 40, 78, 255))
        for sx, sy, sp in self.stars:
            a = int(140 + 115 * (0.5 + 0.5 * math.sin(t * 3 + sp * 20)))
            x, y = sx * CW, sy * (self.h - 120)
            d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 244, 200, a))
        mx, my = CW * 0.20, self.h * 0.30
        d.ellipse((mx - 70, my - 70, mx + 70, my + 70), fill=(250, 226, 150, 255))
        d.ellipse((mx - 40, my - 86, mx + 100, my + 54), fill=(30, 40, 78, 255))
        cx, cy, r = CW * 0.62, self.h * 0.40, 120
        wk = _at(self.spec, "wake_at", self.start)
        awake = wk is not None and t >= wk
        dur = max(0.1, self.end - self.start)
        hour = self.h0 + (self.h1 - self.h0) * ease(t / dur)
        ring = (230, 80, 80) if awake and int(t * 4) % 2 else (240, 236, 226)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(250, 246, 236, 255), outline=ring + (255,), width=10)
        for k in range(12):
            a = math.radians(k * 30 - 90)
            d.line((cx + (r - 14) * math.cos(a), cy + (r - 14) * math.sin(a),
                    cx + (r - 30) * math.cos(a), cy + (r - 30) * math.sin(a)), fill=(60, 60, 80, 255), width=4)
        hm = (hour % 12) / 12 * 2 * math.pi - math.pi / 2
        mm = (hour % 1) * 2 * math.pi - math.pi / 2
        d.line((cx, cy, cx + 60 * math.cos(hm), cy + 60 * math.sin(hm)), fill=(30, 34, 52, 255), width=10)
        d.line((cx, cy, cx + 92 * math.cos(mm), cy + 92 * math.sin(mm)), fill=(30, 34, 52, 255), width=6)
        d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=(200, 40, 50, 255))
        if not awake:
            f = G.font(S.FONT_BLACK, 54)
            for j in range(3):
                u = (t * 0.4 + j / 3) % 1.0
                a = int(255 * math.sin(math.pi * u))
                zz = Image.new("RGBA", img.size, (0, 0, 0, 0))
                G.draw_text(zz, (int(CW * 0.80 + 40 * u), int(self.h * 0.55 - 220 * u)), "z", f,
                            (220, 226, 255), stroke=0, shadow=False, on_video=True)
                zz.putalpha(zz.getchannel("A").point(lambda v, a=a: v * a // 255))
                img.alpha_composite(zz)
        self.label(img, self.spec.get("label_after") if awake else self.spec.get("label"), "red" if awake else "ink")


# ----------------------------------------------------------------- walk ----
class Walk(Animated):
    """A person walking on a scrolling path (daily activity)."""
    kind = "walk"
    BODY = (22, 120, 60)

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        ground = self.h * 0.76
        d.rectangle((0, ground, CW, ground + 14), fill=(190, 214, 190, 255))
        for k in range(8):                       # trees scroll by
            x = (k * 170 - t * 120) % (CW + 170) - 85
            d.rectangle((x - 6, ground - 70, x + 6, ground), fill=(140, 110, 80, 255))
            d.ellipse((x - 42, ground - 150, x + 42, ground - 60), fill=(120, 190, 130, 255))
        cx, ph = CW * 0.5, t * 2 * math.pi * 1.1
        hip = (cx, ground - 150 - 4 * abs(math.sin(ph)))
        sh = (cx + 8, hip[1] - 120)
        c = self.BODY + (255,)
        def limb(p, a1, l1, a2, l2, w):
            k1 = (p[0] + l1 * math.sin(a1), p[1] + l1 * math.cos(a1))
            k2 = (k1[0] + l2 * math.sin(a2), k1[1] + l2 * math.cos(a2))
            d.line((p, k1, k2), fill=c, width=w, joint="curve")
        s = math.sin(ph)
        limb(sh, -0.6 * s, 62, -0.6 * s + 0.5, 58, 18)           # back arm
        limb(hip, 0.55 * s, 78, 0.55 * s - 0.35 * max(0, -s) - 0.1, 76, 22)
        limb(hip, -0.55 * s, 78, -0.55 * s - 0.35 * max(0, s) - 0.1, 76, 22)
        d.line((hip, sh), fill=c, width=34)
        limb(sh, 0.6 * s, 62, 0.6 * s + 0.5, 58, 18)             # front arm
        d.ellipse((sh[0] - 34, sh[1] - 96, sh[0] + 34, sh[1] - 28), fill=(232, 190, 160, 255))
        self.label(img, self.spec.get("label"))


# -------------------------------------------------------------- battery ----
class Battery(Animated):
    """Energy battery (cell energy, Q10…): fills and pulses; drains and turns red from `drain_at`."""
    kind = "battery"

    def draw(self, img, t):
        d = ImageDraw.Draw(img)
        bw, bh = CW * 0.56, self.h * 0.42
        x0, y0 = (CW - bw) / 2 - 14, self.h * 0.36 - bh / 2
        x1, y1 = x0 + bw, y0 + bh
        d.rounded_rectangle((x0, y0, x1, y1), radius=26, outline=S.color("ink") + (255,), width=10)
        d.rounded_rectangle((x1 + 4, y0 + bh * 0.3, x1 + 30, y1 - bh * 0.3), radius=8, fill=S.color("ink") + (255,))
        full = float(self.spec.get("level", 0.9))
        dr = _at(self.spec, "drain_at", self.start)
        if dr is None or t < dr:
            level = full * ease(t / 0.9)                       # charge up on entry
        else:
            level = full - (full - float(self.spec.get("low", 0.2))) * ease((t - dr) / 1.6)
        low = level < 0.45
        col = (206, 52, 60) if low else (46, 170, 96)
        n = 5
        gap = 10
        cw = (bw - 40 - gap * (n - 1)) / n
        for k in range(n):
            frac = min(1.0, max(0.0, level * n - k))
            if frac <= 0:
                continue
            cx0 = x0 + 20 + k * (cw + gap)
            d.rounded_rectangle((cx0, y0 + 20, cx0 + cw * frac, y1 - 20), radius=8, fill=col + (255,))
        if not low:                                            # lightning bolt pulsing = energy
            pulse = 0.6 + 0.4 * math.sin(t * 5)
            cx, cy, sz = (x0 + x1) / 2, (y0 + y1) / 2, bh * 0.36
            bolt = [(cx + 0.15 * sz, cy - sz), (cx - 0.45 * sz, cy + 0.1 * sz), (cx - 0.02 * sz, cy + 0.1 * sz),
                    (cx - 0.2 * sz, cy + sz), (cx + 0.45 * sz, cy - 0.15 * sz), (cx + 0.02 * sz, cy - 0.15 * sz)]
            d.polygon(bolt, fill=(255, 214, 64, int(255 * pulse)), outline=(120, 90, 0, 255))
        f = G.font(S.FONT_BLACK, 56)
        pct = f"{int(round(level * 100))}%"
        if self.spec.get("show_pct"):   # off by default: a percentage reads like a real measurement
          G.draw_text(img, (int(x1 + 60), int((y0 + y1) / 2)), pct, f, (206, 52, 60) if low else (30, 120, 70),
                    stroke=0, anchor="lm")
        self.label(img, self.spec.get("label_after") if (dr is not None and t >= dr + 0.4) else self.spec.get("label"),
                   "red" if low else "ink")


ELEMENTS = {c.kind: c for c in (Vessel, Brain, Heart, Pressure, Nerve, Sleep, Walk, Battery)}
