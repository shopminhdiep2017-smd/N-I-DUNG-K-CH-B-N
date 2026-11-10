# 10 thói quen xấu khiến sức khỏe xuống dốc không phanh

## Video đã dựng – bản 1

`Video_10ThoiQuenXau_ban_1.mp4` (9:16, giữ nguyên 480x854 như video gốc, 24 giây; video gốc 26 giây):

- Không có câu nói lặp; chỉ cắt khoảng lặng đầu/cuối và chỗ ngừng dài.
- Khớp miệng: cắt hình theo số khung hình chính xác, tiếng cắt cùng điểm; hình và tiếng dài bằng nhau (24,30 giây); không đổi tốc độ.
- Giữ nguyên hình ảnh gốc và phụ đề có sẵn, xuất chất lượng cao (CRF 16).
- Lọc ồn nền (RNNoise và afftdn), giọng chuẩn hóa −17 LUFS.
- 11 footage phong cách 3D (mở đầu + 01–10) căn giữa giữa mép trên và đỉnh đầu (đỉnh đầu ~253/854 px, clip đặt ở 34 px), đổi đúng lúc nói từng thói quen; biểu tượng 3D Microsoft Fluent Emoji (MIT).
- Nhạc "Gió nơi rời" âm lượng 0,11 (nhỏ hơn giọng ~22 dB).

## Lời thoại

> Mười thói quen xấu khiến sức khỏe xuống dốc không phanh. Thứ nhất là nhịn ăn sáng. Thứ hai là lười uống nước. Thứ ba là hay thức khuya. Thứ tư là dậy quá sớm. Thứ năm là ăn uống vội vã, không tập trung. Thứ sáu là liên tục tắm đêm. Thứ bảy là ngủ trên nền nhà lạnh. Thứ tám là ăn quá nhiều đồ chiên rán, uống nước ngọt thường xuyên. Thứ chín là thường xuyên sử dụng rượu bia, thuốc lá. Và thứ mười là nhịn đi vệ sinh.

## Sửa lỗi khớp miệng (xuất lại)

- Video gốc thực tế chỉ ~20 khung hình/giây (dù ghi 30), bản trước cắt hình theo số khung hình giả định 30 fps nên miệng và tay lệch dần với tiếng, và còn sót một đoạn hình im lặng.
- Bản xuất lại: chuyển video gốc về đúng 30 khung hình/giây trước khi cắt, nên hình và tiếng cắt tại cùng một thời điểm. Đã kiểm tra bằng cách so khung hình ở 5 thời điểm: hình khớp đúng thời điểm của tiếng (sai lệch ≤ 1–2 khung hình).
