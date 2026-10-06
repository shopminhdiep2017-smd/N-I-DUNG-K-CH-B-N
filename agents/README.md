# Hệ thống 3 Agent — PERSONAL BRAND AI OS (MVP)
Nguồn: PART-04 · Cập nhật: 2026-10-06

| Agent | File định nghĩa | Gọi trong Claude Code | Lệnh tắt |
|---|---|---|---|
| 01 — Research & Strategy | `agents/agent-01-research-strategy.md` | subagent `research-strategy` | `/nghien-cuu` |
| 02 — Content Production | `agents/agent-02-content-production.md` | subagent `content-production` | `/viet-kich-ban` |
| 03 — Quality & Sales Support | `agents/agent-03-quality-sales.md` | subagent `quality-sales` | `/kiem-duyet`, `/chuan-bi-tu-van` |

Lệnh xem trạng thái: `/trang-thai`.

## Cách hoạt động
- File trong `agents/` là **nguồn chính** (cấu hình, prompt, schema đầu ra).
- File trong `.claude/agents/` chỉ là lớp vỏ để Claude Code nhận diện subagent; nó yêu cầu agent đọc file nguồn chính trước khi làm việc.
- File trong `.claude/commands/` là lệnh tắt cho người dùng.
- `tools/check_content.py` là bộ kiểm tra tự động theo luật cố định, Agent 03 chạy đầu tiên khi kiểm duyệt.

## Luật chung cho cả 3 Agent
1. Đọc `CLAUDE.md` và `system-status.yaml` trước khi làm việc.
2. Không sửa: `strategy/`, `compliance/`, `brand/`, `products/`, `decision-log.md`, `system-status.yaml`. Chỉ con người (hoặc Claude theo yêu cầu trực tiếp của con người) sửa các file này.
3. Không điền các trường `*_approved_by`, `*_approved_date`. Không chuyển trạng thái nội dung vượt quá `NEEDS_REVIEW`.
4. Không bịa dữ liệu, công dụng, số liệu, câu chuyện khách hàng.
5. Không xuất bản, không gửi tin nhắn ra ngoài.
6. Gặp điều kiện dừng → dừng, ghi rõ lý do trong đầu ra, mục "CẦN CON NGƯỜI QUYẾT ĐỊNH".
7. Không đưa dữ liệu khách hàng thật có thể nhận diện vào git; dùng `private/` (đã nằm trong `.gitignore`).

## Thư mục đầu ra
| Agent | Ghi vào |
|---|---|
| 01 | `research/reports/RS-YYYYMMDD-NN.md` |
| 02 | `content/items/CI-YYYYMMDD-NN.md` (từ `templates/content-item.md`) |
| 03 | `content/qa-reports/<id>-qa.md`; chuẩn bị tư vấn: `private/consultations/` |
