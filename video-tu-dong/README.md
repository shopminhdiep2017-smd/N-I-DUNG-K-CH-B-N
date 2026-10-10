# Video tự động — thả video vào, nhận video hoàn chỉnh

Bộ cài này tải [video-use](https://github.com/browser-use/video-use) về máy bạn và tạo sẵn thư mục
**VIDEO-TU-DONG** trên Desktop. Bạn chỉ cần thả video vào, máy sẽ tự cắt phần ấp úng và khoảng lặng,
thêm phụ đề rồi xuất video hoàn chỉnh.

## Cần chuẩn bị (một lần)
1. **Tài khoản Claude** (gói Pro/Max) để chạy Claude Code.
2. **Khóa API ElevenLabs** (dùng để nhận dạng giọng nói, tốn phí theo số phút):
   https://elevenlabs.io/app/settings/api-keys

## Cài đặt
1. Trên trang GitHub của kho này: **Code → Download ZIP**, rồi giải nén.
2. Mở thư mục `video-tu-dong`:
   - **Windows:** bấm đúp `CAI-DAT-WINDOWS.bat`.
   - **macOS:** chuột phải `CAI-DAT-MAC.command` → **Open**. Nếu bị chặn, mở Terminal và gõ
     `bash ` (có dấu cách), kéo file vào cửa sổ Terminal rồi nhấn Enter.
3. Làm theo hướng dẫn trên màn hình: dán khóa ElevenLabs, rồi đăng nhập Claude (đăng nhập xong gõ `/exit`).

## Sử dụng hằng ngày
1. Mở **Desktop → VIDEO-TU-DONG**, bấm đúp **BAT-DAU** (`.bat` trên Windows, `.command` trên Mac).
   Giữ cửa sổ đen đó mở.
2. Thả video vào **1-THA-VIDEO-VAO-DAY**:
   - 1 file video → ra 1 video hoàn chỉnh.
   - 1 **thư mục** chứa nhiều đoạn quay → ghép thành 1 video.
3. Đợi (thường vài phút tới vài chục phút). Kết quả nằm trong **2-VIDEO-HOAN-CHINH**.

Muốn đổi phong cách (video dọc TikTok, độ dài, kiểu phụ đề, màu...) thì sửa file **yeu-cau.txt** bằng tiếng Việt.

| Thư mục | Ý nghĩa |
|---|---|
| `1-THA-VIDEO-VAO-DAY` | Nơi thả video |
| `2-VIDEO-HOAN-CHINH` | Video đã dựng xong |
| `_dang-xu-ly` | Video đang được dựng |
| `_da-xong` | Video gốc và các file trung gian của video đã xong |
| `_loi` | Video bị lỗi, xem nguyên nhân trong `_nhat-ky` |
| `_nhat-ky` | Nhật ký từng lần dựng |

## Lưu ý
- Máy xử lý lần lượt từng video. Tắt cửa sổ BAT-DAU là dừng. Lần mở sau, video đang dở sẽ được làm lại.
- Claude chạy ở chế độ tự động: được phép chạy lệnh trong thư mục video mà không hỏi lại.
- Mỗi video tốn lượt dùng Claude và phí ElevenLabs.
- video-use được cài ở `~/.claude/skills/video-use`. Chạy lại bộ cài để cập nhật bản mới.
