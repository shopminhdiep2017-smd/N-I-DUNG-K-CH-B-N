# Báo cáo triển khai — Khởi tạo hệ thống, PART-01, PART-02, PART-03
Ngày: 2026-10-06

## 1. File nền móng đã khởi tạo
- `CLAUDE.md` — nguyên tắc, nhãn trạng thái, cấu trúc, quy trình mỗi PART, quy trình phê duyệt.
- `system-status.yaml` — PART-01 completed_basic; PART-02 recorded_with_open_conflicts; PART-03 deployed_with_review_constraints; PART-04 khóa.
- `decision-log.md` — D-001..D-019, mâu thuẫn mở C-01..C-24.
- `changelog.md`.
- PART-01: `brand/` (5 file), `products/` (6 file), `compliance/` (3 file), `sessions/PART-01/` (2 file).
- PART-02: `research/` (2 file), `strategy/` (5 file), `sessions/PART-02/` (2 file).

## 2. File nội dung và bán hàng (PART-03)
- `content/customer-journey.md`, `content/content-pillars.md`, `content/content-matrix.md`, `content/idea-bank.md`, `content/qa-checklist.md`
- `content/templates/content-brief-template.md`, `script-short-template.md`, `script-value-template.md`, `script-sales-template.md`, `script-objection-template.md`, `vsl-template.md`
- `sales/qualification.md`, `sales/discovery-questions.md`, `sales/objection-library.md`, `sales/consultation-process.md`
- `sessions/PART-03/part-03-summary.md`, `sessions/PART-03/part-03-report.md`

## 3. Cách đánh dấu các điểm mâu thuẫn và thiếu dữ liệu
| Vấn đề | Cách đánh dấu |
|---|---|
| Độ tuổi 35–65 / 40–65 | C-01, "CHƯA QUYẾT ĐỊNH" ở mọi file PART-02/03; brand/ giữ 35–65 của PART-01 |
| 4 sản phẩm | Mọi công dụng UNVERIFIED (CLM-001..013); nội dung nhắc sản phẩm mang nhãn "CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI" |
| Câu chuyện khách hàng | Khối câu chuyện trong VSL và mẫu Câu chuyện để trống: "CHỜ DỮ LIỆU – CHƯA CÓ NGUỒN (C-20)" |
| 30 ý tưởng | 30 ô N1-01..N3-10 ghi "CHƯA CÓ NGUỒN – Cần xây dựng chi tiết dựa trên insight thực tế" |
| 9 insight bổ sung | INS-02..INS-10 giữ chỗ, CHƯA CÓ NGUỒN |
| Câu trả lời phản đối | CHƯA QUYẾT ĐỊNH; OBJ-03 cấm trấn an an toàn khi chưa có nguồn |
| Cụm tuyệt đối/nhạy cảm | CLM-014..018, C-13..C-16 → CẦN CON NGƯỜI PHÊ DUYỆT |
| Câu chữ nháp do Claude đề xuất | Câu hỏi khám phá, câu hỏi an toàn bổ sung, hướng xử lý OBJ-03, gán trụ cột/ô ma trận → ghi rõ "đề xuất – CẦN CON NGƯỜI PHÊ DUYỆT" |

## 4. Trạng thái hệ thống và việc con người cần làm trước PART-04
**PART-04: CHƯA MỞ KHÓA** — "Chờ hoàn tất kiểm duyệt các mục UNVERIFIED". Hiện có 26 claim, 0 VERIFIED, 0 APPROVED; 24 mâu thuẫn mở; 0 nội dung sẵn sàng xuất bản.

Việc cần làm (ưu tiên từ trên xuống):
1. Chốt độ tuổi khách hàng (C-01).
2. Chỉ định người duyệt chuyên môn và pháp lý (C-24); xác nhận yêu cầu pháp lý quảng cáo TPBVSK (C-23).
3. Cung cấp tài liệu công bố/nhãn của 4 sản phẩm, ưu tiên Nattokinase 60,000 FU (`products/missing-documents.md`).
4. Duyệt hoặc sửa: "an toàn tuyệt đối", "đúng bệnh", "đúng tình trạng", "triệt để", "gốc rễ", "Combo bảo vệ tuần hoàn chủ động", "tín hiệu tuần hoàn máu kém".
5. Quyết định phạm vi "đồng hành trọn đời 1-1" (C-06).
6. Cung cấp toàn văn INS-02..INS-10 và nội dung 30 ý tưởng video.
7. Duyệt câu trả lời OBJ-01..03, câu hỏi khám phá, danh sách dấu hiệu cần chuyển bác sĩ.
8. Cung cấp chứng chỉ Dược sĩ, giá/quyền lợi, câu chuyện khách hàng thật kèm đồng ý.

Checklist đầy đủ: `compliance/human-review-list.md`.
