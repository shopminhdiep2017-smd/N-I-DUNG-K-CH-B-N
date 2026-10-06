# Phân loại insight — TC2 (Kiểm thử PART-04)
Agent: 01 · Ngày: 2026-10-06 · Trạng thái: CHỜ CON NGƯỜI DUYỆT
Đầu vào: `tests/fixtures/tc02-insight-candidate.md` (DỮ LIỆU GIẢ LẬP). Dữ liệu gốc: D3 trong `tests/fixtures/tc01-research-request.md`.
Đối chiếu: `strategy/customer-insights.md` (INS-01, C-10), `strategy/positioning.md`, `strategy/big-idea.md`, `strategy/message-house.md`, `research/customer-language/verbatims.md` (V-03), `brand/customer-persona.md`, `decision-log.md`.

## Kết quả phân loại
| Insight | Trạng thái | Độ mạnh bằng chứng | Đối chiếu INS-01 / định vị | Việc cần con người quyết định |
|---|---|---|---|---|
| PINS-01 (tạm): "Tôi muốn biết rõ tình trạng sức khỏe của mình, nhưng tôi né tránh đi khám, bởi vì tôi sợ phát hiện ra bệnh nặng sẽ thành gánh nặng cho con cháu." | **HYPOTHESIS** (GIẢ THUYẾT CẦN KIỂM CHỨNG) — **không** phải insight đã xác minh. Không VERIFIED, không phải INS-xx. | **Bằng chứng yếu**: chỉ 1 dòng dữ liệu (D3), và D3 là dữ liệu giả lập → giá trị bằng chứng thực tế = 0. | **INS-01: Lệch (bổ sung, không mâu thuẫn).** INS-01 nói về sợ hàng trôi nổi và thiếu Dược sĩ bảo chứng; insight này nói về né tránh đi khám. Chủ đề "gánh nặng cho con cháu" trùng V-03 (CHƯA CÓ NGUỒN) và có thể trùng INS-03 (giữ chỗ, toàn văn CHƯA CÓ NGUỒN). **Định vị / Big Idea: Phù hợp** với "hiểu đúng cơ thể" và vai trò không thay thế chẩn đoán — nếu thông điệp là khuyến khích đi khám bác sĩ. **Rủi ro:** khai thác nỗi sợ "phát hiện bệnh nặng" có thể thành dùng nỗi sợ bệnh tật để thao túng (CLAUDE.md nguyên tắc 4; C-18). | 1) Duyệt/loại ở H1 (Human Insight Approval). 2) Xác nhận có trùng INS-03 không (cần toàn văn INS-03). 3) Quyết định câu chữ: giữ nguyên văn khách hay bỏ phần suy luận. 4) Cung cấp dữ liệu khách hàng thật (≥2 nguồn) nếu muốn nâng độ mạnh bằng chứng. 5) Quy tắc thể hiện nội dung chạm nỗi sợ bệnh (C-18). |

## Ghi chú kiểm chứng câu chữ
Insight trong fixture **vượt quá dữ liệu D3**:

| Phần insight | Có trong D3 ("Con tôi bảo đi khám nhưng tôi ngại, sợ khám ra bệnh lại lo.")? |
|---|---|
| "né tránh đi khám" | Có (ngại đi khám) |
| "sợ phát hiện ra bệnh" | Có (sợ khám ra bệnh) |
| "muốn biết rõ tình trạng sức khỏe" | **Không** — suy luận; D3 chỉ cho biết con khuyên đi khám |
| "bệnh nặng" | **Không** — D3 chỉ nói "bệnh" |
| "thành gánh nặng cho con cháu" | **Không** — D3 nói "lại lo". Chủ đề này chỉ có ở V-03 (CHƯA CÓ NGUỒN), không phải dữ liệu của D3 |

Phiên bản bám sát D3 (Agent 01 đề xuất, HYPOTHESIS): "Tôi muốn yên tâm về sức khỏe (con tôi cũng bảo đi khám), nhưng tôi ngại đi khám, bởi vì tôi sợ khám ra bệnh lại lo." — con người chọn giữ phiên bản nào.

## Kết luận
- Trạng thái: **HYPOTHESIS** — không được coi là sự thật, không được dùng cho Content Brief trước H1.
- Không cần claim sản phẩm để phát biểu insight; nội dung khuyên đi khám vẫn cần Dược sĩ duyệt câu chữ.
- Không sửa `strategy/customer-insights.md` (Agent 01 không có quyền ghi).
