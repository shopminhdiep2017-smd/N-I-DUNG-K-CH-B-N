#!/usr/bin/env python3
"""Bộ test tự động (phần kiểm tra theo luật) cho MVP PART-04. Dữ liệu đều là giả lập.

Chạy: python3 tests/run_tests.py
Phần test hành vi của Agent (TC1, TC2, TC3, TC4, TC5, TC8 và phần đọc hiểu của TC6, TC7)
được chạy bằng subagent và ghi kết quả trong sessions/PART-04/test-results/.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import check_content as cc  # noqa: E402

F = ROOT / "tests" / "fixtures"
R = ROOT / "sessions" / "PART-04" / "test-results"

# (mã, mô tả, file, kết quả mong đợi, chuỗi phải xuất hiện trong lỗi FAIL)
CASES = [
    ("TC4", "Kịch bản video giá trị do Agent 02 viết không có lỗi FAIL", R / "tc04-value-script.md", "NO_FAIL", None),
    ("TC5", "Kịch bản bán hàng có sản phẩm UNVERIFIED do Agent 02 viết: có nhãn chờ claim, không FAIL", R / "tc05-sales-script.md", "NO_FAIL", None),
    ("TC5b", "Sản phẩm UNVERIFIED bị đẩy sang APPROVED_TO_RECORD bị chặn", F / "tc05b-sales-forced-record.md", "FAIL", "không được phép khi còn claim chưa APPROVED"),
    ("TC6", "Claim thiếu nguồn bị bắt", F / "tc06-missing-source.md", "FAIL", "không khai báo claim"),
    ("TC7", "AI tự ký APPROVED_TO_PUBLISH bị chặn", F / "tc07-publish-by-agent.md", "FAIL", "APPROVED_TO_PUBLISH cần publish_approved_by"),
    ("TC7b", "APPROVED_TO_PUBLISH thiếu chữ ký bị chặn", F / "tc07b-publish-unsigned.md", "FAIL", "APPROVED_TO_PUBLISH cần publish_approved_by"),
]


def main():
    registry = cc.load_registry()
    passed = 0
    for code, desc, path, expect, needle in CASES:
        if not path.exists():
            print(f"[CHƯA CHẠY] {code} {desc} — chưa có file {path.relative_to(ROOT)}")
            continue
        fails, warns = cc.check(path, registry)
        ok = (not fails) if expect == "NO_FAIL" else (bool(fails) and any(needle in f for f in fails))
        passed += ok
        print(f"[{'ĐẠT' if ok else 'CHƯA ĐẠT'}] {code} {desc}")
        for f in fails:
            print(f"     ✗ {f}")
        for w in sorted(set(warns)):
            print(f"     ! {w}")
    print(f"\nKết quả: {passed}/{len(CASES)} đạt")
    return 0 if passed == len(CASES) else 1


if __name__ == "__main__":
    sys.exit(main())
