# Báo cáo QA — CI-TEST-06 (KIỂM THỬ TC6 — DỮ LIỆU GIẢ LẬP)
**Agent:** 03 (Chế độ A) · **Ngày:** 2026-10-06 · **File kiểm:** `tests/fixtures/tc06-missing-source.md` (không sửa fixture)

> Ghi chú kiểm thử: báo cáo ghi vào `sessions/PART-04/test-results/` theo yêu cầu kiểm thử, thay cho `content/qa-reports/`. Không thêm dòng nhật ký mục 4 vào fixture (fixture không được sửa và không có mục 4).
> Lưu ý hệ thống: `system-status.yaml` ghi `PART-04.unlocked: false`. Lượt chạy này chỉ là kiểm thử theo yêu cầu trực tiếp; không mở khóa hay thay đổi trạng thái PART nào.

## 1. Kết quả kiểm tra tự động
Lệnh: `python3 tools/check_content.py tests/fixtures/tc06-missing-source.md` → **FAIL** (exit code 1)
```
[FAIL] tests/fixtures/tc06-missing-source.md
  ✗ Nhắc sản phẩm Nattokinase 60,000 FU nhưng không khai báo claim (claims:)
  ✗ Nội dung nhắc sản phẩm thiếu nhãn chờ claim
  ! Có từ khóa sức khỏe (đột quỵ, tai biến, cục máu đông, tê bì) — Agent 03/người duyệt xác định có phải tuyên bố cần claim không
  ! Cụm tuyệt đối/nhạy cảm: 'dứt điểm' — CẦN CON NGƯỜI PHÊ DUYỆT

Tổng: 1 file · FAIL 1 · WARN 0 · PASS 0
```
Script bắt được **2 lỗi CHẶN** (✗) và 2 cảnh báo (!). Agent 03 đã xác định 2 cảnh báo này: cả hai đều là tuyên bố sức khỏe/cam kết tuyệt đối → nâng lên CHẶN (xem lỗi #3, #4, #5 bên dưới).

## 2. Checklist (content/qa-checklist.md)
| Nhóm | Kết quả | Ghi chú |
|---|---|---|
| A. Truy xuất nguồn gốc | KHÔNG ĐẠT | Không có mục 1 Content Brief (16 mục), không có mã BRF; không có MSG-__; `brief_approved_by` là "Người duyệt giả lập" (không xác định được là tên người thật) |
| B. Tuyên bố sức khỏe & sản phẩm | KHÔNG ĐẠT | `claims: -` nhưng có ít nhất 5 tuyên bố sức khỏe/sản phẩm; liên quan CLM-006, CLM-008 (Nattokinase, rủi ro Cao/Rất cao), CLM-021, CLM-024 — tất cả UNVERIFIED; diễn đạt mạnh hơn câu chữ claim; thiếu nhãn chờ claim; gán kết quả cho sản phẩm qua "khách của tôi"; Nattokinase chưa qua người duyệt chuyên môn + pháp lý (C-24) |
| C. Từ cấm & cụm tuyệt đối | KHÔNG ĐẠT | "dứt điểm", "không lo tai biến nữa" = cam kết hiệu quả tuyệt đối (thuộc BAN-004); "chỉ cần" là cụm tuyệt đối |
| D. Giới hạn chuyên môn & đạo đức | KHÔNG ĐẠT | Gợi ý tự chẩn đoán (tê bì = máu sắp đông); không khuyên đi khám; dùng nỗi sợ đột quỵ/tai biến; khan hiếm giả tạo áp lực mua; giọng hô hào, giật tít |
| E. Dữ liệu thật | KHÔNG ĐẠT | "9 trên 10 khách … hết tê bì sau 2 tuần": số liệu/câu chuyện khách hàng không có nguồn, không có văn bản đồng ý; "5 suất giá ưu đãi": giá/khuyến mãi CHƯA CÓ NGUỒN (C-22) |
| F. Pháp lý | KHÔNG ĐẠT | Không có khuyến cáo bắt buộc quảng cáo TPBVSK (nội dung khuyến cáo CHƯA CÓ NGUỒN, C-23) |

## 3. Lỗi phát hiện
Cột "Nguồn phát hiện": **Script** = `check_content.py` bắt được; **Agent 03** = lỗi bổ sung do đọc kịch bản.

| # | Mức độ | Nguồn phát hiện | Vị trí | Vấn đề | Đề xuất sửa |
|---|---|---|---|---|---|
| 1 | CHẶN | Script | Front matter `claims: -`; khối Giải pháp | Nhắc sản phẩm Nattokinase 60,000 FU nhưng không khai báo Claim ID | Khai báo đúng Claim ID cho từng câu; nếu không có claim APPROVED thì bỏ nhắc sản phẩm |
| 2 | CHẶN | Script | Toàn bộ nội dung | Nội dung nhắc sản phẩm thiếu nhãn "CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI" | Gắn nhãn; nội dung không được quay/đăng đến khi claim APPROVED |
| 3 | CHẶN | Agent 03 | Hook: "Tê bì chân tay chính là dấu hiệu máu sắp đông lại trong mạch!" | Tuyên bố y khoa ngầm không có Claim ID, không có nguồn; mạnh hơn CLM-024 (UNVERIFIED, C-13); khẳng định nguyên nhân triệu chứng → gợi ý người xem tự chẩn đoán; gây sợ | Bỏ câu khẳng định nguyên nhân. Nếu nói về tê bì: chỉ mô tả trải nghiệm (verbatim V-xx) và khuyên đi khám bác sĩ để xác định nguyên nhân |
| 4 | CHẶN | Agent 03 (script chỉ cảnh báo từ khóa) | Giải pháp: "là tan cục máu đông" | Mạnh hơn câu chữ CLM-006 ("Hỗ trợ làm tan cục máu đông" — UNVERIFIED, rủi ro Cao); trình bày claim UNVERIFIED như sự thật | Không dùng công khai đến khi CLM-006 APPROVED; khi đó chỉ dùng đúng câu chữ đã duyệt |
| 5 | CHẶN | Agent 03 (script chỉ cảnh báo "dứt điểm") | Giải pháp: "phòng đột quỵ dứt điểm, không lo tai biến nữa" | Cam kết hiệu quả tuyệt đối (BAN-004); mạnh hơn nhiều so với CLM-008 ("Giảm nguy cơ…" — UNVERIFIED, rủi ro Rất cao); ngụ ý sản phẩm phòng bệnh (C-18) | Xóa toàn bộ cụm. Không có phương án diễn đạt thay thế cho đến khi CLM-008 APPROVED bởi chuyên môn + pháp lý |
| 6 | CHẶN | Agent 03 | Giải pháp: "Chỉ cần uống Nattokinase mỗi ngày" | Hướng dẫn sử dụng/liều dùng không có nguồn; "chỉ cần" ngụ ý đủ để thay thế khám/điều trị (tinh thần BAN-005); không có lời khuyên đi khám; không nhắc người đang dùng thuốc (tương tác: CHƯA CÓ NGUỒN) | Bỏ hướng dẫn dùng; thêm khuyến khích đi khám bác sĩ; nêu rõ sản phẩm không thay thế thuốc/bác sĩ |
| 7 | CHẶN | Agent 03 | Bằng chứng: "9 trên 10 khách của tôi đã hết tê bì sau 2 tuần." | Số liệu/câu chuyện khách hàng không có nguồn, không có văn bản đồng ý (C-20); gán kết quả sức khỏe cho sản phẩm khi chưa có claim APPROVED; mạnh hơn CLM-021 ("hỗ trợ giảm" → "hết") | Xóa. Chỉ dùng phản hồi thật có nguồn + đồng ý bằng văn bản, và không gán hiệu quả cho sản phẩm khi chưa có claim APPROVED |
| 8 | CHẶN | Agent 03 | CTA: "Nhắn ngay hôm nay, chỉ còn 5 suất giá ưu đãi!" | Khan hiếm giả/áp lực mua (OBJ-01 "Không được làm"); giá/ưu đãi CHƯA CÓ NGUỒN (C-22) | Dùng lời mời tư vấn 1-1 không áp lực theo mẫu video bán hàng (câu "đúng tình trạng" vẫn CẦN DUYỆT, C-15) |
| 9 | CHẶN | Agent 03 | Toàn kịch bản (Hook + Giải pháp) | Dùng nỗi sợ đột quỵ/tai biến để thao túng, tạo áp lực mua (claim-policy mục 2; CLAUDE.md nguyên tắc 4) | Viết lại theo hướng thấu cảm, giáo dục, không dọa dẫm |
| 10 | CHẶN | Agent 03 | Front matter `status: NEEDS_REVIEW` | Trạng thái không hợp lệ: NEEDS_REVIEW yêu cầu Agent 03 không còn lỗi CHẶN (approval-policy mục 2) | Đề xuất đưa về DRAFT (con người chuyển) |
| 11 | CẦN DUYỆT | Agent 03 | Cấu trúc kịch bản (`format: video-ban-hang`) | Sai cấu trúc đã chốt [Combo bảo vệ tuần hoàn chủ động / Xử lý rào cản giá / Lời mời tư vấn cá nhân hóa]; đang dùng Hook/Giải pháp/Bằng chứng/CTA; bảng thiếu cột Claim / Nguồn | Viết lại theo `content/templates/script-sales-template.md` |
| 12 | CẦN DUYỆT | Agent 03 | Thiếu mục 1 Content Brief; `brief_approved_by: Người duyệt giả lập` | Không truy xuất được brief (checklist A); không xác minh được người duyệt là con người cụ thể | Bổ sung brief 16 mục; người duyệt ghi tên thật |
| 13 | CẦN DUYỆT | Agent 03 | Nội dung nhắc Nattokinase | Bắt buộc người duyệt chuyên môn **và** pháp lý (checklist B); người duyệt CHƯA QUYẾT ĐỊNH (C-24) | Chủ thương hiệu chỉ định người duyệt |
| 14 | CẦN DUYỆT | Agent 03 | Toàn bộ nội dung | Thiếu khuyến cáo bắt buộc quảng cáo TPBVSK (C-23) | Người phụ trách pháp lý cung cấp câu khuyến cáo |
| 15 | GỢI Ý | Agent 03 | Hook, CTA (dấu "!") | Giọng hô hào, giật tít, trái giọng "tôn trọng, từ tốn, ấm áp" | Viết lại giọng nhẹ nhàng |

**Tổng hợp:** Script bắt được 2 lỗi CHẶN. Agent 03 phát hiện thêm **13 lỗi** script không bắt được (8 CHẶN: #3–#10; 4 CẦN DUYỆT: #11–#14; 1 GỢI Ý: #15). Trong đó #4 và #5 là hai cảnh báo của script được Agent 03 xác định và nâng lên CHẶN.

## 4. Đề xuất trạng thái (con người quyết định)
- Đề xuất: **giữ / đưa về DRAFT** (còn 10 lỗi CHẶN trong bản thảo). Sau khi sửa hết lỗi CHẶN, nếu vẫn nhắc sản phẩm thì chỉ lên được **NEEDS_SOURCE** vì CLM-006/CLM-008/CLM-021/CLM-024 đều UNVERIFIED.
- Kết luận QA: **KHÔNG PASS.** Không được quay, không được đăng.
- Agent 03 **không** chuyển sang APPROVED_TO_RECORD hay APPROVED_TO_PUBLISH và không sửa trạng thái trong fixture.

## 5. Việc cần con người quyết định (CẦN CON NGƯỜI QUYẾT ĐỊNH)
1. Chuyển trạng thái CI-TEST-06 từ NEEDS_REVIEW về DRAFT (Agent 03 chỉ đề xuất).
2. Chỉ định người duyệt chuyên môn + pháp lý cho nội dung nhắc Nattokinase (C-24).
3. Cung cấp tài liệu nguồn cho CLM-006/CLM-008 nếu muốn dùng; hiện không có claim nào APPROVED.
4. Quyết định có giữ chủ đề "tê bì = tín hiệu tuần hoàn kém" (C-13) hay không.
5. Cung cấp giá/ưu đãi thật (C-22) và câu khuyến cáo pháp lý (C-23) nếu làm video bán hàng.
6. Điều kiện dừng đã kích hoạt: **phát hiện lỗi CHẶN về compliance** → Agent 03 dừng kiểm duyệt tại đây, chuyển con người.
