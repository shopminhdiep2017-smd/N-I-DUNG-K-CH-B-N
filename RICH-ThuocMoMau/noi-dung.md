# Đang uống thuốc mỡ máu thì có uống được Q10 không?

## Video đã dựng – bản 1

`Video_ThuocMoMauQ10_ban_1.mp4` (9:16, giữ nguyên 480x854 như video gốc, 1 phút; video gốc 1 phút 2 giây):

- Không có câu nói lặp; nối liền các câu, bỏ các chỗ ngừng dài.
- Khớp miệng: video gốc ~20 khung hình/giây được chuyển về đúng 30 khung hình/giây trước khi cắt; hình và tiếng dài bằng nhau (59,93 giây); đã kiểm tra ở 5 thời điểm, lệch ≤ 1–2 khung hình.
- Giữ nguyên hình ảnh gốc và phụ đề có sẵn, xuất chất lượng cao (CRF 16).
- Lọc ồn nền (RNNoise và afftdn), giọng chuẩn hóa −17 LUFS.
- Phía trên đầu, căn giữa giữa mép trên và đỉnh đầu (đỉnh đầu ~310/854 px, khung 272x184 px đặt ở 63 px): 7 footage 3D theo từng ý, và ảnh sản phẩm RICH (zoom chậm) từ lúc nói "Rich CoQ10 của nhà AFC Nhật Bản" đến hết phần giới thiệu sản phẩm. Người nói không cầm hộp sản phẩm.
- Dòng cảnh báo "Thực phẩm này không phải là thuốc…" dưới đáy từ lúc có ảnh sản phẩm đến hết.
- Nhạc "Gió nơi rời" âm lượng 0,11 (nhỏ hơn giọng ~22 dB).

## Cần lưu ý nội dung

- Video nói "Q10… rất hợp với người lớn tuổi", "một lựa chọn đáng cân nhắc" khi đang dùng statin — đã kèm lời khuyên hỏi bác sĩ và không tự ý bỏ thuốc; nên giữ nguyên các câu này khi đăng.

## Bản 2 – bỏ footage, chỉ chèn ảnh Q10 khi nhắc đến

`Video_ThuocMoMauQ10_ban_2.mp4`: giống bản 1 (khớp miệng, giữ hình gốc và phụ đề, lọc ồn, nhạc 0,11) nhưng:

- Bỏ toàn bộ footage 3D.
- Chỉ hiện ảnh sản phẩm RICH (hiện/ẩn mờ dần) mỗi khi nhắc đến Q10: "…có uống được Q10 không?"; "…tạo ra Q10… lượng Q10 trong máu… tìm đến Q10"; "…thay bằng Q10"; "Rich Coenzyme Q10 của nhà AFC Nhật Bản…" đến hết phần giới thiệu sản phẩm.
- Dòng cảnh báo dưới đáy hiện từ lần đầu có ảnh sản phẩm đến hết.
- Dựng bằng `dung-video/v21build_b.py`.
