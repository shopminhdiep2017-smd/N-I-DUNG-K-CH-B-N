# Quy trình sản xuất video (Pipeline)

```
Customer Data → Agent 01 (Research & Strategy) → [H1 Human Insight Approval]
→ Content Brief → [H2 Duyệt brief] → Agent 02 (Content Production)
→ Agent 03 (Quality & Compliance Check) → [H4 Human Final Approval → APPROVED_TO_RECORD]
→ Recording → Editing (CapCut/Vbee) → [H5 APPROVED_TO_PUBLISH — bắt buộc con người]
→ Publishing → Performance Analysis → Learning Update → [H6 Duyệt bài học]
```

| Bước | Ai | Đầu vào | Đầu ra | Trạng thái nội dung |
|---|---|---|---|---|
| 1. Customer Data | Người | Bình luận, tin nhắn, ghi chú tư vấn (ẩn danh) | `templates/research-request.md` | — |
| 2. Research & Strategy | Agent 01 | Research request | `research/reports/RS-…md` | — |
| 3. Human Insight Approval | Người | Báo cáo RS | Insight được duyệt | — |
| 4. Content Brief | Người / Agent 02 soạn nháp | Insight đã duyệt | `content/items/CI-…md` | IDEA |
| 5. Duyệt brief | Người | Brief | `brief_approved_by` | CONTENT_BRIEF → SCRIPT_DRAFT |
| 6. Content Production | Agent 02 | Brief đã duyệt | Kịch bản | SCRIPT_DRAFT → NEEDS_SOURCE / NEEDS_REVIEW |
| 7. Quality & Compliance | Agent 03 | Kịch bản | `content/qa-reports/…-qa.md` | Đề xuất trạng thái |
| 8. Human Final Approval | Người | Kịch bản + QA | `record_approved_by` | APPROVED_TO_RECORD |
| 9. Recording | Người | Kịch bản duyệt | File quay | RECORDED |
| 10. Editing | Người (CapCut / Vbee) | File quay | Bản dựng | EDITING → FINAL_REVIEW |
| 11. Duyệt đăng | Người | Bản dựng cuối | `publish_approved_by` | APPROVED_TO_PUBLISH |
| 12. Publishing | Người | Bản duyệt | `published_url` | PUBLISHED |
| 13. Performance Analysis | Người ghi số; Agent 01 phân tích | Chỉ số | `templates/performance-log.md` | MEASURED |
| 14. Learning Update | Agent 01 đề xuất; người duyệt | Phân tích | Bài học | LEARNING_CAPTURED |

Lưu ý khi dựng: câu chữ trên màn hình phải khớp kịch bản đã duyệt. Thêm chữ mới có tuyên bố sức khỏe → quay lại bước 7.
