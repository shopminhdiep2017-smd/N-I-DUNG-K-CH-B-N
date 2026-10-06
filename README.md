# PERSONAL BRAND AI OS — Dược sĩ Lê Hương

Hệ thống thương hiệu cá nhân cho **Dược sĩ Lê Hương — tư vấn tuần hoàn, tim mạch**: dữ liệu chiến lược (PART-01..03), 3 AI Agent (PART-04) và **Dashboard chạy trên máy** (PART-05). AI chỉ soạn nháp và kiểm tra; **con người** duyệt insight, brief, claim, cho phép quay, cho phép đăng và tư vấn khách.

## Khởi động Dashboard
Cần Node.js 20 trở lên và Python 3.
```bash
npm install      # lần đầu
npm start        # mở http://127.0.0.1:5173 trên trình duyệt
```
Dashboard chỉ chạy trên máy của bạn (127.0.0.1), đọc/ghi trực tiếp các file trong thư mục này.

| Trang | Dùng để |
|---|---|
| Tổng quan | Việc hôm nay, cảnh báo claim/tuân thủ, tiến độ |
| Chiến lược thương hiệu | Xem (chỉ đọc) hồ sơ, định vị, Big Idea, Message House, sản phẩm, Claim Registry |
| Nguồn dữ liệu | Trạng thái kết nối: Chưa kết nối / Đã kết nối / Lỗi / Nhập thủ công / Deferred |
| Dữ liệu khách hàng | Lưu câu nói đã ẩn danh (vào `private/`, ngoài git), gửi cho Agent 01 |
| Thư viện Insight | HYPOTHESIS / CONFIRMED, điểm chất lượng, độ tin cậy, lịch sử duyệt |
| Bản đồ nội dung | Lọc theo trụ cột, insight, 5A, trạng thái; ma trận 5A × trụ cột |
| Script Studio | Soạn brief + kịch bản theo 7 cấu trúc, chấm điểm 100 và kiểm tra tuân thủ trực tiếp |
| Chế độ quay video | Teleprompter chữ lớn, chỉnh tốc độ, lật gương, checklist trước khi quay |
| Kanban sản xuất | 13 trạng thái từ IDEA đến LEARNING_CAPTURED |
| Hàng chờ phê duyệt | Phê duyệt / yêu cầu sửa / từ chối, bắt buộc tên người thật |
| Phân tích hiệu quả | Chỉ số video giáo dục, vòng phản hồi về Agent 01, Model Router |

## Lệnh trong Claude Code
| Lệnh | Việc |
|---|---|
| `/trang-thai` | Xem trạng thái nội dung |
| `/nghien-cuu <file>` | Agent 01 phân tích dữ liệu khách hàng |
| `/viet-kich-ban <file>` | Agent 02 viết kịch bản, Agent 03 kiểm tra |
| `/kiem-duyet <file>` | Agent 03 kiểm tra tuân thủ |
| `/chuan-bi-tu-van <yêu cầu>` | Agent 03 chuẩn bị tư vấn |

## Kiểm tra & test
```bash
npm test                         # 37 test TypeScript + 6 test Python
npm run check -- content/items/<file>.md   # kiểm tra tuân thủ một file
python3 tools/check_content.py --all       # bản Python, cùng luật
```

## Nguyên tắc
- Mọi công dụng của Rich Coenzyme Q10, DHA EPA SQ, Nattokinase 60,000 FU, Policosanol 10 hiện là **UNVERIFIED**; nội dung nhắc sản phẩm dừng ở NEEDS_SOURCE.
- Không chẩn đoán thay bác sĩ; không dùng "chữa khỏi", "đặc trị", "thuốc tiên"; không nội dung ngoài chuyên môn tuần hoàn, tim mạch.
- Model API (tầng 2/3) **tắt mặc định**. Bật trong `config/model-router.json`, tên model đặt qua biến `AIOS_MODEL_LOW` / `AIOS_MODEL_HIGH`, khóa `ANTHROPIC_API_KEY` trong `.env.local` (không commit).

## Tài liệu
`CLAUDE.md` (luật hệ thống) · `system-status.yaml` · `approval-policy.md` · `workflows/` · `agents/` · `compliance/human-review-list.md` · `sessions/PART-05/part-05-report.md`
