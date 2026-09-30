#!/usr/bin/env python3
"""Render a talking-head explainer from source video + transcript + EDL.

    python editor/render.py projects/<name>            # final render
    python editor/render.py projects/<name> --draft    # fast low-quality check

Reads   <project>/edl.json, <project>/transcript.json
Writes  <project>/out/final.mp4, preview.jpg, report.md
"""
from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
import graphics as G  # noqa: E402
import sfx as SFX  # noqa: E402
import style as S  # noqa: E402
from timeline import Timeline, keep_segments, subtitle_cues  # noqa: E402

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:  # pragma: no cover
    FFMPEG = "ffmpeg"


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{' '.join(map(str, cmd))}\n{r.stderr[-3000:]}")
    return r


def probe(path):
    r = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    err = r.stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    size = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", err)
    rot = re.search(r"rotate\s*:\s*(-?\d+)|rotation of (-?[\d.]+)", err)
    if not dur or not size:
        sys.exit(f"cannot probe {path}:\n{err[-1500:]}")
    d = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3])
    w, h = int(size[1]), int(size[2])
    if rot and abs(int(float(rot[1] or rot[2]))) % 180 == 90:
        w, h = h, w
    return d, w, h, "Audio:" in err


def snap(t):
    return round(t * S.FPS) / S.FPS


# ------------------------------------------------------------------ audio --
def load_audio(src, dur):
    r = subprocess.run([FFMPEG, "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", str(SFX.SR),
                        "-f", "f32le", "-"], capture_output=True)
    x = np.frombuffer(r.stdout, dtype=np.float32)
    n = int(dur * SFX.SR)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def cut_audio(x, segs):
    fade = int(0.008 * SFX.SR)
    parts = []
    for s, e in segs:
        seg = x[int(round(s * SFX.SR)):int(round(e * SFX.SR))].copy()
        if len(seg) > 2 * fade:
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
        parts.append(seg)
    return np.concatenate(parts) if parts else x


def mix_audio(work: Path, voice_wav, sfx_wav, cfg, duration, root: Path):
    out = work / "mix.wav"
    inputs = ["-i", str(voice_wav), "-i", str(sfx_wav)]
    voice = ["highpass=f=75"]
    if cfg.get("denoise", True):
        voice.append("afftdn=nr=10:nf=-45")
    if cfg.get("leveler"):
        # lift soft phrases (sentence endings that trail off) and keep the voice even
        voice.append("acompressor=threshold=-26dB:ratio=4:attack=5:release=150:makeup=4")
        voice.append("dynaudnorm=f=200:g=11:p=0.9:m=8")
    else:
        voice.append("acompressor=threshold=-20dB:ratio=3:attack=8:release=180:makeup=2")
    voice.append("aresample=48000")
    fc = f"[0:a]{','.join(voice)},asplit=2[v][vsc];[1:a]aresample=48000[fx];"
    music = cfg.get("music")
    lufs = float(cfg.get("loudness", -14))
    if music:
        mpath = (root / music) if not Path(music).is_absolute() else Path(music)
        inputs += ["-stream_loop", "-1", "-i", str(mpath)]
        m_lufs = max(-70.0, lufs + float(cfg.get("music_db", -28)))
        fc += (f"[2:a]aresample=48000,ac=1,atrim=0:{duration:.3f},loudnorm=I={m_lufs}:TP=-2,"
               f"afade=t=in:d=1,afade=t=out:st={max(0, duration - 1.5):.3f}:d=1.5[m0];"
               f"[m0][vsc]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=400[m];"
               f"[v][fx][m]amix=inputs=3:normalize=0:duration=first,")
    else:
        fc += "[vsc]anullsink;[v][fx]amix=inputs=2:normalize=0:duration=first,"
    fc += (f"loudnorm=I={lufs}:TP=-1.0:LRA=9,volume={float(cfg.get('gain_db', 0))}dB,"
           f"alimiter=limit=0.89:level=false,aresample=48000[out]")
    run([FFMPEG, "-y", "-v", "error", *inputs, "-filter_complex", fc, "-map", "[out]",
         "-t", f"{duration:.3f}", "-ac", "2", "-ar", "48000", str(out)])
    return out


# ------------------------------------------------------------------- lint --
def texts_of(spec):
    out = [spec.get(k) for k in ("text", "sub", "title", "label")]
    out += list(spec.get("items") or [])
    for side in ("left", "right"):
        if isinstance(spec.get(side), dict):
            out += [spec[side].get("text"), spec[side].get("sub")]
    return [t for t in out if t]


def lint(edl, elements, cues, zooms, transcript, tl, subs):
    warn, err = [], []
    for sp, el in elements:
        for t in texts_of(sp):
            for bad in S.HEALTH_BANNED:
                if bad in t.lower():
                    err.append(f"Health claim '{bad}' in on-screen text “{t}” (rule 16) — rephrase (hỗ trợ / góp phần).")
        if sp["type"] in ("headline", "keyword", "warning"):
            n = len(sp["text"].split())
            if not 1 <= n <= 7:
                warn.append(f"Headline “{sp['text']}” has {n} words (want 2–7).")
        if sp["type"] == "cta" and not 2 <= el.end - el.start <= 6:
            warn.append(f"CTA shown {el.end - el.start:.1f}s (want 2–5s).")
        if el:
            x0, y0, x1, y1 = el.bbox()
            if y0 < S.H * S.HEADLINE_ZONE[0] - 2 or y1 > S.H * S.HEADLINE_ZONE[1] + 2:
                warn.append(f"{sp['type']} “{texts_of(sp)[:1]}” spans {y0 / S.H:.0%}–{y1 / S.H:.0%} of height "
                            f"(zone {S.HEADLINE_ZONE[0]:.0%}–{S.HEADLINE_ZONE[1]:.0%}); set \"y\" or shorten.")
    spoken = " ".join(s["text"] for s in transcript["segments"]).lower()
    for bad in S.HEALTH_BANNED:
        if bad in spoken:
            warn.append(f"Speaker says '{bad}' — not added to graphics; consider cutting or softening (rule 16).")
    for a in range(len(elements)):
        for b in range(a + 1, len(elements)):
            ea, eb = elements[a][1], elements[b][1]
            if ea and eb and ea.start < eb.end - 0.25 and eb.start < ea.end - 0.25 and ea.cy == eb.cy:
                warn.append(f"Overlays overlap at {max(ea.start, eb.start):.1f}s: {ea.kind} + {eb.kind}.")
    # pacing: a visual change every 2-5 s (rule 6)
    changes = sorted({0.0, tl.duration} | {t for _, el in elements if el for t in el.change_times()}
                     | {z[0] for z in zooms} | {el.end for _, el in elements if el})
    for a, b in zip(changes, changes[1:]):
        if b - a > 6.0:
            warn.append(f"No visual change {a:.1f}s–{b:.1f}s ({b - a:.1f}s) — add keyword/zoom (rule 6).")
    # colours on screen at once (section 7)
    for t in np.arange(0, tl.duration, 0.5):
        cols = set()
        for sp, el in elements:
            if el and el.start <= t < el.end:
                cols |= {str(sp.get(k)) for k in ("color", "accent") if sp.get(k)}
                for side in ("left", "right"):
                    if isinstance(sp.get(side), dict) and sp[side].get("color"):
                        cols.add(sp[side]["color"])
        cols.discard("white")
        if len(cols) > 3:
            warn.append(f"{len(cols)} accent colours on screen at {t:.1f}s: {sorted(cols)} (max 2–3).")
            break
    for c0, c1, txt in cues:
        sp, x, y = subs.place(txt)
        if y < S.H * S.SUBTITLE_ZONE[0] or y + sp.height > S.H * S.SUBTITLE_ZONE[1]:
            warn.append(f"Subtitle outside 62–82% band at {c0:.1f}s: “{txt}”.")
        n = len(txt.split())
        if n > 12:
            warn.append(f"Subtitle too long ({n} words) at {c0:.1f}s.")
    return warn, err


# ----------------------------------------------------------------- render --
def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def zoom_at(t, zooms):
    z = 1.0
    for s, e, to, r in zooms:
        if s <= t < e:
            k = min(ease((t - s) / r), ease((e - t) / r)) if r > 0 else 1.0
            z = max(z, 1 + (to - 1) * k)
    return z


def guides(img):
    d = ImageDraw.Draw(img, "RGBA")
    for (a, b), c in ((S.HEADLINE_ZONE, (34, 211, 238, 40)), (S.SUBTITLE_ZONE, (250, 204, 21, 40))):
        d.rectangle((0, a * S.H, S.W, b * S.H), outline=c[:3] + (200,), width=4)
    d.rectangle(S.RIGHT_RAIL, fill=(239, 68, 68, 50))
    d.rectangle(S.BOTTOM_LEFT, fill=(239, 68, 68, 50))
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--draft", action="store_true", help="fast encode for checking")
    ap.add_argument("--force", action="store_true", help="render despite lint errors")
    ap.add_argument("--limit", type=float, help="render only the first N output seconds")
    a = ap.parse_args()

    root = Path(a.project)
    edl = json.loads((root / "edl.json").read_text())
    S.apply_theme(edl.get("theme"))
    transcript = json.loads((root / edl.get("transcript", "transcript.json")).read_text())
    src = root / edl["source"]
    out_dir = root / "out"
    work = root / "work"
    out_dir.mkdir(exist_ok=True)
    work.mkdir(exist_ok=True)

    dur, sw, sh, has_audio = probe(src)
    segs = [(snap(s), snap(e)) for s, e in keep_segments(transcript, edl.get("cuts", {}), dur)]
    segs = [(s, e) for s, e in segs if e > s]
    tl = Timeline(segs)
    T = min(tl.duration, a.limit) if a.limit else tl.duration
    nframes = int(round(T * S.FPS))
    print(f"source {dur:.1f}s {sw}x{sh} → {len(segs)} kept segments, output {tl.duration:.1f}s")

    # overlays, mapped to output time
    elements = []
    for sp in edl.get("overlays", []):
        m = dict(sp)
        m["start"], m["end"] = tl.map(sp["start"]), tl.map(sp["end"])
        if sp.get("reveal"):
            m["reveal"] = [tl.map(t) for t in sp["reveal"]]
        if sp.get("active"):
            m["active"] = [[tl.map(t), i] for t, i in sp["active"]]
        if sp.get("highlight_at"):
            m["highlight_at"] = tl.map(sp["highlight_at"])
        if m.get("path"):
            m["path"] = str(root / m["path"])
        elements.append((m, G.make(m) if m["type"] != "broll" else None))

    zooms = [(tl.map(z["start"]), tl.map(z["end"]), float(z.get("to", 1.06)), float(z.get("ramp", 0.35)))
             for z in edl.get("zooms", [])]
    for m, el in elements:     # "zoom": 1.06 on an overlay = punch-in while it shows
        if m.get("zoom"):
            zooms.append((m["start"], m["end"], float(m["zoom"]), 0.3))

    if edl.get("graphics_zone"):          # per-video override of the headline band
        S.HEADLINE_ZONE = tuple(edl["graphics_zone"])
    sub_cfg = edl.get("subtitles", {})
    if sub_cfg.get("y"):
        S.SUBTITLE_CENTER = float(sub_cfg["y"])
        S.SUBTITLE_ZONE = (S.SUBTITLE_CENTER - 0.09, S.SUBTITLE_CENTER + 0.09)
    subs = G.SubtitleRenderer(sub_cfg.get("highlight"), int(sub_cfg.get("size", 60)))
    cues = subtitle_cues(transcript, tl, sub_cfg) if sub_cfg.get("enabled", True) else []

    warn, err = lint(edl, elements, cues, zooms, transcript, tl, subs)
    report = [f"# Render report — {root.name}", "",
              f"- Source: {dur:.1f}s {sw}x{sh}; output {tl.duration:.1f}s ({dur - tl.duration:.1f}s removed by jump cuts, {len(segs)} segments)",
              f"- Overlays: {len(elements)}, zooms: {len(zooms)}, subtitle cues: {len(cues)}", ""]
    report += ["## Edit Decision List", "", "| Time | Người nói đang nói gì | Ý chính | Visual |", "|---|---|---|---|"]
    for row in edl.get("edl_table", []):
        report.append(f"| {row.get('time', '')} | {row.get('speech', '')} | {row.get('idea', '')} | {row.get('visual', '')} |")
    report += ["", "## Checks", ""] + [f"- ❌ {e}" for e in err] + [f"- ⚠️ {w}" for w in warn]
    if not err and not warn:
        report.append("- ✅ all checks passed")
    (out_dir / "report.md").write_text("\n".join(report) + "\n")
    for line in err + warn:
        print(("ERROR " if line in err else "warn  ") + line)
    if err and not a.force:
        sys.exit("lint errors — fix the EDL or pass --force (see out/report.md)")

    # ---- audio: cut voice in numpy (sample exact), synth SFX, mix
    voice = cut_audio(load_audio(src, dur), segs) if has_audio else np.zeros(int(tl.duration * SFX.SR), np.float32)
    SFX.write_wav(work / "voice.wav", voice[: int(T * SFX.SR)])
    acfg = edl.get("audio", {})
    events = [(tl.map(e["t"]), e["type"]) for e in edl.get("sfx", [])]
    events += [(m["start"], m["sfx"]) for m, _ in elements if m.get("sfx")]
    SFX.write_wav(work / "sfx.wav", SFX.render_track(events, T, float(acfg.get("sfx_db", -16))))
    mix = mix_audio(work, work / "voice.wav", work / "sfx.wav", acfg, T, root)

    # ---- video pass 1: cut + 9:16 framing, decoded to raw frames
    subj = edl.get("subject", {})
    off = int(float(subj.get("offset_y", 0.0)) * S.H)       # push the speaker down, leave headroom
    sc = float(subj.get("scale", 1.0))
    sharpen = float(subj.get("sharpen", 0))    # 0.5–1.0 helps low-res sources after upscaling
    sel = "+".join(f"between(t,{s:.4f},{e - 0.5 / S.FPS:.4f})" for s, e in segs)
    fw, fh = int(S.W * sc) // 2 * 2, int(S.H * sc) // 2 * 2
    grad = work / "grad.png"
    g = np.zeros((S.H, S.W, 4), np.uint8)
    ramp = np.clip(1 - np.arange(S.H) / (S.H * 0.46), 0, 1) ** 1.6
    g[..., 3] = (ramp * 150 * float(subj.get("top_shade", 1.0)))[:, None].astype(np.uint8)
    Image.fromarray(g, "RGBA").save(grad)
    # erase burned-in text (old captions, watermarks) before framing: boxes in source fractions
    clean = "".join(f",delogo=x={max(1, int(x * sw))}:y={max(1, int(y * sh))}:"
                    f"w={min(int(w * sw), sw - 2 - max(1, int(x * sw)))}:h={min(int(h * sh), sh - 2 - max(1, int(y * sh)))}"
                    for x, y, w, h in subj.get("delogo", []))
    gr = subj.get("grade")     # exposure / colour: {"brightness", "gamma", "contrast", "saturation"}
    grade = (",eq=" + ":".join(f"{k}={v}" for k, v in gr.items())) if gr else ""
    fc = (f"[0:v]fps={S.FPS},select='{sel}',setpts=N/{S.FPS}/TB{clean},split[a][b];"
          f"[a]scale={S.W}:{S.H}:force_original_aspect_ratio=increase,crop={S.W}:{S.H},"
          f"boxblur=40:2,eq=brightness={subj.get('bg_dim', -0.12)}:saturation=0.8[bg];"
          f"[b]{'hqdn3d=1.5:1.5:5:5,' if subj.get('denoise') else ''}"
          f"scale={fw}:{fh}:force_original_aspect_ratio=increase:flags=lanczos,crop={fw}:{fh}"
          f"{grade}{f',unsharp=5:5:{sharpen}' if sharpen else ''}[fg];"
          f"[bg][fg]overlay=x=(W-w)/2:y={off}+(H-h)/2*{1 if sc < 1 else 0}[base];"
          f"[base][1:v]overlay=0:0,format=rgb24[v]")
    (work / "pass1.txt").write_text(fc)
    dec = subprocess.Popen([FFMPEG, "-v", "error", "-i", str(src), "-i", str(grad), "-filter_complex_script",
                            str(work / "pass1.txt"), "-map", "[v]", "-frames:v", str(nframes),
                            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    final = out_dir / ("draft.mp4" if a.draft else "final.mp4")
    enc = subprocess.Popen([FFMPEG, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{S.W}x{S.H}", "-r", str(S.FPS), "-i", "-", "-i", str(mix),
                            "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
                            "-preset", "veryfast" if a.draft else "medium", "-crf", "26" if a.draft else "18",
                            "-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "192k",
                            "-r", str(S.FPS), "-shortest", "-movflags", "+faststart", str(final)],
                           stdin=subprocess.PIPE)

    brolls = [(m, None) for m, el in elements if m["type"] == "broll"]
    broll_iters = {}
    fx, fy = subj.get("focus", [0.5, 0.55])
    fx, fy = fx * S.W, fy * S.H
    alpha_lut = {}
    face_cache = {}
    sample_at = set(np.linspace(0, nframes - 1, 12).astype(int).tolist())
    samples = []
    fsize = S.W * S.H * 3
    last = None
    for i in range(nframes):
        buf = dec.stdout.read(fsize)
        if len(buf) < fsize:
            if last is None:
                sys.exit("decoder produced no frames")
            buf = last                     # pad the final frame if the decoder ran short
        last = buf
        t = i / S.FPS
        frame = Image.frombuffer("RGB", (S.W, S.H), buf, "raw", "RGB", 0, 1)
        z = zoom_at(t, zooms)
        if z > 1.001:
            frame = frame.transform((S.W, S.H), Image.AFFINE, (1 / z, 0, fx - fx / z, 0, 1 / z, fy - fy / z),
                                    resample=Image.BILINEAR)
        else:
            frame = frame.copy()
        face = subj.get("face")
        if face:
            # soft key light + extra detail on the face, following the zoom
            fcx = fx + (face["center"][0] * S.W - fx) * z
            fcy = fy + (face["center"][1] * S.H - fy) * z
            rad = face.get("radius", 0.15) * S.H * z
            key = (round(z, 3), int(fcx) // 4, int(fcy) // 4)
            if face_cache.get("key") != key:
                yy, xx = np.mgrid[0:S.H, 0:S.W].astype(np.float32)
                m = np.exp(-(((xx - fcx) / (rad * 0.85)) ** 2 + ((yy - fcy) / rad) ** 2) / 2)
                face_cache.update(key=key, m=m[..., None],
                                  mask=Image.fromarray((m * 255).astype(np.uint8), "L"),
                                  box=(max(0, int(fcx - 2.2 * rad)), max(0, int(fcy - 2.4 * rad)),
                                       min(S.W, int(fcx + 2.2 * rad)), min(S.H, int(fcy + 2.4 * rad))))
            arr = np.asarray(frame, dtype=np.float32)
            arr = arr * (1 + face.get("light", 0.12) * face_cache["m"])
            frame = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
            if face.get("sharpen"):
                bx = face_cache["box"]
                crop = frame.crop(bx)
                sharp = crop.filter(ImageFilter.UnsharpMask(radius=2, percent=int(face["sharpen"]), threshold=2))
                frame.paste(sharp, bx[:2], face_cache["mask"].crop(bx))
        if subj.get("frost"):
            # frosted-glass band hiding burned-in captions; follows the zoom
            y0, y1 = subj["frost"]
            a0 = int(max(0, fy + (y0 * S.H - fy) * z))
            a1 = int(min(S.H, fy + (y1 * S.H - fy) * z))
            band = frame.crop((0, a0, S.W, a1)).filter(ImageFilter.GaussianBlur(22))
            band = Image.eval(band, lambda v: int(v * 0.5))
            frame.paste(band, (0, a0))
            d = ImageDraw.Draw(frame)
            d.line((0, a0, S.W, a0), fill=(250, 246, 236), width=3)
            d.line((0, a1 - 2, S.W, a1 - 2), fill=(250, 246, 236), width=3)
        for m, _ in brolls:
            if m["start"] <= t < m["end"]:
                it = broll_iters.get(id(m))
                if it is None:
                    gen = imageio_ffmpeg.read_frames(m["path"], output_params=["-r", str(S.FPS)])
                    meta = next(gen)
                    it = broll_iters[id(m)] = (gen, meta["size"])
                try:
                    bb = next(it[0])
                except StopIteration:
                    continue
                bi = Image.frombuffer("RGB", it[1], bb, "raw", "RGB", 0, 1)
                if m.get("mode", "pip") == "cutaway":
                    bi = bi.resize((S.W, int(S.W * bi.height / bi.width))) if bi.width / bi.height < S.W / S.H else \
                        bi.resize((int(S.H * bi.width / bi.height), S.H))
                    frame.paste(bi.crop(((bi.width - S.W) // 2, (bi.height - S.H) // 2,
                                         (bi.width + S.W) // 2, (bi.height + S.H) // 2)), (0, 0))
                else:
                    bw = int(S.W * 0.78)
                    bi = bi.resize((bw, int(bw * bi.height / bi.width)))
                    bi = bi.crop((0, 0, bw, min(bi.height, int(S.H * 0.26))))
                    mask = Image.new("L", bi.size, 0)
                    ImageDraw.Draw(mask).rounded_rectangle((0, 0, bi.width - 1, bi.height - 1), radius=30, fill=255)
                    frame.paste(bi, ((S.W - bw) // 2, int(S.H * m.get("y", S.HEADLINE_CENTER) - bi.height / 2)), mask)
        for m, el in elements:
            if not el:
                continue
            for sp, x, y, al, scl in el.frame(t):
                if al <= 0.01:
                    continue
                if abs(scl - 1) > 0.004:
                    sp = sp.resize((max(1, int(sp.width * scl)), max(1, int(sp.height * scl))), Image.BILINEAR)
                a8 = int(al * 255)
                if a8 < 255:
                    lut = alpha_lut.setdefault(a8, [v * a8 // 255 for v in range(256)])
                    mask = sp.getchannel("A").point(lut)
                else:
                    mask = sp.getchannel("A")
                frame.paste(sp.convert("RGB"), (x, y), mask)
        for c0, c1, txt in cues:
            if c0 <= t < c1:
                sp, x, y = subs.place(txt)
                frame.paste(sp.convert("RGB"), (x, y), sp.getchannel("A"))
                break
        if i in sample_at:
            samples.append(guides(frame.copy()))
        enc.stdin.write(frame.tobytes())
        if i % (S.FPS * 5) == 0:
            print(f"  {t:6.1f}s / {T:.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    dec.stdout.close()
    dec.wait()
    if enc.returncode:
        sys.exit("encoder failed")

    # contact sheet with safe-zone guides
    tw, th = S.W // 4, S.H // 4
    sheet = Image.new("RGB", (tw * 6, th * 2), (0, 0, 0))
    for k, im in enumerate(samples[:12]):
        sheet.paste(im.resize((tw, th)), ((k % 6) * tw, (k // 6) * th))
    sheet.save(out_dir / "preview.jpg", quality=85)
    print(f"done → {final}\n       {out_dir / 'preview.jpg'}\n       {out_dir / 'report.md'}")


if __name__ == "__main__":
    main()
