# Quy chế phê duyệt nội dung & kiểm soát rủi ro
Nguồn: PART-04 · Cập nhật: 2026-10-06
Bổ sung cho `content/qa-checklist.md` (PART-03) và `compliance/claim-policy.md`. Khi mâu thuẫn, áp dụng quy định chặt hơn.

## 1. Phân chia trách nhiệm
| Việc | AI (Agent) | Con người |
|---|---|---|
| Nghiên cứu, phân loại dữ liệu thô | Làm | Cung cấp dữ liệu đã ẩn danh |
| Đề xuất insight | Làm (HYPOTHESIS) | **Duyệt** |
| Soạn Content Brief | Soạn nháp | **Duyệt brief** |
| Viết hook, kịch bản, VSL, caption, gợi ý tư liệu | Làm | Sửa, chọn |
| Kiểm tra cấu trúc, từ cấm, claim | Làm | Xem báo cáo |
| Kiểm chứng claim sản phẩm | Không | **Làm** (đưa tài liệu, duyệt) |
| Quyết định từ ngữ nhạy cảm | Không | **Làm** |
| Quay video, hậu kỳ (CapCut/Vbee) | Không | **Làm** |
| Tư vấn trực tiếp khách hàng | Chuẩn bị câu hỏi | **Làm** |
| Chuyển sang APPROVED_TO_RECORD / APPROVED_TO_PUBLISH | **Không bao giờ** | **Làm** |
| Xuất bản | **Không bao giờ** | **Làm** |
| Cam kết tư vấn y tế/sản phẩm với khách | **Không bao giờ** | **Làm** |

## 2. Vòng đời nội dung
`IDEA → DRAFT → NEEDS_SOURCE → NEEDS_REVIEW → APPROVED_TO_RECORD → RECORDED → EDITED → APPROVED_TO_PUBLISH → PUBLISHED → MEASURED → LEARNING_CAPTURED`

| Trạng thái | Ý nghĩa | Ai được chuyển vào | Điều kiện |
|---|---|---|---|
| IDEA | Ý tưởng / brief nháp | AI hoặc người | — |
| DRAFT | Đang viết kịch bản | AI hoặc người | `brief_approved_by` là tên người |
| NEEDS_SOURCE | Còn claim chưa APPROVED hoặc dữ liệu thiếu | AI hoặc người | Có nhãn "CHỜ CLAIM ĐƯỢC PHÊ DUYỆT" |
| NEEDS_REVIEW | Chờ con người duyệt cuối | AI hoặc người | Agent 03 không còn lỗi CHẶN |
| APPROVED_TO_RECORD | Cho phép quay | **Chỉ người** | Mọi claim đã APPROVED; `record_approved_by` + ngày |
| RECORDED | Đã quay | Người | — |
| EDITED | Đã dựng xong | Người | — |
| APPROVED_TO_PUBLISH | Cho phép đăng | **Chỉ người — bắt buộc** | Xem bản dựng cuối; `publish_approved_by` + ngày; chạy lại kiểm tra tự động không FAIL |
| PUBLISHED | Đã đăng | Người | `published_url` |
| MEASURED | Đã ghi chỉ số | Người | Mục 5 của file |
| LEARNING_CAPTURED | Đã rút bài học | Người (Agent 01 đề xuất) | Bài học được duyệt |

**Quy định tuyệt đối:** không nội dung nào được ở trạng thái `APPROVED_TO_PUBLISH` trở đi nếu `publish_approved_by` không phải tên một con người. `tools/check_content.py` báo FAIL khi trường này trống hoặc ghi AI/Claude/Agent/bot.

## 3. Các điểm phê duyệt của con người (Human-in-the-loop)
| # | Điểm | Vị trí trong pipeline | Người duyệt |
|---|---|---|---|
| H1 | Human Insight Approval | Sau Agent 01, trước Content Brief | Dược sĩ Lê Hương |
| H2 | Duyệt Content Brief | Trước Agent 02 | Dược sĩ Lê Hương |
| H3 | Duyệt claim (UNVERIFIED → VERIFIED → APPROVED) | Bất kỳ lúc nào, trước H4 | Chuyên môn + pháp lý — **CHƯA QUYẾT ĐỊNH (C-24)** |
| H4 | Human Final Approval → APPROVED_TO_RECORD | Sau Agent 03 | Dược sĩ Lê Hương (+ pháp lý nếu nhắc sản phẩm) |
| H5 | APPROVED_TO_PUBLISH | Sau dựng video | Dược sĩ Lê Hương (+ pháp lý nếu nhắc sản phẩm) |
| H6 | Duyệt bài học → cập nhật chiến lược | Sau MEASURED | Dược sĩ Lê Hương |

Đề xuất mặc định (CẦN CHỦ THƯƠNG HIỆU XÁC NHẬN, liên quan C-24): nội dung **không** nhắc sản phẩm do Dược sĩ Lê Hương tự duyệt H4/H5; nội dung nhắc sản phẩm, VSL, video bán hàng cần thêm người duyệt pháp lý.

## 4. Mức rủi ro và xử lý
| Mức | Ví dụ | Xử lý |
|---|---|---|
| CHẶN | Từ cấm; nhắc sản phẩm không có claim; claim chưa APPROVED mà đòi quay/đăng; AI tự duyệt đăng | Không được đi tiếp; sửa bản thảo hoặc bổ sung nguồn |
| CẦN DUYỆT | Cụm tuyệt đối; độ tuổi cụ thể (C-01); "trọn đời" (C-06); tuyên bố sức khỏe chung | Con người quyết định giữ/sửa, ghi vào nhật ký trạng thái |
| GỢI Ý | Giọng văn, độ dài, hook | Tùy người viết |

## 5. Dữ liệu khách hàng
- Không đưa tên, số điện thoại, địa chỉ, ảnh, hồ sơ bệnh của khách thật vào git.
- Dữ liệu tư vấn lưu trong `private/` (đã có trong `.gitignore`).
- Verbatim dùng cho nghiên cứu phải ẩn danh trước khi đưa vào `research/`.
- Câu chuyện khách hàng chỉ công khai khi có đồng ý (quy trình xin đồng ý: CHƯA QUYẾT ĐỊNH, C-20).

## 6. Sự cố
Phát hiện nội dung đã đăng vi phạm → gỡ hoặc ẩn (con người làm), ghi vào `decision-log.md` mục mâu thuẫn/sự cố, Agent 01 cập nhật bài học.
