# Checklist kiểm tra nội dung & quy trình phê duyệt
Cập nhật: 2026-10-06 · Áp dụng cho mọi brief, kịch bản, VSL trước khi sản xuất và trước khi xuất bản.

## A. Truy xuất nguồn gốc
- [ ] Có Content Brief đầy đủ 16 mục.
- [ ] Ghi rõ khách hàng mục tiêu, giai đoạn 5A, insight (ID), mục tiêu.
- [ ] Thông điệp liên kết Core Message hoặc MSG-__.

## B. Tuyên bố sức khỏe & sản phẩm
- [ ] Mọi tuyên bố sức khỏe/sản phẩm có Claim ID trong `compliance/claim-registry.md`.
- [ ] Claim chưa APPROVED → nội dung mang nhãn **"CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI"**.
- [ ] Không diễn đạt lại claim theo cách mạnh hơn câu chữ được duyệt.
- [ ] Nattokinase (CLM-006, CLM-008): đã qua người duyệt chuyên môn **và** pháp lý.
- [ ] Không gán kết quả sức khỏe cho sản phẩm trong câu chuyện khách hàng khi chưa có claim APPROVED.

## C. Từ cấm và cụm tuyệt đối
- [ ] Không có BAN-001..BAN-005: "chữa khỏi", "đặc trị", "thuốc tiên", cam kết khỏi 100%, "thay thế bác sĩ".
- [ ] Rà các cụm tuyệt đối: "tuyệt đối", "triệt để", "100%", "đúng bệnh", "gốc rễ", "xóa sạch" → nếu dùng công khai phải được duyệt.

## D. Giới hạn chuyên môn & đạo đức
- [ ] Không chẩn đoán, không gợi ý người xem tự chẩn đoán; có khuyến khích đi khám bác sĩ khi nói về triệu chứng.
- [ ] Không dọa dẫm, không dùng nỗi sợ đột quỵ/gánh nặng con cháu để tạo áp lực mua.
- [ ] Không bôi nhọ, không nêu tên sản phẩm/người bán khác khi không có bằng chứng.
- [ ] Không trấn an về độ an toàn (gan thận, tác dụng phụ) khi chưa có nguồn.
- [ ] Giọng: tôn trọng, từ tốn, ấm áp; không hô hào, không giật tít.

## E. Dữ liệu thật
- [ ] Câu chuyện, phản hồi, số liệu khách hàng là thật, có nguồn và có văn bản đồng ý; nếu không → để trống, ghi CHƯA CÓ NGUỒN.
- [ ] Không có số liệu, nghiên cứu, giá, chứng nhận do mô hình tự thêm.

## F. Pháp lý
- [ ] Có khuyến cáo bắt buộc theo quy định quảng cáo TPBVSK (nội dung: CHƯA CÓ NGUỒN, C-23).

## Quy trình phê duyệt
| Bước | Việc | Người thực hiện | Trạng thái nội dung sau bước |
|---|---|---|---|
| 1 | Tạo brief + kịch bản từ template | Người soạn / Claude | Nháp |
| 2 | Tự kiểm theo checklist A–F | Người soạn / Claude | Cần duyệt |
| 3 | Duyệt chuyên môn (claim, kiến thức y dược) | Dược sĩ Lê Hương / người duyệt chuyên môn — CHƯA QUYẾT ĐỊNH | Đã duyệt chuyên môn |
| 4 | Duyệt pháp lý (bắt buộc với nội dung nhắc sản phẩm, VSL, bán hàng) | CHƯA QUYẾT ĐỊNH (C-24) | Đã duyệt |
| 5 | Sản xuất & xuất bản | — | Sẵn sàng xuất bản |

**Không nội dung sức khỏe nào được chuyển sang "Sẵn sàng xuất bản" khi còn claim chưa APPROVED.** Hiện tại: 0 nội dung ở trạng thái Sẵn sàng xuất bản.

## Bổ sung từ PART-04
Vòng đời trạng thái chi tiết và các điểm duyệt H1–H6: xem `approval-policy.md` và `workflows/review-approval.md`. Bộ kiểm tra tự động: `python3 tools/check_content.py`.
