#!/usr/bin/env python3
"""Step 1 — transcribe the talking-head video with word timestamps.

    python editor/transcribe.py projects/<name>/input.mp4 [--model large-v3]

Writes transcript.json next to the video: segments with per-word timings,
which drive jump cuts, subtitles and the EDL.
"""
import argparse
import json
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--model", default="large-v3", help="tiny/base/small/medium/large-v3")
    ap.add_argument("--language", default="vi")
    ap.add_argument("--prompt", default="", help="domain words to help spelling, e.g. 'đĩa đệm, thần kinh tọa'")
    ap.add_argument("--device", default="auto")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()

    model = WhisperModel(a.model, device=a.device, compute_type="auto")
    segments, info = model.transcribe(a.video, language=a.language, word_timestamps=True,
                                      vad_filter=True, initial_prompt=a.prompt or None,
                                      condition_on_previous_text=False)
    out = {"language": info.language, "duration": info.duration, "segments": []}
    for s in segments:
        out["segments"].append({
            "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(),
            "words": [{"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip(),
                       "prob": round(w.probability, 3)} for w in (s.words or [])],
        })
        print(f"[{s.start:7.2f} → {s.end:7.2f}] {s.text.strip()}")
    dest = Path(a.out) if a.out else Path(a.video).with_name("transcript.json")
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"→ {dest}")


if __name__ == "__main__":
    main()
