---
description: Xem trạng thái hệ thống và danh sách nội dung theo vòng đời
---
1. Chạy `python3 tools/check_content.py --status` và `python3 tools/check_content.py --all`.
2. Đọc `system-status.yaml`.
3. Báo cho người dùng ngắn gọn bằng tiếng Việt: số nội dung theo từng trạng thái, nội dung nào đang chờ con người duyệt, nội dung nào có lỗi FAIL, và 3 việc con người cần làm tiếp theo (ưu tiên mục trong `compliance/human-review-list.md`).
