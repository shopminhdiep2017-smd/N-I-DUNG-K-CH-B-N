/** Tầng 1 – Manual Claude Task: prompt chuẩn để người dùng copy vào Claude Code (gói thuê bao). */

export interface ManualTask {
  id: string;
  title: string;
  when: string;
  prompt: string;
}

const RULES_FOOTER =
  "Tuân thủ CLAUDE.md, agents/README.md và approval-policy.md. Không điền *_approved_by, không chuyển trạng thái vượt NEEDS_REVIEW, không bịa dữ liệu, mọi claim sản phẩm hiện là UNVERIFIED. Kết thúc bằng mục \"CẦN CON NGƯỜI QUYẾT ĐỊNH\".";

export function researchPrompt(requestPath: string): string {
  return `/nghien-cuu ${requestPath}\n\n${RULES_FOOTER}`;
}

export function writeScriptPrompt(itemFile: string): string {
  return `/viet-kich-ban ${itemFile}\n\nViết kịch bản đúng cấu trúc theo trường format, giọng từ tốn ấm áp của Dược sĩ Lê Hương, gắn Claim ID cho mọi tuyên bố sức khỏe/sản phẩm. Sau đó chạy: npm run check -- ${itemFile}\n\n${RULES_FOOTER}`;
}

export function reviewPrompt(itemFile: string): string {
  return `/kiem-duyet ${itemFile}\n\nĐọc thêm kết quả Quality Gate trên Dashboard (Script Studio) và giải thích từng tiêu chí chưa đạt.\n\n${RULES_FOOTER}`;
}

export function consultationPrompt(): string {
  return `/chuan-bi-tu-van <dán yêu cầu tư vấn đã ẩn danh — bỏ tên, số điện thoại, địa chỉ>\n\n${RULES_FOOTER}`;
}

export function learningPrompt(itemFile: string): string {
  return `Dùng subagent research-strategy. Đọc ${itemFile} (mục 5 Kết quả sau xuất bản) và data/analytics.json. Đề xuất 1–3 bài học dạng HYPOTHESIS cho vòng nội dung tiếp theo, kèm số liệu làm căn cứ. Không sửa strategy/.\n\n${RULES_FOOTER}`;
}

export function apiDraftSystemPrompt(): string {
  return [
    "Bạn hỗ trợ soạn BẢN NHÁP nội dung cho Dược sĩ Lê Hương (tư vấn tuần hoàn, tim mạch).",
    "Giọng từ tốn, ấm áp; không hô hào, không dọa dẫm. Không chẩn đoán, không thay thế bác sĩ.",
    "Không dùng: chữa khỏi, đặc trị, thuốc tiên, cam kết khỏi 100%. Không bịa số liệu hay câu chuyện khách hàng.",
    "Mọi công dụng của Rich Coenzyme Q10, DHA EPA SQ, Nattokinase 60,000 FU, Policosanol 10 là UNVERIFIED: không viết công dụng nếu không được cung cấp Claim ID.",
    "Kết quả là bản nháp để con người duyệt.",
  ].join("\n");
}

export const MANUAL_TASKS: ManualTask[] = [
  { id: "research", title: "Phân tích dữ liệu khách hàng (Agent 01)", when: "Khi có bình luận/câu hỏi mới đã ẩn danh", prompt: researchPrompt("private/research-requests/<file>.md") },
  { id: "script", title: "Viết kịch bản từ brief đã duyệt (Agent 02 → 03)", when: "Khi brief đã có chữ ký người duyệt", prompt: writeScriptPrompt("content/items/<id>.md") },
  { id: "review", title: "Kiểm duyệt nội dung (Agent 03)", when: "Trước khi gửi vào Hàng chờ phê duyệt", prompt: reviewPrompt("content/items/<id>.md") },
  { id: "consult", title: "Chuẩn bị tư vấn (Agent 03)", when: "Khi có khách nhắn hỏi", prompt: consultationPrompt() },
  { id: "learning", title: "Rút bài học sau khi đo (Agent 01)", when: "Sau khi nhập chỉ số video", prompt: learningPrompt("content/items/<id>.md") },
];
