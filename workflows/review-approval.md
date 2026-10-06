# Quy trình kiểm duyệt

## Kiểm duyệt bản thảo (sau Agent 02)
1. Agent 03 chạy `python3 tools/check_content.py content/items/<id>.md`.
2. Agent 03 đọc kịch bản theo `content/qa-checklist.md` A–F, ghi `content/qa-reports/<id>-qa.md`.
3. Có lỗi CHẶN → trả về `SCRIPT_DRAFT`, Agent 02 sửa.
4. Còn claim chưa APPROVED → `NEEDS_SOURCE`. Nội dung đứng đây đến khi có tài liệu và claim được duyệt (H3).
5. Không còn lỗi CHẶN và claim đều APPROVED (hoặc không có claim) → `NEEDS_REVIEW`.

## Duyệt của con người (H4)
1. Đọc kịch bản và báo cáo QA.
2. Quyết định từng mục CẦN DUYỆT (giữ / sửa); ghi vào mục 4 "Nhật ký trạng thái".
3. Đồng ý → điền `record_approved_by: <Tên người>`, `record_approved_date: YYYY-MM-DD`, đổi `status: APPROVED_TO_RECORD`.
4. Chạy lại `/kiem-duyet content/items/<id>.md` để xác nhận không FAIL.

## Duyệt claim (H3)
1. Đưa tài liệu sản phẩm vào `products/docs/` (tạo thư mục khi có tài liệu).
2. Nhờ Claude: "cập nhật claim CLM-xxx sang VERIFIED theo tài liệu …" → Claude chỉ ghi đường dẫn nguồn, không tự kết luận.
3. Người duyệt chuyên môn/pháp lý xác nhận câu chữ → đổi `APPROVED`, ghi tên và ngày trong Claim Registry.

## Duyệt đăng (H5)
1. Xem bản dựng cuối (không chỉ kịch bản).
2. Đối chiếu chữ trên màn hình và caption với kịch bản đã duyệt.
3. Điền `publish_approved_by`, `publish_approved_date`, đổi `APPROVED_TO_PUBLISH`, chạy `/kiem-duyet`.
