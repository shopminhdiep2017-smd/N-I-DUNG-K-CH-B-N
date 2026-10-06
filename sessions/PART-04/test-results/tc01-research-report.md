# Báo cáo nghiên cứu RS-TEST-20261006-01
Yêu cầu: RR-TEST-01 · Agent: 01 · Ngày: 2026-10-06 · Trạng thái: CHỜ CON NGƯỜI DUYỆT

> **KIỂM THỬ PART-04 (TC1) — DỮ LIỆU GIẢ LẬP.** Không phải khách hàng thật. Không dùng làm bằng chứng cho bất kỳ insight, claim hay quyết định chiến lược nào. Báo cáo lưu tại `sessions/PART-04/test-results/`, không lưu vào `research/reports/`.
> Nguồn đầu vào: `tests/fixtures/tc01-research-request.md`. Nguồn đối chiếu: `strategy/customer-insights.md`, `strategy/positioning.md`, `strategy/big-idea.md`, `strategy/message-house.md`, `research/customer-language/verbatims.md`, `research/objections/objections.md`, `brand/customer-persona.md`, `decision-log.md` (Mâu thuẫn mở), `content/content-pillars.md`, `compliance/claim-registry.md`.

## 1. Dữ liệu đầu vào
Nguyên văn giữ nguyên, không chỉnh sửa.

| Mã | Nguyên văn | Nguồn | Đã ẩn danh |
|---|---|---|---|
| D1 | "Tối nào tôi cũng tỉnh dậy lúc 2-3 giờ sáng rồi nằm trằn trọc tới sáng." | Bình luận giả lập, 2026-10-01 | Có |
| D2 | "Mua trên mạng mấy hộp rồi, không biết thật giả thế nào, giờ sợ không dám mua nữa." | Tin nhắn giả lập, 2026-10-02 | Có |
| D3 | "Con tôi bảo đi khám nhưng tôi ngại, sợ khám ra bệnh lại lo." | Ghi chú tư vấn giả lập, 2026-10-03 | Có |
| D4 | "Có phải tê tay là sắp bị tai biến không chị?" | Bình luận giả lập, 2026-10-04 | Có |
| D5 | "Uống thuốc huyết áp rồi thì uống thêm mấy cái này được không?" | Tin nhắn giả lập, 2026-10-05 | Có |

Kiểm tra ẩn danh: không có tên, số điện thoại, địa chỉ trong 5 dòng → không kích hoạt điều kiện dừng về dữ liệu nhận diện.

## 2. Phân loại
| Mã | Loại | Liên kết hiện có (V-xx, OBJ-xx, INS-xx) | Mới? |
|---|---|---|---|
| D1 | Nỗi đau (mất ngủ, thức giấc giữa đêm) | Triệu chứng "mất ngủ kinh niên", "mất ngủ trắng đêm" trong `brand/customer-persona.md`; INS-01 (mong muốn "ngủ sâu giấc hơn") | Không mới về chủ đề; mới về câu chữ verbatim |
| D2 | Rào cản (sợ hàng giả, mất niềm tin mua online → ngừng mua) | INS-01; V-04 "Uống đủ thứ tiền mất tật mang"; rào cản "sợ hàng giả/nhái" trong persona; gần OBJ-01 (sợ bị lừa) | Không mới — trùng INS-01 |
| D3 | Rào cản (ngại đi khám, sợ biết bệnh) | V-03 "Sợ thành gánh nặng cho con cháu" (chỉ liên quan chủ đề gia đình); persona: "trì hoãn đến khi bệnh nặng" | **Mới** — chưa có V/OBJ/INS nào nói về né tránh đi khám |
| D4 | **Câu hỏi cần Dược sĩ trả lời** (câu hỏi y khoa: triệu chứng ↔ tai biến) | Nỗi sợ "đột quỵ/tai biến" trong persona; INS-01; liên quan P2 (C-18), CLM-024 (C-13) | Mới về dạng câu hỏi |
| D5 | **Câu hỏi cần Dược sĩ trả lời** (câu hỏi dùng chung với thuốc huyết áp / tương tác thuốc) | Gần OBJ-03 (lo an toàn khi dùng TPCN, C-12) nhưng khác nội dung; liên quan C-02/CLM-011 (Q10–huyết áp, UNVERIFIED) | **Mới** — chưa có OBJ về dùng chung với thuốc đang điều trị |

Tổng hợp: câu hỏi 2 (D4, D5) · nỗi đau 1 (D1) · rào cản 2 (D2, D3) · niềm tin 0 · phản đối 0 · khác 0.

Agent 01 **không** giải thích nguyên nhân hay trả lời nội dung y khoa của D1, D4, D5 (quy tắc 7).

## 3. Insight đề xuất
| Mã | Insight "Tôi muốn… nhưng… bởi vì…" | Dữ liệu hỗ trợ | Độ mạnh bằng chứng | Trạng thái |
|---|---|---|---|---|
| PINS-01 | "Tôi muốn biết tình trạng sức khỏe của mình (con tôi cũng bảo đi khám), nhưng tôi ngại đi khám, bởi vì tôi sợ khám ra bệnh lại lo." | D3 | **Bằng chứng yếu** (1 dòng, dữ liệu giả lập) | HYPOTHESIS |
| PINS-02 | "Tôi muốn dùng thêm sản phẩm hỗ trợ, nhưng tôi chưa dám dùng, bởi vì tôi đang uống thuốc huyết áp và không biết dùng chung có được không." | D5 (diễn giải "chưa dám dùng" là suy luận từ câu hỏi, chưa có xác nhận) | **Bằng chứng yếu** (1 dòng, dữ liệu giả lập) | HYPOTHESIS |
| PINS-03 | "Tôi muốn hiểu dấu hiệu cơ thể mình (tê tay), nhưng tôi lo lắng, bởi vì tôi sợ đó là dấu hiệu sắp bị tai biến." | D4; nỗi sợ đột quỵ/tai biến trong persona (USER-PROVIDED, CHƯA CÓ NGUỒN) | **Bằng chứng yếu** (1 dòng dữ liệu, giả lập) | HYPOTHESIS |

Không đề xuất insight mới từ D2: D2 trùng INS-01 (sợ hàng giả, "tiền mất tật mang"). Nếu là dữ liệu thật, D2 có thể là dữ liệu nguồn cho INS-01 (C-10) — nhưng vì là dữ liệu giả lập, **không** được dùng để nâng trạng thái INS-01.
Không đề xuất insight từ D1 riêng lẻ: chỉ là mô tả nỗi đau, chưa có "nhưng… bởi vì…" trong dữ liệu.

**Trả lời câu hỏi nghiên cứu "khách hàng lo lắng điều gì nhất?":** KHÔNG ĐỦ DỮ LIỆU. 5 dòng, mỗi chủ đề 1 dòng, không có tần suất → không xếp hạng được. Các lo lắng xuất hiện: hàng thật/giả (D2), đi khám phát hiện bệnh (D3), tai biến (D4), dùng chung với thuốc huyết áp (D5).

## 4. Đối chiếu chiến lược
| Mục | Phù hợp / Lệch / Mâu thuẫn | Giải thích |
|---|---|---|
| INS-01 | D2: Phù hợp · PINS-01/02/03: Lệch (bổ sung góc mới) | INS-01 tập trung sợ hàng trôi nổi, thiếu Dược sĩ bảo chứng. PINS-01 (né đi khám), PINS-02 (dùng chung với thuốc), PINS-03 (sợ tai biến) là các góc khác, không phủ định INS-01. |
| INS-02..INS-10 | Không đối chiếu được | Toàn văn CHƯA CÓ NGUỒN; PINS-03 có thể trùng INS-02 (nỗi sợ đột quỵ, giữ chỗ) — con người kiểm tra. |
| Định vị (`strategy/positioning.md`) | Phù hợp, có rủi ro | Người trung niên lo tê bì, mất ngủ, tuần hoàn (D1, D4) khớp đối tượng. Không có dữ liệu độ tuổi → không chạm C-01. PINS-02/PINS-03 dễ đẩy thương hiệu sang vai trò tư vấn chẩn đoán/điều trị — mâu thuẫn tiềm ẩn với "không thay thế chẩn đoán" (C-04, C-15). |
| Big Idea "Hiểu đúng cơ thể, chọn đúng chuyên gia" | Phù hợp | PINS-01, PINS-03 khớp "hiểu đúng cơ thể"; PINS-01 hướng tới đi khám đúng nơi (bác sĩ) thay vì né tránh. |
| Message House MSG-01 | Lệch, cần duyệt | Nội dung trả lời D1/D4 theo MSG-01 sẽ cần tuyên bố y khoa (CLM-024 UNVERIFIED, C-13, C-14). |
| Message House MSG-02 | Mâu thuẫn tiềm ẩn | Trả lời D5 bằng thông tin sản phẩm cần claim an toàn/tương tác — CHƯA CÓ NGUỒN (C-02, C-11, C-12). |
| Ranh giới truyền thông | Phù hợp nếu giữ ranh giới | PINS-01/03 chạm nỗi sợ bệnh tật → không được dùng nỗi sợ để thao túng (CLAUDE.md nguyên tắc 4; C-18). |

## 5. Gợi ý định hướng nội dung
Chỉ là định hướng, không phải ý tưởng/kịch bản. Tất cả phụ thuộc H1 (Human Insight Approval).

| Gợi ý | Giai đoạn 5A | Trụ cột | Insight | Cần claim? |
|---|---|---|---|---|
| Khuyến khích đi khám bác sĩ khi có dấu hiệu bất thường, đồng cảm với nỗi ngại đi khám, không dọa | Aware / Appeal | P2, P8 | PINS-01 | Không cần claim sản phẩm; câu chữ khuyên đi khám cần Dược sĩ duyệt (liên quan C-13) |
| Hỏi – đáp: "đang dùng thuốc điều trị thì có nên dùng thêm TPBVSK?" — Dược sĩ trả lời, hướng hỏi bác sĩ điều trị | Ask | P4 | PINS-02 | **Có** — thông tin an toàn/tương tác CHƯA CÓ NGUỒN → **CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI** |
| Hỏi – đáp về nỗi lo "tê tay có phải dấu hiệu tai biến" — Dược sĩ trả lời, không tự chẩn đoán | Aware / Ask | P2, P4 | PINS-03 | **Có** — tuyên bố y khoa (CLM-024 UNVERIFIED, C-13, C-18) → **CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI** |
| Cách nhận biết kênh mua uy tín (không nêu tên, không bôi nhọ) | Ask | P3 | INS-01 (D2) | Không cần claim sản phẩm; quy tắc P3 chưa chốt (C-19) |

## 6. CẦN CON NGƯỜI QUYẾT ĐỊNH
- **Dữ liệu giả lập:** toàn bộ báo cáo là kiểm thử; không đưa PINS-01..03 vào `strategy/customer-insights.md`, không dùng D2 làm nguồn cho INS-01 (C-10).
- **D4 — câu hỏi y khoa (triệu chứng ↔ tai biến):** chuyển Dược sĩ Lê Hương trả lời. Agent 01 không giải thích nguyên nhân. Nội dung công khai liên quan cần claim (CLM-024) và quy tắc P2 (C-18).
- **D5 — câu hỏi dùng chung với thuốc huyết áp / tương tác thuốc:** chuyển Dược sĩ Lê Hương trả lời (và khuyến nghị người hỏi trao đổi với bác sĩ điều trị — câu chữ cần Dược sĩ duyệt). Thông tin an toàn/tương tác: CHƯA CÓ NGUỒN. Đề xuất cân nhắc thêm OBJ mới vào `research/objections/` — con người quyết định.
- **Điều kiện dừng "insight cần claim chưa có nguồn" đã kích hoạt** cho hướng nội dung của PINS-02 và PINS-03 → dừng phần nội dung đó cho tới khi có claim APPROVED.
- **H1 — Human Insight Approval:** duyệt/loại PINS-01, PINS-02, PINS-03; kiểm tra PINS-03 có trùng INS-02 (toàn văn CHƯA CÓ NGUỒN) không.
- **Câu hỏi "lo lắng nhất":** cần thêm dữ liệu thật, có tần suất, để trả lời.
- Không phát hiện mâu thuẫn mới với độ tuổi/định vị đã lưu; không phát hiện dữ liệu nhận diện khách hàng.
