#!/usr/bin/env python3
"""Theo dõi thư mục thả video, tự gọi Claude Code + video-use để dựng video hoàn chỉnh.

Cách dùng (bộ cài đã tạo sẵn file BAT-DAU để chạy lệnh này):
    python watcher.py --root <thư mục VIDEO-TU-DONG> --repo <thư mục video-use>

- Thả 1 file video vào 1-THA-VIDEO-VAO-DAY  -> dựng thành 1 video.
- Thả 1 THƯ MỤC chứa nhiều đoạn quay       -> ghép tất cả thành 1 video.
- Kết quả xuất ra 2-VIDEO-HOAN-CHINH.
"""

from __future__ import annotations

import argparse
import datetime as dt
import shutil
import subprocess
import sys
import time
from pathlib import Path

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".m2ts", ".3gp"}
PARTIAL_EXT = {".part", ".crdownload", ".tmp", ".download"}

INBOX = "1-THA-VIDEO-VAO-DAY"
OUTBOX = "2-VIDEO-HOAN-CHINH"
WORK = "_dang-xu-ly"
ARCHIVE = "_da-xong"
FAILED = "_loi"
LOGS = "_nhat-ky"
REQUEST_FILE = "yeu-cau.txt"

POLL_SECONDS = 10
JOB_TIMEOUT_SECONDS = 4 * 60 * 60
ALLOWED_TOOLS = "Bash,Read,Write,Edit,Glob,Grep,Agent,Skill,TodoWrite"

PROMPT = """You are running UNATTENDED as an automatic video editor. No human will answer questions.

Use the video-use skill. Its SKILL.md is at: {skill_md}
Read SKILL.md and the scripts in {helpers} before starting.
The raw footage is in the current working directory. Put every output in ./edit/ as SKILL.md says.
Run the helpers with: uv run --project "{repo}" python "{helpers}/<script>.py" ...

Because nobody is available to chat:
- The user PRE-APPROVES your strategy. Do not ask questions and do not wait for confirmation
  (this overrides Hard Rule 11 and the "Converse"/"Propose strategy" steps). Decide yourself.
- Still do Inventory, Execute, Self-eval (max 3 passes) and write edit/project.md.
- Finish by rendering the full-quality file to exactly: edit/final.mp4

Default style unless the user's instructions below say otherwise:
- Cut filler words (umm, uh, false starts), retakes and dead air; keep natural pacing.
- Light corrective grade (neutral_punch) only if the footage looks flat; otherwise none.
- Burn subtitles in the language actually spoken in the video (natural sentence chunks, easy to read on a phone).
- Keep the original aspect ratio. No animation overlays unless clearly needed.

User's instructions (may be written in Vietnamese; follow them):
---
{request}
---
When edit/final.mp4 exists and passed self-eval, print DONE and stop.
"""


def now() -> str:
    return dt.datetime.now().strftime("%H:%M:%S")


def log(msg: str) -> None:
    print(f"[{now()}] {msg}", flush=True)


def is_candidate(p: Path) -> bool:
    if p.name.startswith(".") or p.name.lower() in {"desktop.ini", "thumbs.db"}:
        return False
    if p.is_dir():
        return True
    return p.suffix.lower() in VIDEO_EXT


def signature(p: Path) -> tuple[int, float, bool] | None:
    """(tổng dung lượng, mtime mới nhất, còn đang copy dở?) để biết file đã chép xong chưa."""
    try:
        files = [p] if p.is_file() else [f for f in p.rglob("*") if f.is_file()]
        size = sum(f.stat().st_size for f in files)
        mtime = max((f.stat().st_mtime for f in files), default=0.0)
        partial = any(f.suffix.lower() in PARTIAL_EXT for f in files)
        return size, mtime, partial
    except OSError:
        return None


def has_video(p: Path) -> bool:
    if p.is_file():
        return p.suffix.lower() in VIDEO_EXT
    return any(f.suffix.lower() in VIDEO_EXT for f in p.rglob("*") if f.is_file())


def unique(path: Path) -> Path:
    if not path.exists():
        return path
    i = 2
    while True:
        cand = path.with_name(f"{path.stem}-{i}{path.suffix}")
        if not cand.exists():
            return cand
        i += 1


def read_request(root: Path) -> str:
    f = root / REQUEST_FILE
    if not f.exists():
        return "(none)"
    lines = [
        ln for ln in f.read_text(encoding="utf-8-sig", errors="replace").splitlines()
        if ln.strip() and not ln.lstrip().startswith("#")
    ]
    return "\n".join(lines) or "(none)"


def find_claude() -> str:
    exe = shutil.which("claude")
    if exe:
        return exe
    for cand in (Path.home() / ".local" / "bin" / "claude", Path.home() / ".local" / "bin" / "claude.exe"):
        if cand.exists():
            return str(cand)
    sys.exit("Không tìm thấy lệnh 'claude'. Hãy chạy lại bộ cài.")


def process(item: Path, root: Path, repo: Path, claude: str) -> None:
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    name = f"{item.stem if item.is_file() else item.name}_{stamp}"
    job = root / WORK / name
    if item.is_file():
        job.mkdir(parents=True)
        shutil.move(str(item), str(job / item.name))
    else:
        shutil.move(str(item), str(job))

    log_file = root / LOGS / f"{name}.log"
    prompt = PROMPT.format(
        skill_md=(repo / "SKILL.md").as_posix(),
        helpers=(repo / "helpers").as_posix(),
        repo=repo.as_posix(),
        request=read_request(root),
    )
    cmd = [
        claude, "-p",
        "--permission-mode", "acceptEdits",
        "--allowedTools", ALLOWED_TOOLS,
        "--add-dir", str(repo),
    ]
    log(f"▶ Bắt đầu dựng: {item.name}  (nhật ký: {LOGS}/{log_file.name})")
    start = time.time()
    ok = False
    with log_file.open("w", encoding="utf-8") as out:
        try:
            proc = subprocess.run(
                cmd, cwd=job, input=prompt, stdout=out, stderr=subprocess.STDOUT,
                text=True, encoding="utf-8", errors="replace", timeout=JOB_TIMEOUT_SECONDS,
            )
            out.write(f"\n[exit code {proc.returncode}]\n")
        except subprocess.TimeoutExpired:
            out.write("\n[HẾT THỜI GIAN CHỜ]\n")
        except OSError as e:
            out.write(f"\n[LỖI CHẠY CLAUDE] {e}\n")

    final = job / "edit" / "final.mp4"
    minutes = (time.time() - start) / 60
    if final.exists() and final.stat().st_size > 0:
        dest = unique(root / OUTBOX / f"{name}.mp4")
        shutil.copy2(final, dest)
        shutil.move(str(job), str(unique(root / ARCHIVE / name)))
        ok = True
        log(f"✔ XONG ({minutes:.1f} phút): {OUTBOX}/{dest.name}")
    else:
        shutil.move(str(job), str(unique(root / FAILED / name)))
        log(f"✘ LỖI ({minutes:.1f} phút): {item.name} -> xem {LOGS}/{log_file.name}; video gốc nằm trong {FAILED}/")
    if not ok:
        print("\a", end="", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, type=Path)
    ap.add_argument("--repo", required=True, type=Path)
    args = ap.parse_args()
    root, repo = args.root.resolve(), args.repo.resolve()

    for d in (INBOX, OUTBOX, WORK, ARCHIVE, FAILED, LOGS):
        (root / d).mkdir(parents=True, exist_ok=True)
    if not (repo / "SKILL.md").exists():
        sys.exit(f"Không thấy video-use tại {repo}. Hãy chạy lại bộ cài.")
    claude = find_claude()

    # Video còn sót trong _dang-xu-ly do lần trước bị tắt giữa chừng -> đưa lại vào hàng chờ.
    for left in sorted((root / WORK).iterdir()):
        shutil.move(str(left), str(unique(root / INBOX / left.name)))

    log(f"Đang theo dõi: {root / INBOX}")
    log("Thả video (hoặc thư mục nhiều đoạn quay) vào đó. Giữ cửa sổ này mở. Đóng cửa sổ để dừng.")
    seen: dict[Path, tuple] = {}
    while True:
        inbox = root / INBOX
        current = {p for p in inbox.iterdir() if is_candidate(p)}
        for p in list(seen):
            if p not in current:
                del seen[p]
        for p in sorted(current):
            sig = signature(p)
            if sig is None or sig[0] == 0 or sig[2]:
                seen.pop(p, None)
                continue
            if seen.get(p) != sig:
                seen[p] = sig  # chờ thêm 1 vòng để chắc file đã chép xong
                continue
            del seen[p]
            if not has_video(p):
                log(f"Bỏ qua (không có file video): {p.name}")
                shutil.move(str(p), str(unique(root / FAILED / p.name)))
                continue
            process(p, root, repo, claude)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Đã dừng.")
