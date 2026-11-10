# Q10 nên uống mấy viên mỗi ngày, uống lúc nào tốt nhất?

## Video đã dựng – bản 1

`Video_Q10UongMayVien_ban_1.mp4` (9:16, giữ nguyên 480x854 như video gốc, 1 phút 46 giây; video gốc 2 phút):

- Cắt câu nói lặp: "hoặc là" nói 2 lần ("…hàm lượng cao hoặc là, hoặc là quảng cáo…"); "thì hãy hỏi bác sĩ hoặc là các dược sĩ" nói 2 lần (giữ lần sau, nối với "…trước khi bổ sung Q10").
- Nối liền các câu, bỏ các chỗ ngừng dài.
- Khớp miệng: cắt hình theo số khung hình chính xác, tiếng cắt cùng điểm; hình và tiếng dài bằng nhau (105,70 giây); không đổi tốc độ.
- Giữ nguyên hình ảnh gốc và phụ đề có sẵn, xuất chất lượng cao (CRF 16).
- Lọc ồn nền (RNNoise và afftdn), giọng chuẩn hóa −17 LUFS.
- 16 footage phong cách 3D. Người nói ngồi cao (đỉnh đầu ~195/854 px) nên khung footage thu nhỏ còn ~80% (220x149 px) và đặt ở 23 px để trên và dưới cách đều ~23 px.
- Nhạc "Gió nơi rời" âm lượng 0,11 (nhỏ hơn giọng ~22 dB).

## Sửa lỗi khớp miệng (xuất lại)

- Video gốc thực tế chỉ ~20 khung hình/giây (dù ghi 30), bản trước cắt hình theo số khung hình giả định 30 fps nên miệng và tay lệch dần với tiếng, và còn sót một đoạn hình im lặng.
- Bản xuất lại: chuyển video gốc về đúng 30 khung hình/giây trước khi cắt, nên hình và tiếng cắt tại cùng một thời điểm. Đã kiểm tra bằng cách so khung hình ở 5 thời điểm: hình khớp đúng thời điểm của tiếng (sai lệch ≤ 1–2 khung hình).
