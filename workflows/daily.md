# Quy trình hằng ngày (khoảng 30–60 phút)
Người thực hiện: Dược sĩ Lê Hương · Công cụ: Claude Code mở tại repo này

| # | Việc | Lệnh / thao tác | Thời gian |
|---|---|---|---|
| 1 | Xem trạng thái | `/trang-thai` | 2 phút |
| 2 | Duyệt việc đang chờ mình | Mở các file `NEEDS_REVIEW`, đọc báo cáo QA trong `content/qa-reports/`; duyệt thì điền `record_approved_by` + ngày và đổi `status: APPROVED_TO_RECORD` (chỉ khi mọi claim đã APPROVED) | 10–15 phút |
| 3 | Chuẩn bị tư vấn | Mỗi yêu cầu tư vấn mới: `/chuan-bi-tu-van <mô tả đã ẩn danh>`; tự tư vấn trực tiếp | tùy |
| 4 | Ghi câu hỏi/bình luận mới | Dán (đã ẩn danh) vào một file `templates/research-request.md` gom trong ngày | 5 phút |
| 5 | Quay / dựng | Nội dung `APPROVED_TO_RECORD` → quay, dựng CapCut/Vbee → đổi `RECORDED`, `EDITING`, `FINAL_REVIEW` (hoặc dùng Dashboard: Kanban sản xuất) | tùy |
| 6 | Duyệt đăng | Xem bản dựng cuối → điền `publish_approved_by` + ngày → `APPROVED_TO_PUBLISH` → đăng → `PUBLISHED` + `published_url` | 5 phút/video |

Không được bỏ bước 6 phần duyệt. Không để AI điền tên người duyệt.
