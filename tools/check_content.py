#!/usr/bin/env python3
"""Kiểm tra tuân thủ cho file nội dung trong content/items/ (PERSONAL BRAND AI OS).

Cách dùng:
  python3 tools/check_content.py <file.md> [file2.md ...]   Kiểm tra từng file
  python3 tools/check_content.py --all                      Kiểm tra mọi file trong content/items/
  python3 tools/check_content.py --status                   Liệt kê nội dung theo trạng thái

Kết quả: PASS / WARN / FAIL. Mã thoát 1 nếu có FAIL.
Công cụ này chỉ bắt lỗi theo luật cố định; nó KHÔNG thay thế người duyệt.
Chỉ dùng thư viện chuẩn của Python.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "compliance" / "claim-registry.md"
ITEMS_DIR = ROOT / "content" / "items"

RULES_FILE = ROOT / "config" / "compliance-rules.json"
RULES = json.loads(RULES_FILE.read_text(encoding="utf-8"))

# Luật dùng chung với Dashboard (app/shared/compliance.ts) — sửa trong config/compliance-rules.json
STATUSES = RULES["statuses"]
ALIASES = RULES["aliases"]
IDX = {s: i for i, s in enumerate(STATUSES)}
BANNED = RULES["banned"]
ABSOLUTE = RULES["absolute"]
OFF_POSITIONING = RULES["offPositioning"]
FABRICATION = RULES["fabricationPatterns"]
PRODUCTS = RULES["products"]
HEALTH_WORDS = RULES["healthWords"]
PENDING_LABEL = RULES["pendingLabel"]
NON_HUMAN = set(RULES["nonHuman"])
SIGNATURES = RULES["signatures"]


def parse(path):
    text = Path(path).read_text(encoding="utf-8")
    meta, body = {}, text
    if text.startswith("---"):
        parts = text.split("\n---", 1)
        if len(parts) == 2:
            for line in parts[0].splitlines()[1:]:
                if ":" in line and not line.lstrip().startswith("#"):
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.split(" #")[0].strip().strip('"')
            body = parts[1].split("\n", 1)[1] if "\n" in parts[1] else ""
    return meta, body


def load_registry():
    claims = {}
    for line in REGISTRY.read_text(encoding="utf-8").splitlines():
        if line.startswith("| CLM-"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            claims[cells[0]] = "APPROVED" in cells
    return claims


def negated(body_lower, pos):
    return "không" in body_lower[max(0, pos - 15):pos]


def is_human(name):
    if not name:
        return False
    tokens = set(re.findall(r"[a-z0-9]+", name.lower()))
    return not (tokens & NON_HUMAN)


def check(path, registry):
    meta, body = parse(path)
    low = body.lower()
    fails, warns = [], []
    status = ALIASES.get(meta.get("status", "").strip().upper(), meta.get("status", "").strip().upper())
    if status not in IDX:
        fails.append(f"Trạng thái '{status}' không hợp lệ. Hợp lệ: {', '.join(STATUSES)}")
        return fails, warns
    s = IDX[status]

    # 1. Từ cấm
    for w in BANNED:
        for m in re.finditer(re.escape(w), low):
            if negated(low, m.start()):
                warns.append(f"Có cụm cấm '{w}' trong câu phủ định — người duyệt kiểm tra lại")
            else:
                fails.append(f"Từ cấm: '{w}' (BAN)")
    for w in OFF_POSITIONING:
        if w in low:
            fails.append(f"Ngoài định vị chuyên môn (tuần hoàn, tim mạch): '{w}'")
    for rx in FABRICATION:
        m = re.search(rx, low)
        if m:
            fails.append(f"Số liệu/khan hiếm/kết quả không có nguồn: '{m.group(0)}'")
    # 2. Cụm tuyệt đối
    for w in ABSOLUTE:
        if w in low:
            warns.append(f"Cụm tuyệt đối/nhạy cảm: '{w}' — CẦN CON NGƯỜI PHÊ DUYỆT")

    # 3. Claim
    claim_ids = [c.strip() for c in meta.get("claims", "").split(",") if c.strip() and c.strip() != "-"]
    for c in claim_ids:
        if c not in registry:
            fails.append(f"Claim {c} không có trong compliance/claim-registry.md")
    unapproved = [c for c in claim_ids if c in registry and not registry[c]]

    mentioned = [name for name, rx in PRODUCTS.items() if re.search(rx, low)]
    if mentioned and not claim_ids:
        fails.append(f"Nhắc sản phẩm {', '.join(mentioned)} nhưng không khai báo claim (claims:)")
    if mentioned or unapproved:
        if unapproved and PENDING_LABEL.lower() not in low:
            fails.append(f"Claim chưa APPROVED ({', '.join(unapproved)}) nhưng thiếu nhãn "
                         f"'{PENDING_LABEL} – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI'")
        if mentioned and not claim_ids and PENDING_LABEL.lower() not in low:
            fails.append("Nội dung nhắc sản phẩm thiếu nhãn chờ claim")
    if (unapproved or (mentioned and not claim_ids)) and s >= IDX["APPROVED_TO_RECORD"]:
        fails.append(f"Trạng thái {status} không được phép khi còn claim chưa APPROVED")

    found_health = [w for w in HEALTH_WORDS if w in low]
    if found_health and not claim_ids:
        warns.append(f"Có từ khóa sức khỏe ({', '.join(found_health)}) — Agent 03/người duyệt "
                     f"xác định có phải tuyên bố cần claim không")

    # 4. Cổng phê duyệt của con người
    for gate, (by, date) in SIGNATURES.items():
        if s >= IDX[gate] and not (is_human(meta.get(by)) and meta.get(date)):
            fails.append(f"{gate} cần {by} là tên người (không phải AI/Agent) và {date}")

    # 5. Điểm còn mở
    if re.search(r"\b(35|40)\s*[–-]\s*65\b|\bu40", low):
        warns.append("Có độ tuổi cụ thể — độ tuổi CHƯA QUYẾT ĐỊNH (C-01)")
    if "trọn đời" in low:
        warns.append("'trọn đời' — phạm vi cam kết CHƯA QUYẾT ĐỊNH (C-06)")
    return fails, warns


def report(path, registry):
    fails, warns = check(path, registry)
    result = "FAIL" if fails else ("WARN" if warns else "PASS")
    print(f"\n[{result}] {path}")
    for f in fails:
        print(f"  ✗ {f}")
    for w in sorted(set(warns)):
        print(f"  ! {w}")
    return result


def list_status():
    items = sorted(ITEMS_DIR.glob("*.md"))
    groups = {s: [] for s in STATUSES}
    for p in items:
        meta, _ = parse(p)
        st = meta.get("status", "?").strip().upper()
        groups.setdefault(ALIASES.get(st, st), []).append(f"{meta.get('id', p.stem)} — {meta.get('title', '')}")
    for s, lst in groups.items():
        if lst:
            print(f"\n{s} ({len(lst)})")
            for x in lst:
                print(f"  - {x}")
    if not items:
        print("Chưa có nội dung nào trong content/items/.")


def main(argv):
    if not argv:
        print(__doc__)
        return 0
    if argv[0] == "--status":
        list_status()
        return 0
    files = sorted(ITEMS_DIR.glob("*.md")) if argv[0] == "--all" else [Path(a) for a in argv]
    registry = load_registry()
    results = [report(f, registry) for f in files]
    print(f"\nTổng: {len(results)} file · FAIL {results.count('FAIL')} · WARN {results.count('WARN')} · PASS {results.count('PASS')}")
    return 1 if "FAIL" in results else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
