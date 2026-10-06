# Báo cáo triển khai PART-05 — Dashboard local-first
Ngày: 2026-10-06 · Trạng thái: **Dashboard sẵn sàng — nội dung sản phẩm còn bị chặn** (`system-status.yaml` → `dashboard_ready_limited`)

## 1. File đã đọc từ repo
`CLAUDE.md`, `system-status.yaml`, `decision-log.md`, `changelog.md`, `approval-policy.md`; `brand/` (5 file); `strategy/` (5 file); `products/` (6 file); `compliance/claim-registry.md`, `claim-policy.md`, `human-review-list.md`; `research/customer-language/verbatims.md`, `research/objections/objections.md`; `content/` (customer-journey, content-pillars, content-matrix, idea-bank, qa-checklist, templates/); `sales/` (4 file); `agents/` (4 file); `workflows/` (4 file); `templates/` (5 file); `tools/check_content.py`; `tests/`; `sessions/PART-04/test-results/`.

## 2. Kiến trúc
- TypeScript + React + Vite; API chạy trong tiến trình Vite, chỉ nghe 127.0.0.1.
- Dữ liệu là file trong repo (markdown + JSON) — không cần máy chủ cơ sở dữ liệu; git là lịch sử thay đổi.
- Dữ liệu khách hàng thật: `private/` (ngoài git).
- Logic Tầng 0 dùng chung: `app/shared/` (Dashboard, CLI, test). Luật tuân thủ dùng chung với Python: `config/compliance-rules.json`.

## 3. "Database" & schema
| Kho | File | Schema (app/shared/types.ts) |
|---|---|---|
| Nội dung | `content/items/*.md` | Front matter: id, title, status (13), format (7), stage_5a, pillar, insight, claims, brief/record/publish_approved_by + date, published_url · Thân: 1 Brief (16 mục), 2 Kịch bản (Khối/Lời thoại/Hình ảnh/Claim, Caption, Gợi ý tư liệu), 3 Kiểm tra, 4 Nhật ký trạng thái, 5 Kết quả |
| Insight | `data/insights.json` | Insight {id, text, status HYPOTHESIS/CONFIRMED/REJECTED/MISSING, evidence[{ref, source}], history[{at, by, action, reason}]} |
| Nguồn dữ liệu | `data/data-sources.json` | DataSource {id, name, kind local/manual/api, path, status 5 giá trị, note} |
| Nhật ký duyệt | `data/approvals.json` | ApprovalEntry {at, targetType, targetId, action, reviewer, reason, score, from, to} |
| Chỉ số | `data/analytics.json` | MetricEntry {itemId, date, views, avgWatchSeconds, comments, consultMessages, questionsCount, enteredBy} |
| Dữ liệu khách | `private/customer-data.json` | CustomerRecord {id, quote, type, source, channel, date, anonymized, processed} |
| Claim | `compliance/claim-registry.md` | Đọc trực tiếp (chỉ đọc) |

## 4. Kết quả test
`npm test`: **37/37 TypeScript ĐẠT** + **6/6 Python ĐẠT**; `tsc --noEmit` không lỗi; `vite build` thành công; `npm audit`: 0 lỗ hổng. Kiểm tra giao diện bằng trình duyệt tự động: 11 trang không lỗi JavaScript, không tràn ngang ở 390px.

| Nhóm | Nội dung |
|---|---|
| T01–T02 | Vòng đời 13 trạng thái, tên cũ, tên người duyệt không phải AI; Claim Registry 26/0 APPROVED |
| T03–T04 | Kiểm tra tuân thủ trên dữ liệu test PART-04; Python và TypeScript cho cùng kết quả |
| T05–T07 | Ngưỡng Quality Gate, blocker thắng điểm, chấm kịch bản thật, chặn sai định vị (tử vi), chấm insight |
| T08 | Luồng đầy đủ IDEA → LEARNING_CAPTURED cho video giáo dục, mỗi cổng có chữ ký người |
| T09 | Không nhảy cóc; AI không ký được; từ chối phải có lý do; trả về hủy chữ ký; nội dung đã duyệt bị khóa sửa |
| T10 | Nội dung có sản phẩm UNVERIFIED: tự gắn nhãn, BLOCKED, không vào hàng chờ, không vào Analytics |
| T11 | Chặn số điện thoại/thông tin nhận diện; dữ liệu vào private/; tạo yêu cầu nghiên cứu cho Agent 01 |
| T12 | Model Router local-first; việc duyệt không giao AI; tầng 3 chỉ chạy khi bật + model từ biến môi trường + key; không lộ key |
| T13 | Dữ liệu chiến lược nạp đúng định vị tuần hoàn, tim mạch; kiểm tra nguồn; định tuyến API; front matter |

## 5. Giới hạn
- Chưa có claim APPROVED → nội dung nhắc sản phẩm không qua được NEEDS_SOURCE.
- Kết nối API mạng xã hội: Deferred; chỉ số nhập tay.
- Quality Gate chấm theo luật cố định — không đánh giá được độ hay của câu chữ; người duyệt vẫn phải đọc.
- Tiêu chí và trọng số Quality Gate là đề xuất (C-28).
- Tầng 2/3 API chưa được thử với khóa thật (chỉ test bằng hàm giả lập).
