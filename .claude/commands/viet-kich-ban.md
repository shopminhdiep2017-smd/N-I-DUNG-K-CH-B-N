---
description: Agent 02 viết bản thảo kịch bản từ Content Brief đã duyệt, sau đó Agent 03 kiểm tra
argument-hint: <đường dẫn content/items/CI-...md, hoặc mô tả brief cần soạn>
---
Yêu cầu: $ARGUMENTS

1. Nếu là đường dẫn tới file trong `content/items/`: dùng subagent `content-production` để viết kịch bản cho file đó.
2. Nếu là mô tả: tạo file mới từ `templates/content-item.md` với `status: IDEA`, điền Content Brief nháp, để trống `brief_approved_by`, rồi dừng và nhắc người dùng duyệt brief (điền tên vào `brief_approved_by` và ngày) trước khi viết kịch bản.
3. Sau khi Agent 02 viết xong, dùng subagent `quality-sales` (Chế độ A) để kiểm tra file đó.
4. Báo cho người dùng: trạng thái hiện tại, lỗi CHẶN/CẦN DUYỆT, và việc họ cần làm. Không chuyển trạng thái vượt NEEDS_REVIEW.
