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
