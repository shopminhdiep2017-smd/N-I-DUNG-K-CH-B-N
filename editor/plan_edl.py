#!/usr/bin/env python3
"""Step 2 — let Claude read the transcript and write the Edit Decision List.

    ANTHROPIC_API_KEY=... python editor/plan_edl.py projects/<name>

Reads transcript.json + STYLE_GUIDE.md + docs/EDL_SCHEMA.md, writes edl.json.
(Inside a Claude Code session you can skip this: Claude writes edl.json itself.)
"""
import argparse
import json
import re
import sys
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parents[1]


def transcript_text(tr):
    lines = []
    for s in tr["segments"]:
        words = " ".join(f"{w['word']}@{w['start']:.2f}" for w in s.get("words", []))
        lines.append(f"[{s['start']:.2f}–{s['end']:.2f}] {s['text']}\n    {words}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--source", default=None, help="video filename inside the project (default: auto)")
    ap.add_argument("--notes", default="", help="extra direction, e.g. speaker name for the CTA")
    a = ap.parse_args()

    proj = Path(a.project)
    tr = json.loads((proj / "transcript.json").read_text())
    source = a.source or next((p.name for p in proj.iterdir()
                               if p.suffix.lower() in (".mp4", ".mov", ".m4v", ".mkv", ".webm")), "input.mp4")
    system = (
        "You are a professional short-form video editor. Follow this style guide exactly:\n\n"
        + (ROOT / "STYLE_GUIDE.md").read_text()
        + "\n\nYou output the edit as JSON following this schema:\n\n"
        + (ROOT / "docs" / "EDL_SCHEMA.md").read_text()
    )
    user = (
        f"Source video file: {source}\nDuration: {tr.get('duration', 0):.1f}s\n"
        f"{('Notes from the creator: ' + a.notes) if a.notes else ''}\n\n"
        "Transcript with per-word start times (SOURCE seconds):\n\n"
        f"{transcript_text(tr)}\n\n"
        "Plan the edit: identify hook, problem, key points, explanations, examples, warnings, "
        "conclusion and CTA; fill edl_table first, then overlays/zooms/sfx/subtitles timed to the words. "
        "Reply with the complete edl.json in a single ```json code block and nothing else."
    )
    client = anthropic.Anthropic()
    with client.beta.messages.stream(
        model="claude-opus-5-5",
        max_tokens=64000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        betas=["server-side-fallback-2026-07-01"],
        extra_body={"fallbacks": "default"},
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        msg = stream.get_final_message()
    if msg.stop_reason == "refusal":
        sys.exit(f"Claude declined: {msg.stop_details}")
    if msg.stop_reason == "max_tokens":
        sys.exit("Response was cut off (max_tokens) — try again with a shorter video")
    text = "".join(b.text for b in msg.content if b.type == "text")
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.S)
    try:
        edl = json.loads(m[1] if m else text)
    except json.JSONDecodeError as e:
        (proj / "edl.raw.txt").write_text(text)
        sys.exit(f"Could not parse JSON ({e}); raw reply saved to edl.raw.txt")
    edl.setdefault("source", source)
    (proj / "edl.json").write_text(json.dumps(edl, ensure_ascii=False, indent=2))
    print(f"→ {proj / 'edl.json'}  ({len(edl.get('overlays', []))} overlays)")
    for row in edl.get("edl_table", []):
        print(f"  {row.get('time', ''):14} {row.get('idea', ''):28} {row.get('visual', '')}")


if __name__ == "__main__":
    main()
