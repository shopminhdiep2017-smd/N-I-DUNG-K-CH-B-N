"""Jump cuts, source→output time mapping and subtitle cue building.

All times in the EDL are SOURCE times (as printed in transcript.json). The
renderer removes silences/fillers, then maps every EDL time onto the shorter
output timeline with ``Timeline.map``.
"""
from __future__ import annotations

import re

import style as S


def words_of(transcript: dict):
    out = []
    for seg in transcript["segments"]:
        for w in seg.get("words") or []:
            txt = w["word"].strip()
            if txt:
                out.append({"start": float(w["start"]), "end": float(w["end"]), "word": txt})
    return out


def is_filler(word: str, fillers) -> bool:
    return re.sub(r"[^\wÀ-ỹ]", "", word.lower()) in fillers


def keep_segments(transcript: dict, cfg: dict, duration: float):
    """Speech runs to keep. Gaps > max_gap and filler words are removed, but
    each run is padded so speech never sounds clipped (section 11)."""
    if not cfg.get("auto", True):
        segs = [(0.0, duration)]
    else:
        max_gap = float(cfg.get("max_gap", 0.45))
        pad_in = float(cfg.get("pad_in", 0.10))
        pad_out = float(cfg.get("pad_out", 0.16))
        fillers = set(cfg.get("fillers", S.FILLERS))
        words = [w for w in words_of(transcript) if not is_filler(w["word"], fillers)]
        runs = []
        for w in words:
            if runs and w["start"] - runs[-1][1] <= max_gap:
                runs[-1][1] = max(runs[-1][1], w["end"])
            else:
                runs.append([w["start"], w["end"]])
        segs = []
        for s, e in runs:
            s, e = max(0.0, s - pad_in), min(duration, e + pad_out)
            if segs and s <= segs[-1][1] + 0.05:
                segs[-1] = (segs[-1][0], max(segs[-1][1], e))
            else:
                segs.append((s, e))
        if not segs:
            segs = [(0.0, duration)]
    for rs, re_ in cfg.get("remove", []):     # manual removals
        new = []
        for s, e in segs:
            if re_ <= s or rs >= e:
                new.append((s, e))
                continue
            if s < rs:
                new.append((s, rs))
            if re_ < e:
                new.append((re_, e))
        segs = new
    return [(round(s, 3), round(e, 3)) for s, e in segs if e - s >= 0.12]


class Timeline:
    def __init__(self, segs):
        self.segs = segs
        self.offsets = []
        acc = 0.0
        for s, e in segs:
            self.offsets.append(acc)
            acc += e - s
        self.duration = acc

    def map(self, t: float) -> float:
        """Source time → output time (times inside a cut snap to the next kept frame)."""
        for (s, e), off in zip(self.segs, self.offsets):
            if t < s:
                return off
            if t <= e:
                return off + (t - s)
        return self.duration

    def contains(self, t):
        return any(s <= t <= e for s, e in self.segs)


def subtitle_cues(transcript: dict, tl: Timeline, cfg: dict):
    """Group words into 4-10 word semantic chunks (max 2 lines)."""
    overrides = cfg.get("overrides")
    if overrides:
        return [(tl.map(o["start"]), tl.map(o["end"]), o["text"]) for o in overrides]
    max_words = int(cfg.get("max_words", 8))
    min_words = int(cfg.get("min_words", 3))
    fillers = set(cfg.get("fillers", S.FILLERS))
    replace = {k.lower(): v for k, v in (cfg.get("replace") or {}).items()}
    words = [w for w in words_of(transcript)
             if not is_filler(w["word"], fillers) and tl.contains((w["start"] + w["end"]) / 2)]
    cues, cur = [], []

    def flush():
        if cur:
            text = " ".join(w["word"] for w in cur)
            for k, v in replace.items():
                text = re.sub(re.escape(k), v, text, flags=re.I)
            cues.append([tl.map(cur[0]["start"]), tl.map(cur[-1]["end"]), text])
            cur.clear()

    for i, w in enumerate(words):
        if cur and (w["start"] - cur[-1]["end"] > 0.6):
            flush()
        cur.append(w)
        punct = w["word"][-1] in ".?!…" or (w["word"][-1] in ",;:" and len(cur) >= min_words)
        if punct:
            flush()
        elif len(cur) >= max_words:
            # don't strand 1-2 words of a sentence on their own cue
            rest = 0
            for nxt in words[i + 1:i + 3]:
                rest += 1
                if nxt["word"][-1] in ".?!…,;:":
                    break
            else:
                rest = 99
            if rest > 2 or len(cur) >= max_words + 2:
                flush()
    flush()
    # hold each cue until the next one starts (no flicker), cap the hold
    for i in range(len(cues) - 1):
        cues[i][1] = min(max(cues[i][1], cues[i + 1][0] - 0.02), cues[i][1] + 0.6)
    return [tuple(c) for c in cues]
