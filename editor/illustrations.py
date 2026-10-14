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


ELEMENTS = {c.kind: c for c in (Vessel, Brain)}
