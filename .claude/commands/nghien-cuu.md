---
description: Agent 01 phân tích dữ liệu khách hàng thô và đề xuất insight (giả thuyết)
argument-hint: <dán dữ liệu đã ẩn danh hoặc đường dẫn file research-request>
---
Dùng subagent `research-strategy` để xử lý yêu cầu nghiên cứu sau. Đầu vào:

$ARGUMENTS

Nếu đầu vào trống, hướng dẫn người dùng điền `templates/research-request.md` và dừng.
Sau khi agent xong, tóm tắt cho người dùng: file báo cáo đã tạo, các insight đề xuất (đều là HYPOTHESIS), và việc họ cần duyệt.
