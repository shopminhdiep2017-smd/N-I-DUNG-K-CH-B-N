# AI Video Editor · Talking Head giải thích chuyên nghiệp

Pipeline tự động edit video người thật nói chuyện thành video 9:16 (TikTok / Reels / Shorts)
theo style **“Chuyên gia giải thích + editor biến từng ý thành hình ảnh”** — xem [`STYLE_GUIDE.md`](STYLE_GUIDE.md).

```
input.mp4 ─► transcribe.py ─► transcript.json ─► (AI editor) edl.json ─► render.py ─► out/final.mp4
                (whisper, timestamp từng từ)       Edit Decision List        jump cut · 9:16 · headline/graphic
                                                                             subtitle · zoom · SFX · nhạc · loudness
```

## Chạy nhanh

```bash
pip install -r editor/requirements.txt

# 1. Transcribe (tiếng Việt, timestamp từng từ)
python editor/transcribe.py projects/dau-lung/input.mp4 --prompt "đĩa đệm, thần kinh tọa"

# 2. Lập Edit Decision List — Claude đọc transcript và viết edl.json
ANTHROPIC_API_KEY=... python editor/plan_edl.py projects/dau-lung --notes "Người nói tên Sơn"

# 3. Render
python editor/render.py projects/dau-lung --draft   # bản nháp nhanh + preview.jpg + report.md
python editor/render.py projects/dau-lung           # bản cuối 1080x1920 30fps
```

Demo không cần video thật: `python examples/demo/make_demo.py && python editor/render.py examples/demo`
→ [`examples/demo/out/final.mp4`](examples/demo/out/final.mp4), [`preview.jpg`](examples/demo/out/preview.jpg), [`report.md`](examples/demo/out/report.md).

## Renderer làm gì

| Style guide | Cài đặt |
|---|---|
| 9:16 · 1080x1920 · 30fps, người nói ở 40–70% dưới | `subject.offset_y` đẩy người xuống, nền blur lấp phía trên, gradient tối vùng headline |
| Headline / keyword / cảnh báo / CTA | `headline` `keyword` `warning` `cta` — pop/slide/fade, scale 90→100% |
| Graphic giải thích | `split` (🟢 vs 🔴), `checklist`, `steps` 01/02/03, `flow` A → B, `spine` (đĩa đệm bị chèn), `image`, `broll` PiP/cutaway |
| Reveal theo lời nói | `reveal` / `active` / `highlight_at` gắn vào thời điểm từng từ |
| Subtitle 4–10 từ, ≤ 2 dòng, highlight keyword | tự chia theo ngữ nghĩa + dấu câu, cân bằng 2 dòng, không để chữ mồ côi |
| Jump cut | bỏ im lặng > 0.45s, “ờ/à/ừm”, đoạn cắt tay; có padding để không bị gấp |
| Zoom 105–108% | `zooms` + `zoom` trên từng overlay, ease in/out |
| Sound design | highpass + khử ồn nhẹ + compressor + loudnorm −14 LUFS; nhạc −28 dB có ducking; SFX pop/tick/click/whoosh/ding tự tổng hợp |
| Safe zone, rule sức khỏe, nhịp 2–5s | lint → `out/report.md`; cấm “chữa khỏi / hết bệnh / 100% …” trên màn hình |

Schema đầy đủ: [`docs/EDL_SCHEMA.md`](docs/EDL_SCHEMA.md). Font: Be Vietnam Pro (OFL).
