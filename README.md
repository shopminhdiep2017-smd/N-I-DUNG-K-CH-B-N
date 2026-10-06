# PERSONAL BRAND AI OS — Dược sĩ Lê Hương

Hệ thống dữ liệu thương hiệu, nội dung và 3 AI Agent (MVP) hỗ trợ Dược sĩ Lê Hương làm nội dung về tuần hoàn máu, tim mạch, có con người kiểm soát ở mọi bước quan trọng.

## Bắt đầu nhanh (mở repo này trong Claude Code)
| Lệnh | Việc |
|---|---|
| `/trang-thai` | Xem nội dung theo trạng thái và việc đang chờ bạn duyệt |
| `/nghien-cuu <dữ liệu đã ẩn danh>` | Agent 01 phân loại câu hỏi, nỗi đau, rào cản; đề xuất insight |
| `/viet-kich-ban <mô tả brief hoặc file content/items/…>` | Agent 02 viết kịch bản, Agent 03 kiểm tra |
| `/kiem-duyet <file hoặc tat-ca>` | Agent 03 kiểm tra compliance |
| `/chuan-bi-tu-van <yêu cầu tư vấn đã ẩn danh>` | Agent 03 chuẩn bị câu hỏi và follow-up |

Kiểm tra nhanh không cần AI: `python3 tools/check_content.py --all`

## Nguyên tắc
- AI chỉ soạn nháp và kiểm tra. **Con người** duyệt insight, duyệt claim, cho phép quay, cho phép đăng, và tư vấn khách.
- Mọi công dụng của 4 sản phẩm (Rich Coenzyme Q10, DHA EPA SQ, Nattokinase 60,000 FU, Policosanol 10) hiện là **UNVERIFIED**.
- Không đưa dữ liệu khách hàng thật vào git; dùng thư mục `private/`.

## Tài liệu
| File | Nội dung |
|---|---|
| `CLAUDE.md` | Luật hệ thống, nhãn dữ liệu, cấu trúc thư mục |
| `system-status.yaml` | Trạng thái các PART |
| `approval-policy.md` | Vòng đời nội dung, điểm duyệt H1–H6, mức rủi ro |
| `workflows/` | Quy trình hằng ngày, hằng tuần, sản xuất video, kiểm duyệt |
| `agents/` | Định nghĩa 3 Agent |
| `compliance/human-review-list.md` | Việc con người cần quyết định |
| `sessions/PART-04/part-04-report.md` | Báo cáo triển khai MVP và kết quả test |
