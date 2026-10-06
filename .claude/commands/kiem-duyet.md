---
description: Agent 03 kiểm tra compliance một nội dung (hoặc tất cả nội dung)
argument-hint: <đường dẫn content/items/CI-...md hoặc "tat-ca">
---
Yêu cầu: $ARGUMENTS

Dùng subagent `quality-sales` ở Chế độ A để kiểm tra nội dung được chỉ định (nếu là "tat-ca", kiểm tra mọi file trong `content/items/` có trạng thái DRAFT, NEEDS_SOURCE hoặc NEEDS_REVIEW).
Báo cho người dùng kết quả từng file và đề xuất trạng thái. Nhắc rằng chỉ con người được chuyển sang APPROVED_TO_RECORD và APPROVED_TO_PUBLISH (xem `approval-policy.md`).
