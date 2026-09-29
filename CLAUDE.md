# AI Video Editor — Talking Head giải thích

This repo turns a raw talking-head recording into a finished 9:16 explainer
following `STYLE_GUIDE.md` (read it before every edit — it is the brief).

## Workflow when the user gives a video
1. Put it at `projects/<name>/input.mp4` (the user commits it, or downloads it from a link).
2. `pip install -r editor/requirements.txt`
3. Transcribe: `python editor/transcribe.py projects/<name>/input.mp4 --prompt "<domain terms>"`
   (needs huggingface.co reachable to download the whisper model).
4. **You are the editor**: read `transcript.json`, then write `projects/<name>/edl.json`
   per `docs/EDL_SCHEMA.md` — fill `edl_table` first (section 18), then overlays timed
   to the words. Headline = what viewers must remember; never copy the subtitle.
   (Outside Claude Code: `python editor/plan_edl.py projects/<name>` does this via the API.)
5. `python editor/render.py projects/<name> --draft`, look at `out/preview.jpg`
   and `out/report.md`, fix warnings, then render final without `--draft`.
6. Health videos: never put cure claims on screen (rule 16) — lint blocks them.

`examples/demo/` is a synthetic end-to-end example (`make_demo.py` → `render.py`).
