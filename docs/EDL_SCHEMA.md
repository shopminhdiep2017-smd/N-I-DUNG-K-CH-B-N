# edl.json — Edit Decision List schema

All times are **SOURCE seconds** (exactly as in `transcript.json`). The renderer
removes silences/fillers and remaps every time onto the output timeline, so
never pre-compensate for jump cuts.

```jsonc
{
  "source": "input.mp4",                 // video file, relative to the project folder
  "transcript": "transcript.json",
  "subject": {
    "offset_y": 0.12,   // push the speaker down (fraction of 1920) so the head sits at ~40–70% height
    "scale": 1.0,       // <1 shrinks the speaker (blurred background fills the rest)
    "focus": [0.5, 0.58] // zoom centre (fraction of frame) ≈ speaker's face
  },
  "cuts": {
    "auto": true,        // jump cuts from word timings
    "max_gap": 0.45,     // silences longer than this are removed
    "pad_in": 0.10, "pad_out": 0.16,   // breathing room so speech never sounds clipped
    "fillers": ["ờ","à","ừm"],         // optional override of the filler list
    "remove": [[12.3, 14.0]]           // manual cuts: repeated takes, stumbles, off-topic
  },
  "edl_table": [ { "time": "00:00–00:04", "speech": "…", "idea": "…", "visual": "…" } ],
  "overlays": [ /* see types below; at most one per vertical position at a time */ ],
  "zooms": [ { "start": 12.0, "end": 14.5, "to": 1.06, "ramp": 0.35 } ],   // 1.04–1.10, never > 1.15
  "sfx":   [ { "t": 24.4, "type": "tick" } ],       // pop | tick | click | whoosh | ding
  "subtitles": {
    "max_words": 8,                       // 4–10 words per cue, max 2 lines
    "highlight": { "tê": "red", "chưa tê": "green" },   // ONLY the truly important keywords
    "replace": { "tik tok": "TikTok" },   // fix transcription spelling
    "overrides": [ { "start": 0, "end": 2, "text": "…" } ]  // optional: full manual cues
  },
  "audio": { "denoise": true, "loudness": -14, "music": "music.mp3", "music_db": -28, "sfx_db": -18 }
}
```

## Overlay types

Common fields: `type`, `start`, `end`, optional `anim` (`pop` default · `slide` · `fade`),
`sfx` (plays at start), `zoom` (punch-in while shown, e.g. `1.06`),
`y` (vertical centre as fraction of height, default `0.275`; keep graphics inside 12–42%).

Colours: `white` neutral · `green` safe/positive/early · `red` risk/worse · `yellow` very
important/attention · `cyan` knowledge/terms · `blue`. Max 2–3 accent colours on screen.

| type | purpose | fields |
|---|---|---|
| `headline` | hook / new idea, 2–7 words | `text`, `sub`, `color`, `accent`, `icon` (check/cross/warn/info/chat/dot), `size` |
| `keyword` | smaller label: GIAI ĐOẠN SỚM, CHÂN YẾU | same as headline |
| `warning` | KHOAN!, cảnh báo (yellow + ⚠) | `text`, `sub` |
| `cta` | end call-to-action, 2–5 s | `text`, `sub`, `icon` (default chat) |
| `split` | A vs B (🟢 CHƯA TÊ / 🔴 ĐÃ TÊ) | `title`, `left{text,color,sub}`, `right{…}`, `reveal:[tLeft,tRight]`, `vs` |
| `checklist` | signs / tips, revealed one by one | `title`, `items[]`, `reveal:[t1,t2,…]`, `mark` (check/cross/dot), `color` |
| `steps` | 01 / 02 / 03 stages | `title`, `items[]`, `active:[[t,index],…]`, `color` |
| `flow` | cause → effect: BÓP → NƯỚC THẤM SÂU | `items[]`, `colors[]`, `reveal:[…]` |
| `spine` | spine diagram, one disc compressed | `label`, `disc` (0–3), `highlight_at`, `color` |
| `image` | your own PNG/JPG diagram or product shot | `path`, `width`, `height` |
| `broll` | video B-roll, 1–3 s | `path`, `mode` (`pip` in the top zone · `cutaway` full frame) |

`reveal` / `active` / `highlight_at` times should land on the word the speaker says —
use the per-word times from the transcript.

## Rules the renderer checks (out/report.md)

- health claims in on-screen text (chữa khỏi, hết bệnh, 100%, thay thế thuốc…) → **error**
- headline 2–7 words; CTA 2–5 s; graphics inside the 12–42 % band; subtitles inside 62–82 %
- a visual change at least every ~5 s; ≤ 3 accent colours at once; overlapping overlays
