"""Overlay graphics for the visual information zone, drawn with Pillow.

Each overlay in the EDL becomes an ``Element``. An element has one or more
*states* (e.g. a checklist gains an item each time the speaker names one);
every state is rendered once to an RGBA sprite and cached. Per frame the
renderer asks the element for (sprite, x, y, alpha) and composites it.
"""
from __future__ import annotations

import math
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFilter, ImageFont

import style as S

INTRO = 0.28     # seconds for the entry animation
OUTRO = 0.20
XFADE = 0.16     # crossfade between states (reveal of a new item)


@lru_cache(maxsize=256)
def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    path, _, var = path.partition("#")        # "Font-VF.ttf#Black" = variable font instance
    f = ImageFont.truetype(path, size)
    if var:
        f.set_variation_by_name(var)
    return f


def U(text: str) -> str:
    return text.upper() if S.UPPER else text


def text_w(txt, f):
    l, t, r, b = f.getbbox(txt)
    return r - l


def wrap(txt: str, f, max_w: int, max_lines: int = 2):
    words, lines, cur = txt.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_w(trial, f) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    if len(lines) == 2:        # balance two lines so no word is left orphaned
        best = None
        for k in range(1, len(words)):
            a, b = " ".join(words[:k]), " ".join(words[k:])
            m = max(text_w(a, f), text_w(b, f))
            if m <= max_w and (best is None or m < best[0]):
                best = (m, [a, b])
        if best:
            lines = best[1]
    return lines if len(lines) <= max_lines else None


def fit(txt: str, path: str, max_w: int, size: int, min_size: int = 34, max_lines: int = 2):
    """Largest font size (<= size) at which txt wraps into max_lines."""
    s = size
    while s >= min_size:
        f = font(path, s)
        lines = wrap(txt, f, max_w, max_lines)
        if lines:
            return f, lines
        s -= 4
    f = font(path, min_size)
    return f, wrap(txt, f, max_w, 99)


def line_h(f):
    a, d = f.getmetrics()
    return int((a + d) * 1.08)


def draw_text(img, xy, txt, f, fill, stroke=6, shadow=True, anchor="la", on_video=False):
    """Text with dark stroke + soft drop shadow so it reads on any background."""
    if not on_video and not S.PANEL_STROKE:     # light panels: clean ink, no outline
        stroke, shadow = 0, False
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((xy[0] + 3, xy[1] + 5), txt, font=f, fill=(0, 0, 0, 150),
                                anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0, 150))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    ImageDraw.Draw(img).text(xy, txt, font=f, fill=fill + (255,) if len(fill) == 3 else fill,
                             anchor=anchor, stroke_width=stroke, stroke_fill=S.STROKE + (255,))


def panel(w, h, radius=34, fill=None, accent=None, accent_h=8):
    fill = fill or S.PANEL
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=fill)
    if accent:
        d.rounded_rectangle((w * 0.3, h - accent_h, w * 0.7, h - 1), radius=accent_h // 2,
                            fill=S.color(accent) + (255,))
    return img


def with_shadow(img, blur=18, alpha=120, pad=30):
    out = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    a = img.getchannel("A").point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 255))
    sh.putalpha(a)
    out.alpha_composite(sh, (pad, pad + 8))
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(img, (pad, pad))
    return out


# ---------------------------------------------------------------- icons ----
def icon(kind: str, size: int, col=None) -> Image.Image:
    """Simple flat vector icons; no external assets needed."""
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S.color(col) + (255,) if col else None
    lw = max(4, s // 10)
    if kind == "check":
        d.ellipse((0, 0, s - 1, s - 1), fill=c or S.COLORS["green"] + (255,))
        d.line([(s * .27, s * .52), (s * .44, s * .69), (s * .75, s * .33)], fill=(255, 255, 255, 255),
               width=lw, joint="curve")
    elif kind == "cross":
        d.ellipse((0, 0, s - 1, s - 1), fill=c or S.COLORS["red"] + (255,))
        d.line([(s * .32, s * .32), (s * .68, s * .68)], fill=(255, 255, 255, 255), width=lw)
        d.line([(s * .68, s * .32), (s * .32, s * .68)], fill=(255, 255, 255, 255), width=lw)
    elif kind == "warn":
        d.polygon([(s / 2, s * .04), (s * .98, s * .92), (s * .02, s * .92)], fill=c or S.COLORS["yellow"] + (255,))
        d.rounded_rectangle((s * .45, s * .32, s * .55, s * .66), radius=lw // 2, fill=(20, 20, 20, 255))
        d.ellipse((s * .44, s * .72, s * .56, s * .84), fill=(20, 20, 20, 255))
    elif kind == "info":
        d.ellipse((0, 0, s - 1, s - 1), fill=c or S.COLORS["cyan"] + (255,))
        d.ellipse((s * .44, s * .2, s * .56, s * .32), fill=(15, 23, 42, 255))
        d.rounded_rectangle((s * .44, s * .4, s * .56, s * .8), radius=lw // 2, fill=(15, 23, 42, 255))
    elif kind == "chat":
        col_ = c or S.COLORS["cyan"] + (255,)
        d.rounded_rectangle((0, s * .05, s - 1, s * .75), radius=s // 5, fill=col_)
        d.polygon([(s * .22, s * .7), (s * .45, s * .7), (s * .18, s * .98)], fill=col_)
        for i in range(3):
            cx = s * (.3 + .2 * i)
            d.ellipse((cx - s * .06, s * .34, cx + s * .06, s * .46), fill=(255, 255, 255, 255))
    elif kind == "dot":
        d.ellipse((s * .1, s * .1, s * .9, s * .9), fill=c or S.COLORS["green"] + (255,))
    elif kind == "arrow":
        col_ = c or (255, 255, 255, 255)
        d.rectangle((s * .05, s * .42, s * .62, s * .58), fill=col_)
        d.polygon([(s * .55, s * .2), (s * .98, s * .5), (s * .55, s * .8)], fill=col_)
    elif kind == "arrow_down":
        return icon("arrow", s, col).rotate(-90)
    return img


# ------------------------------------------------------------- elements ----
class Element:
    kind = "base"

    def __init__(self, spec: dict):
        self.spec = spec
        self.start = float(spec["start"])
        self.end = float(spec["end"])
        self.anim = spec.get("anim", "pop")
        self.cy = float(spec.get("y", S.HEADLINE_CENTER))   # vertical centre, fraction of H
        # states: list of (time, key); key is passed to build()
        self.states = [(self.start, 0)]
        self._cache = {}

    def build(self, key) -> Image.Image:
        raise NotImplementedError

    def sprite(self, key):
        if key not in self._cache:
            img = self.build(key)
            if S.WRAP_TITLES and self.kind in ("split", "steps"):
                bg = panel(img.width + 60, img.height + 60, accent=self.spec.get("accent"))
                bg.alpha_composite(img, (30, 30))
                img = bg
            self._cache[key] = with_shadow(img)
        return self._cache[key]

    def change_times(self):
        return [t for t, _ in self.states]

    def bbox(self):
        """Bounding box of the largest state, for safe-zone checks."""
        sp = self.sprite(self.states[-1][1])
        x = (S.W - sp.width) // 2
        y = int(S.H * self.cy - sp.height / 2)
        return x + 30, y + 30, x + sp.width - 30, y + sp.height - 30

    def frame(self, t):
        """-> list of (sprite, x, y, alpha 0..1, scale)"""
        if not (self.start <= t < self.end):
            return []
        p = min(1.0, (t - self.start) / INTRO)
        q = min(1.0, (self.end - t) / OUTRO)
        e = 1 - (1 - p) ** 3
        alpha = e * min(1.0, q * 1.2)
        scale, dy = 1.0, 0
        if self.anim == "pop":
            scale = 0.9 + 0.1 * e + 0.02 * math.sin(math.pi * p) if p < 1 else 1.0
        elif self.anim == "slide":
            dy = int((1 - e) * 40)
        idx = 0
        for i, (st, _) in enumerate(self.states):
            if t >= st:
                idx = i
        out = []
        cur = self.sprite(self.states[idx][1])
        k = 1.0
        if idx > 0:
            k = min(1.0, (t - self.states[idx][0]) / XFADE)
            if k < 1:
                prev = self.sprite(self.states[idx - 1][1])
                out.append(self._place(prev, alpha * (1 - k), scale, dy))
        out.append(self._place(cur, alpha * k if idx > 0 else alpha, scale, dy))
        return out

    def _place(self, sp, alpha, scale, dy):
        w, h = sp.width, sp.height
        x = (S.W - w * scale) / 2
        y = S.H * self.cy - h * scale / 2 + dy
        return sp, int(x), int(y), alpha, scale


def _reveal_states(el, n_items):
    reveal = el.spec.get("reveal")
    if reveal:
        el.states = [(el.start, 0)] + [(float(t), i + 1) for i, t in enumerate(reveal[:n_items])]
    else:
        el.states = [(el.start, n_items)]


class Headline(Element):
    """Big 2-7 word headline, optional sub line and icon."""
    kind = "headline"

    def build(self, key):
        sp = self.spec
        maxw = S.W - 2 * S.SIDE_MARGIN - 80
        size = int(sp.get("size", 104))
        ic = sp.get("icon")
        f, lines = fit(U(sp["text"]), S.FONT_BLACK, maxw - (int(size * 0.9) + 20 if ic else 0), size, 56)
        col = S.color(sp.get("color", "white"))
        sub = sp.get("sub")
        fs, slines = (fit(sub, S.FONT_BOLD, maxw, 50, 32) if sub else (None, []))
        ic_s = int(f.size * 0.9) if ic else 0
        lh = line_h(f)
        kicker = sp.get("kicker")
        fk = font(S.FONT_KICKER, 38) if kicker else None
        kh = line_h(fk) + 8 if kicker else 0
        kt = " ".join(kicker.upper()) if kicker else ""      # letter-spaced label
        w = max([text_w(l, f) for l in lines] + [text_w(l, fs) for l in slines] + [text_w(kt, fk) if kicker else 0]) + 90
        w = max(w + (ic_s + 24 if ic else 0), 360)
        h = kh + lh * len(lines) + (line_h(fs) * len(slines) + 14 if sub else 0) + 70
        img = panel(w, h, accent=sp.get("accent", sp.get("color") if sp.get("color") not in (None, "white") else "cyan")) \
            if sp.get("panel", True) else Image.new("RGBA", (w, h), (0, 0, 0, 0))
        y = 30
        if kicker:
            draw_text(img, ((w - text_w(kt, fk)) // 2, y), kt, fk,
                      S.color(sp.get("kicker_color", sp.get("accent", "red"))), stroke=3)
            y += kh
        for l in lines:
            lw = text_w(l, f)
            x = (w - lw - (ic_s + 20 if ic else 0)) // 2
            if ic and l is lines[0]:
                img.alpha_composite(icon(ic, ic_s, sp.get("icon_color")), (x, y + (lh - ic_s) // 2))
                x += ic_s + 20
            draw_text(img, (x, y), l, f, col, stroke=5)
            y += lh
        if sub:
            y += 6
            for l in slines:
                draw_text(img, ((w - text_w(l, fs)) // 2, y), l, fs, S.color(sp.get("sub_color", "white")), stroke=4)
                y += line_h(fs)
        return img


class Keyword(Headline):
    """Smaller label/pill: GIAI ĐOẠN SỚM, CHÂN YẾU, ..."""
    kind = "keyword"

    def build(self, key):
        sp = dict(self.spec)
        sp.setdefault("size", 76)
        sp.setdefault("accent", sp.get("color", "cyan"))
        self_spec, self.spec = self.spec, sp
        try:
            return super().build(key)
        finally:
            self.spec = self_spec


class Warning(Headline):
    kind = "warning"

    def build(self, key):
        sp = dict(self.spec)
        sp.setdefault("color", "yellow")
        sp.setdefault("icon", "warn")
        sp.setdefault("accent", "yellow")
        sp.setdefault("size", 120)
        self_spec, self.spec = self.spec, sp
        try:
            return super().build(key)
        finally:
            self.spec = self_spec


class CTA(Headline):
    kind = "cta"

    def build(self, key):
        sp = dict(self.spec)
        sp.setdefault("icon", "chat")
        sp.setdefault("accent", "cyan")
        sp.setdefault("size", 88)
        sp.setdefault("sub_color", "cyan")
        self_spec, self.spec = self.spec, sp
        try:
            return super().build(key)
        finally:
            self.spec = self_spec


class Split(Element):
    """Two-column comparison, e.g. 🟢 CHƯA TÊ vs 🔴 ĐÃ TÊ."""
    kind = "split"

    def __init__(self, spec):
        super().__init__(spec)
        _reveal_states(self, 2)

    def build(self, n):
        sp = self.spec
        colw = (S.W - 2 * S.SIDE_MARGIN - 40) // 2
        title = sp.get("title")
        ft = fit(U(title), S.FONT_BLACK, S.W - 2 * S.SIDE_MARGIN - 60, 84, 40, 1)[0] if title else None
        sides = [sp["left"], sp["right"]]
        fsz = min(fit(U(s["text"]), S.FONT_XBOLD, colw - 110, 64, 36)[0].size for s in sides)
        fi = font(S.FONT_XBOLD, fsz)
        subs = [s.get("sub") for s in sides]
        fsub = font(S.FONT_BOLD, 38)
        n_main = max(len(wrap(U(sd["text"]), fi, colw - 60, 2) or [1]) for sd in sides)
        n_sub = max([len(wrap(sd["sub"], fsub, colw - 40, 2) or []) for sd in sides if sd.get("sub")] or [0])
        card_h = int(fi.size * 0.7) + 6 + line_h(fi) * n_main + line_h(fsub) * n_sub + 52
        top = (line_h(ft) + 24) if title else 0
        w, h = S.W - 2 * S.SIDE_MARGIN, top + card_h + 20
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        if title:
            draw_text(img, ((w - text_w(U(title), ft)) // 2, 0), U(title), ft,
                      S.color(sp.get("title_color", "white")), stroke=5)
        for i, s in enumerate(sides):
            x0 = i * (colw + 40)
            c = S.color(s.get("color", "green" if i == 0 else "red"))
            on = i < n
            card = panel(colw, card_h, radius=30, fill=S.PANEL if on else S.PANEL_DIM)
            d = ImageDraw.Draw(card)
            d.rounded_rectangle((0, 0, colw - 1, card_h - 1), radius=30, outline=c + ((255,) if on else (70,)), width=5)
            if on:
                ds = int(fi.size * 0.7)
                lines = wrap(U(s["text"]), fi, colw - 60, 2) or [U(s["text"])]
                y = 22
                card.alpha_composite(icon("dot", ds, c), ((colw - ds) // 2, y))
                y += ds + 6
                for l in lines:
                    draw_text(card, ((colw - text_w(l, fi)) // 2, y), l, fi, c, stroke=4, shadow=False)
                    y += line_h(fi)
                if s.get("sub"):
                    for l in wrap(s["sub"], fsub, colw - 40, 2) or []:
                        draw_text(card, ((colw - text_w(l, fsub)) // 2, y), l, fsub, S.INK, stroke=3, shadow=False)
                        y += line_h(fsub)
            img.alpha_composite(card, (x0, top))
        if sp.get("vs", True):
            fv = font(S.FONT_BLACK, 44)
            cx, cy = w // 2, top + card_h // 2
            ImageDraw.Draw(img).ellipse((cx - 38, cy - 38, cx + 38, cy + 38), fill=(15, 23, 42, 255), outline=(255, 255, 255, 255), width=3)
            draw_text(img, (cx, cy), "VS", fv, (255, 255, 255), stroke=0, shadow=False, anchor="mm")
        return img


class Checklist(Element):
    """Title + items revealed one by one (signs, symptoms, tips)."""
    kind = "checklist"

    def __init__(self, spec):
        super().__init__(spec)
        _reveal_states(self, len(spec["items"]))

    def build(self, n):
        sp = self.spec
        w = S.W - 2 * S.SIDE_MARGIN
        title = sp.get("title")
        ft = fit(U(title), S.FONT_BLACK, w - 80, 72, 40, 1)[0] if title else None
        fi = font(S.FONT_XBOLD, int(sp.get("size", 54)))
        mark = sp.get("mark", "check")
        items = sp["items"]
        rows = [wrap(it, fi, w - 170, 2) or [it] for it in items]
        h = 40 + (line_h(ft) + 16 if title else 0) + sum(len(r) * line_h(fi) + 22 for r in rows) + 10
        img = panel(w, h, accent=sp.get("accent", "cyan"))
        y = 28
        if title:
            draw_text(img, ((w - text_w(U(title), ft)) // 2, y), U(title), ft,
                      S.color(sp.get("title_color", "white")), stroke=4)
            y += line_h(ft) + 16
        ic_s = int(fi.size * 1.0)
        for i, lines in enumerate(rows):
            on = i < n
            col = S.color(sp.get("color", "white")) if on else S.COLORS["dim"]
            if on:
                img.alpha_composite(icon(mark, ic_s, sp.get("mark_color")), (50, y + (line_h(fi) - ic_s) // 2))
            else:
                ImageDraw.Draw(img).ellipse((50, y + (line_h(fi) - ic_s) // 2, 50 + ic_s, y + (line_h(fi) + ic_s) // 2),
                                            outline=S.COLORS["dim"] + (160,), width=4)
            for l in lines:
                t_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
                draw_text(t_img, (50 + ic_s + 28, y), l, fi, col, stroke=4, shadow=False)
                if not on:
                    t_img.putalpha(t_img.getchannel("A").point(lambda v: v * 45 // 100))
                img.alpha_composite(t_img)
                y += line_h(fi)
            y += 22
        return img


class Steps(Element):
    """01 / 02 / 03 stages, the active one highlighted as the speaker goes."""
    kind = "steps"

    def __init__(self, spec):
        super().__init__(spec)
        act = spec.get("active")
        if act:
            self.states = [(self.start, -1)] + [(float(t), int(i)) for t, i in act]
        else:
            self.states = [(self.start, -1)]

    def build(self, active):
        sp = self.spec
        items = sp["items"]
        n = len(items)
        w = S.W - 2 * S.SIDE_MARGIN
        title = sp.get("title")
        ft = fit(U(title), S.FONT_BLACK, w - 60, 70, 40, 1)[0] if title else None
        gap = 22
        cw = (w - gap * (n - 1)) // n
        fn = font(S.FONT_BLACK, 84 if n <= 3 else 64)
        fl = min(fit(U(it), S.FONT_XBOLD, cw - 30, 40, 30, 3)[0].size for it in items)
        fl = font(S.FONT_XBOLD, fl)
        nl = max(len(wrap(U(it), fl, cw - 24, 3) or [1]) for it in items)
        ch = line_h(fn) + line_h(fl) * nl + 40
        top = line_h(ft) + 20 if title else 0
        img = Image.new("RGBA", (w, top + ch), (0, 0, 0, 0))
        if title:
            draw_text(img, ((w - text_w(U(title), ft)) // 2, 0), U(title), ft, S.INK, stroke=5)
        acc = S.color(sp.get("color", "cyan"))
        for i, it in enumerate(items):
            on = i == active
            done = active >= 0 and i < active
            c = acc if on else (S.INK if done or active < 0 else S.COLORS["dim"])
            card = panel(cw, ch, radius=26, fill=(acc + (60,)) if on else S.PANEL)
            ImageDraw.Draw(card).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=26,
                                                   outline=c + ((255,) if on else (90,)), width=6 if on else 3)
            num = f"{i + 1:02d}"
            draw_text(card, ((cw - text_w(num, fn)) // 2, 14), num, fn, c, stroke=4, shadow=False)
            y = 14 + line_h(fn)
            for l in wrap(U(it), fl, cw - 24, 3) or [U(it)]:
                draw_text(card, ((cw - text_w(l, fl)) // 2, y), l, fl, c, stroke=3, shadow=False)
                y += line_h(fl)
            img.alpha_composite(card, (i * (cw + gap), top))
        return img


class Flow(Element):
    """A → B → C cause/effect chain, e.g. BÓP → NƯỚC THẤM SÂU."""
    kind = "flow"

    def __init__(self, spec):
        super().__init__(spec)
        _reveal_states(self, len(spec["items"]))

    def build(self, n):
        sp = self.spec
        items = [U(it) for it in sp["items"]]
        cols = sp.get("colors") or []
        w = S.W - 2 * S.SIDE_MARGIN
        f = font(S.FONT_BLACK, int(sp.get("size", 70)))
        horizontal = sum(text_w(it, f) for it in items) + 110 * (len(items) - 1) <= w - 60
        if not horizontal:
            f = min((fit(it, S.FONT_BLACK, w - 100, int(sp.get("size", 70)), 40)[0] for it in items), key=lambda x: x.size)
        lh = line_h(f)
        a_s = int(lh * 0.8)
        if horizontal:
            h = lh + 70
        else:
            h = len(items) * (lh + 20) + (len(items) - 1) * (a_s + 10) + 50
        img = panel(w, h, accent=sp.get("accent", "cyan"))
        if horizontal:
            total = sum(text_w(it, f) for it in items) + (a_s + 40) * (len(items) - 1)
            x, y = (w - total) // 2, 35
            for i, it in enumerate(items):
                c = S.color(cols[i] if i < len(cols) else "white")
                show = i < n
                if show:
                    draw_text(img, (x, y), it, f, c, stroke=5, shadow=False)
                x += text_w(it, f) + 20
                if i < len(items) - 1:
                    if i + 1 < n:
                        img.alpha_composite(icon("arrow", a_s, "yellow"), (x, y + (lh - a_s) // 2))
                    x += a_s + 20
        else:
            y = 25
            for i, it in enumerate(items):
                c = S.color(cols[i] if i < len(cols) else "white")
                if i < n:
                    draw_text(img, ((w - text_w(it, f)) // 2, y), it, f, c, stroke=5, shadow=False)
                y += lh + 20
                if i < len(items) - 1:
                    if i + 1 < n:
                        img.alpha_composite(icon("arrow_down", a_s, "yellow"), ((w - a_s) // 2, y))
                    y += a_s + 10
        return img


class Spine(Element):
    """Minimal spine diagram: vertebrae + discs, one disc under pressure."""
    kind = "spine"

    def __init__(self, spec):
        super().__init__(spec)
        self.states = [(self.start, 0)] + ([(float(spec["highlight_at"]), 1)] if spec.get("highlight_at") else [])
        if not spec.get("highlight_at"):
            self.states = [(self.start, 1)]

    def build(self, on):
        sp = self.spec
        w, h = S.W - 2 * S.SIDE_MARGIN, int(sp.get("height", 470))
        img = panel(w, h, accent=sp.get("accent", "red"))
        d = ImageDraw.Draw(img)
        n = 5
        vx0, vx1 = w * 0.30, w * 0.62
        vh = (h - 90) / (n + (n - 1) * 0.35)
        dh = vh * 0.35
        hi = int(sp.get("disc", 2))
        y = 45
        for i in range(n):
            d.rounded_rectangle((vx0, y, vx1, y + vh), radius=int(vh * 0.3), fill=(226, 232, 240, 255),
                                outline=(148, 163, 184, 255), width=3)
            d.polygon([(vx1, y + vh * .2), (vx1 + w * .09, y + vh * .5), (vx1, y + vh * .8)], fill=(203, 213, 225, 255))
            y += vh
            if i < n - 1:
                pressed = on and i == hi
                col = S.COLORS["red"] if pressed else S.COLORS["cyan"]
                bulge = w * 0.05 if pressed else 0
                d.rounded_rectangle((vx0 - bulge, y + dh * .12, vx1 + bulge * 0.4, y + dh * .88),
                                    radius=int(dh * .4), fill=col + (255,))
                if pressed:
                    ay = y + dh / 2
                    a = int(max(dh * 2.2, w * 0.12))
                    img.alpha_composite(icon("arrow", a, "red"), (int(vx0 - bulge - a - 18), int(ay - a / 2)))
                    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
                    ImageDraw.Draw(glow).ellipse((vx0 - bulge - 30, y - 30, vx1 + 30, y + dh + 30), fill=S.COLORS["red"] + (90,))
                    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
                    d = ImageDraw.Draw(img)
                y += dh
        label = sp.get("label")
        if label and on:
            fl, lines = fit(U(label), S.FONT_BLACK, int(w * 0.30), 52, 30, 3)
            ly = h // 2 - len(lines) * line_h(fl) // 2
            for l in lines:
                draw_text(img, (int(w * 0.70), ly), l, fl, S.color(sp.get("color", "red")), stroke=4, shadow=False)
                ly += line_h(fl)
        return img


class ImageOverlay(Element):
    """A user-supplied PNG/JPG graphic (diagram, product shot...)."""
    kind = "image"

    def build(self, key):
        sp = self.spec
        im = Image.open(sp["path"]).convert("RGBA")
        maxw = int(sp.get("width", S.W - 2 * S.SIDE_MARGIN))
        maxh = int(sp.get("height", S.H * 0.26))
        im.thumbnail((maxw, maxh), Image.LANCZOS)
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=28, fill=255)
        a = Image.composite(im.getchannel("A"), mask, mask)
        im.putalpha(a)
        return im


ELEMENTS = {c.kind: c for c in (Headline, Keyword, Warning, CTA, Split, Checklist, Steps, Flow, Spine, ImageOverlay)}


def make(spec: dict) -> Element | None:
    cls = ELEMENTS.get(spec["type"])
    return cls(spec) if cls else None


# ------------------------------------------------------------ subtitles ----
class SubtitleRenderer:
    """White bold sans subtitles, max 2 lines, keyword highlights only."""

    def __init__(self, highlights: dict | None = None, size=60):
        self.f = font(S.FONT_XBOLD, size)
        self.hl = {k.lower(): S.color(v) for k, v in (highlights or {}).items()}
        self._cache = {}

    def _color_for(self, word, text_lower):
        w = word.lower().strip(".,!?;:…\"'()")
        for k, c in self.hl.items():
            if " " not in k and w == k:
                return c
        return None

    def sprite(self, text: str):
        if text in self._cache:
            return self._cache[text]
        f = self.f
        maxw = S.W - 2 * S.SIDE_MARGIN - 60
        lines = wrap(text, f, maxw, 2)
        ff = f
        s = f.size
        while lines is None and s > 40:
            s -= 4
            ff = font(S.FONT_XBOLD, s)
            lines = wrap(text, ff, maxw, 2)
        lines = lines or [text]
        lh = line_h(ff)
        w = max(text_w(l, ff) for l in lines) + 40
        h = lh * len(lines) + 20
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        # phrase highlights (multi-word keys) are matched on the whole cue
        low = text.lower()
        phrase_words = set()
        for k, c in self.hl.items():
            if " " in k and k in low:
                for pw in k.split():
                    phrase_words.add((pw, c))
        y = 10
        space = text_w(" ", ff)
        for l in lines:
            x = (w - text_w(l, ff)) // 2
            for word in l.split():
                wl = word.lower().strip(".,!?;:…\"'()")
                c = next((pc for pw, pc in phrase_words if wl == pw), None) or self._color_for(word, low)
                draw_text(img, (x, y), word, ff, c or (255, 255, 255), stroke=6, on_video=True)
                x += text_w(word, ff) + space
            y += lh
        self._cache[text] = img
        return img

    def place(self, text):
        sp = self.sprite(text)
        x = (S.W - sp.width) // 2
        y = int(S.H * S.SUBTITLE_CENTER - sp.height / 2)
        return sp, x, y
