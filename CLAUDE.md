# PERSONAL BRAND AI OS — Dược sĩ Lê Hương

Hệ điều hành thương hiệu cá nhân cho **Dược sĩ Lê Hương**. Repo lưu dữ liệu chiến lược, nội dung và quy trình bán hàng tư vấn qua từng PHẦN (PART) của chương trình. Đọc file này và `system-status.yaml` trước mọi thao tác.

## Nguyên tắc bắt buộc
1. **Không ghi đè dữ liệu đã có.** Đọc file trước khi sửa. Chỉ bổ sung hoặc cập nhật mục thuộc PART đang làm.
2. **Không âm thầm sửa quyết định cũ.** Nếu dữ liệu mới mâu thuẫn với dữ liệu cũ, ghi vào `decision-log.md` (mục Mâu thuẫn mở) và dừng phần liên quan để con người quyết định.
3. **Không bịa dữ liệu.** Không dùng kiến thức có sẵn của mô hình để thêm công dụng, cơ chế, thành phần, liều dùng, nghiên cứu, số liệu, giá, chứng nhận, câu chuyện khách hàng hay ý tưởng nội dung chưa được chủ thương hiệu cung cấp.
4. **Giới hạn chuyên môn:** Không thay thế chẩn đoán hoặc điều trị của bác sĩ. Không cam kết khỏi bệnh 100%. Không dùng nỗi sợ bệnh tật để thao túng.
5. **Từ cấm:** "chữa khỏi", "chữa khỏi bệnh", "đặc trị", "thuốc tiên", cam kết khỏi 100%, "thay thế bác sĩ". Danh sách đầy đủ ở `compliance/claim-registry.md` (mục BAN).
6. **Mọi tuyên bố sức khỏe hoặc sản phẩm** phải liên kết tới một claim trong `compliance/claim-registry.md`. Claim chưa ở trạng thái `APPROVED` thì nội dung đó mang nhãn **"CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI"**.

## Nhãn trạng thái dữ liệu
| Nhãn | Ý nghĩa |
|---|---|
| `VERIFIED` | Có tài liệu nguồn trong repo, phải ghi đường dẫn |
| `APPROVED` | Claim đã VERIFIED **và** được con người phê duyệt dùng công khai |
| `USER-PROVIDED` | Chủ thương hiệu khai báo, chưa có tài liệu đối chiếu |
| `UNVERIFIED` | Tuyên bố sản phẩm/sức khỏe chưa có nguồn |
| `HYPOTHESIS` / `GIẢ THUYẾT CẦN KIỂM CHỨNG` | Giả định chưa có dữ liệu |
| `CHƯA CÓ NGUỒN` | Thiếu dữ liệu/tài liệu |
| `CHƯA QUYẾT ĐỊNH` | Con người chưa chốt |
| `CẦN CON NGƯỜI PHÊ DUYỆT` | Đã có nội dung nhưng phải duyệt trước khi dùng |
| `CẤM` | Cụm từ/tuyên bố bị cấm |

Hiện tại (2026-10-06) **không có claim nào ở trạng thái VERIFIED hoặc APPROVED**.

## Cấu trúc thư mục
```
CLAUDE.md                  Hướng dẫn hệ thống (file này)
system-status.yaml         Trạng thái và khóa/mở khóa các PART
decision-log.md            Quyết định đã lưu + mâu thuẫn mở (C-xx)
changelog.md               Lịch sử thay đổi
brand/                     Hồ sơ chuyên gia, giá trị & giọng nói, phân khúc, khách hàng, chân dung
products/                  Hồ sơ 4 sản phẩm, bảng sản phẩm–nhu cầu–bằng chứng, tài liệu còn thiếu
compliance/                Claim Registry, claim-policy, danh sách cần con người duyệt
research/customer-language/  Ngôn ngữ nguyên bản khách hàng (V-xx)
research/objections/       Phản đối khách hàng (OBJ-xx)
strategy/                  Insight, định vị, lời hứa giá trị, Big Idea, Message House
content/                   Hành trình 5A, trụ cột, ma trận, ngân hàng ý tưởng, QA checklist
content/templates/         Mẫu Content Brief, kịch bản, VSL
sales/                     Tiêu chí khách hàng, câu hỏi khám phá, thư viện phản đối, quy trình tư vấn
sessions/PART-XX/          Bản lưu kết quả từng PART
```

## Quy trình mỗi PART
1. Đọc `CLAUDE.md`, `system-status.yaml`, kết quả các PART trước.
2. Kiểm tra PART đã `unlocked: true` chưa. Nếu chưa thì dừng và báo cáo.
3. So sánh dữ liệu mới với dữ liệu cũ, ghi mâu thuẫn.
4. Lưu kết quả vào đúng thư mục và vào `sessions/PART-XX/`.
5. Cập nhật `decision-log.md`, `changelog.md`, `system-status.yaml`.
6. Chỉ mở khóa PART kế tiếp khi tất cả tiêu chí đạt (hoặc khi chủ thương hiệu quyết định rõ ràng, có ghi trong `decision-log.md`).

## Quy trình phê duyệt nội dung
Xem `content/qa-checklist.md`. Không nội dung sức khỏe nào được đánh dấu "Sẵn sàng xuất bản" khi còn claim chưa `APPROVED`.

## Bổ sung PART-04 — MVP 3 Agent
```
agents/                    Định nghĩa 3 Agent (cấu hình, prompt, schema) — nguồn chính
.claude/agents/            Lớp vỏ subagent cho Claude Code
.claude/commands/          Lệnh tắt: /trang-thai /nghien-cuu /viet-kich-ban /kiem-duyet /chuan-bi-tu-van
approval-policy.md         Vòng đời nội dung (IDEA → … → LEARNING_CAPTURED), điểm duyệt H1–H6
workflows/                 Quy trình hằng ngày, hằng tuần, sản xuất video, kiểm duyệt
templates/                 Mẫu vận hành: content-item, research-request, qa-report, consultation-prep, performance-log
content/items/             Mỗi nội dung một file (front matter có status và chữ ký duyệt)
content/qa-reports/        Báo cáo QA của Agent 03
research/reports/          Báo cáo nghiên cứu của Agent 01
tools/check_content.py     Kiểm tra tự động theo luật cố định
tests/                     Bộ test MVP (dữ liệu giả lập)
private/                   Dữ liệu khách hàng thật — KHÔNG commit (.gitignore)
```
- AI (Claude hoặc Agent) **không bao giờ** điền `*_approved_by`, không chuyển nội dung vượt `NEEDS_REVIEW`, không xuất bản, không gửi tin nhắn cho khách.
- Sau khi sửa file trong `content/items/`, chạy `python3 tools/check_content.py <file>`.

## Bổ sung PART-05 — Dashboard local-first
```
package.json, vite.config.ts   Ứng dụng: npm start → http://127.0.0.1:5173
app/shared/                    Logic Tầng 0: vòng đời, tuân thủ, Quality Gate 100 điểm, Model Router, prompt chuẩn
app/server/                    API đọc/ghi file trong repo (chạy trong Vite, chỉ 127.0.0.1)
app/web/                       Giao diện 11 trang (React + TypeScript)
app/tests/                     Test bắt buộc (npm test)
config/compliance-rules.json   Luật DÙNG CHUNG cho Dashboard và tools/check_content.py
config/model-router.json       Cấu hình tầng 0–3; không chứa tên model hay API key
data/                          insights.json, data-sources.json, approvals.json (nhật ký duyệt), analytics.json
private/                       Dữ liệu khách hàng thật, yêu cầu nghiên cứu — KHÔNG commit
```
- Vòng đời nội dung có **13 trạng thái** (xem `approval-policy.md` mục 7). `DRAFT` cũ = `SCRIPT_DRAFT`, `EDITED` cũ = `EDITING`.
- Thứ tự xử lý: Tầng 0 logic → Tầng 1 Manual Claude Task → Tầng 2/3 API (tắt mặc định). Việc phê duyệt không bao giờ giao AI.
- Sửa luật kiểm tra ở `config/compliance-rules.json`, sau đó chạy `npm test`.
- Dashboard chỉ đọc `brand/`, `strategy/`, `products/`, `compliance/`; thay đổi chiến lược phải ghi `decision-log.md`.
