# Quy trình tối ưu & vòng phản hồi (PART-05)
Phạm vi: chỉ video **giáo dục không chứa sản phẩm** (nội dung có sản phẩm còn bị chặn vì claim UNVERIFIED).

## Vòng lặp
```
PUBLISHED → nhập chỉ số (Dashboard: Phân tích hiệu quả) → MEASURED
   → câu hỏi khách hàng (ẩn danh) tự vào Thư viện dữ liệu khách hàng (private/)
   → "Tạo yêu cầu nghiên cứu" → /nghien-cuu (Agent 01) → insight HYPOTHESIS
   → con người duyệt insight (Hàng chờ phê duyệt) → Content Brief mới
   → ghi bài học trên Kanban → LEARNING_CAPTURED
```

## Chỉ số theo dõi (nhập tay)
| Chỉ số | Ý nghĩa | Nguồn |
|---|---|---|
| Lượt xem | Độ phủ | Trang quản trị của kênh (kênh cụ thể: NOT_DECIDED) |
| Thời gian xem trung bình (giây) | Hook và nhịp kịch bản có giữ người xem không | Trang quản trị của kênh |
| Bình luận | Mức độ đồng cảm | Trang quản trị của kênh |
| Tin nhắn tư vấn | Người xem có muốn hỏi Dược sĩ không | Hộp tin nhắn |
| Câu hỏi khách hàng | Nguyên liệu cho Agent 01 | Bình luận/tin nhắn — **ẩn danh trước khi nhập** |

Ngưỡng "tốt / chưa tốt" cho từng chỉ số: **NOT_DECIDED** — cần 4–6 tuần dữ liệu thật trước khi đặt ngưỡng.

## Nhịp làm việc
| Khi nào | Việc | Ai |
|---|---|---|
| 2–3 ngày sau khi đăng | Nhập chỉ số + câu hỏi khách hàng | Người |
| Hằng tuần | Tạo yêu cầu nghiên cứu từ câu hỏi mới → `/nghien-cuu` | Người bấm, Agent 01 phân tích |
| Hằng tuần | Duyệt insight đề xuất; chọn 1–2 insight làm brief mới | Người |
| Hằng tuần | Ghi bài học cho video đã đo → LEARNING_CAPTURED | Người (Agent 01 đề xuất bằng prompt "Rút bài học") |
| Hằng tháng | Xem lại tiêu chí Quality Gate và luật trong `config/compliance-rules.json`; mọi thay đổi ghi `decision-log.md` | Người |

## Không làm
- Không suy ra hiệu quả sản phẩm từ chỉ số video.
- Không đưa bình luận có tên, số điện thoại, ảnh khách vào hệ thống.
- Không tự động hóa đăng bài hay trả lời khách.
