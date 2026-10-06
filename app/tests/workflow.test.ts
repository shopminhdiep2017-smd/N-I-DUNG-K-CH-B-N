import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as api from "../server/api";
import { handle } from "../server/vite-plugin";
import { parseFrontMatter } from "../shared/frontmatter";
import { ROOT, tempRepo } from "./helpers";

const HUMAN = "Dược sĩ Lê Hương";

function fillValueVideo(repo: ReturnType<typeof tempRepo>, id: string) {
  return api.saveDraft(repo, id, {
    meta: { title: "Già rồi ai chẳng thế? Đừng chịu đựng tê bì âm thầm", format: "video-gia-tri", stage_5a: "Aware", pillar: "P1", insight: "INS-01", claims: "" },
    brief: {
      "Khách hàng mục tiêu": "Người trung niên bị tê bì chân tay, hoa mắt, mất ngủ",
      "Giai đoạn hành trình (5A)": "Aware", Insight: "INS-01", "Vấn đề": "Mặc định tê bì là chuyện tuổi già",
      "Niềm tin cần thay đổi": "V-05 Già rồi ai chẳng thế", "Mục tiêu nội dung": "Khuyến khích lắng nghe cơ thể và đi khám",
      "Thông điệp chính": "Hiểu đúng cơ thể, chọn đúng chuyên gia", "Liên quan đến sản phẩm nào": "Không",
      "Claim được sử dụng": "Không", "Nguồn bằng chứng": "Không cần (không có tuyên bố sản phẩm)",
      Hook: "V-05", "Nội dung chính": "Đồng cảm, khuyên đi khám", CTA: "Mời bình luận", "Chỉ số cần theo dõi": "Số bình luận",
    },
    blocks: [
      { block: "Hook – Vấn đề nhức nhối", line: "Già rồi ai chẳng thế? Cô chú có hay tự nói câu này mỗi lần tay chân tê bì không ạ?", visual: "", claim: "" },
      { block: "Insight – Nỗi khổ thầm kín", line: "Nhiều cô chú ngại nói ra vì sợ con cháu lo, nên lặng lẽ chịu đựng một mình.", visual: "", claim: "" },
      { block: "Giải pháp khoa học ngắn gọn", line: "Tê bì kéo dài là điều nên được lắng nghe. Chỉ bác sĩ thăm khám trực tiếp mới biết rõ nguyên nhân, vì vậy cô chú hãy ghi lại lúc nào, ở đâu, bao lâu để buổi khám trọn vẹn hơn.", visual: "", claim: "" },
      { block: "CTA nhẹ nhàng", line: "Cô chú có đang gặp tình trạng tương tự không ạ? Hãy để lại bình luận để Dược sĩ Lê Hương giải đáp nhé.", visual: "", claim: "" },
    ],
    caption: "Đừng chịu đựng tê bì âm thầm — hãy lắng nghe cơ thể và đi khám.",
    visuals: "bàn tay xoa bắp chân, ánh sáng ấm",
    editor: HUMAN,
  });
}

describe("T08 Luồng đầy đủ cho video giáo dục không chứa sản phẩm", () => {
  it("IDEA → … → LEARNING_CAPTURED, mỗi cổng có chữ ký người", () => {
    const repo = tempRepo();
    const created = api.createItem(repo, { title: "Test", format: "video-gia-tri", stage_5a: "Aware", pillar: "P1", insight: "INS-01", author: HUMAN });
    const id = created.id;
    const filled = fillValueVideo(repo, id);
    expect(filled.scriptScore.score).toBeGreaterThanOrEqual(90);
    expect(filled.briefScore.score).toBeGreaterThanOrEqual(90);

    api.moveItem(repo, id, { to: "CONTENT_BRIEF", actor: HUMAN });
    expect(api.getApprovals(repo).queue.some((q) => q.targetType === "brief" && q.targetId === id)).toBe(true);
    api.decide(repo, { targetType: "brief", targetId: id, action: "APPROVE", reviewer: HUMAN });
    expect(api.getItem(repo, id).meta.status).toBe("SCRIPT_DRAFT");

    api.moveItem(repo, id, { to: "NEEDS_REVIEW", actor: HUMAN });
    api.decide(repo, { targetType: "script", targetId: id, action: "APPROVE", reviewer: HUMAN });
    let it1 = api.getItem(repo, id);
    expect(it1.meta.status).toBe("APPROVED_TO_RECORD");
    expect(it1.meta.record_approved_by).toBe(HUMAN);

    for (const to of ["RECORDED", "EDITING", "FINAL_REVIEW"]) api.moveItem(repo, id, { to, actor: HUMAN });
    expect(() => api.decide(repo, { targetType: "publish", targetId: id, action: "APPROVE", reviewer: HUMAN })).toThrow(/bản dựng cuối/);
    api.decide(repo, { targetType: "publish", targetId: id, action: "APPROVE", reviewer: HUMAN, confirmWatched: true });
    expect(api.getItem(repo, id).meta.publish_approved_by).toBe(HUMAN);

    expect(() => api.moveItem(repo, id, { to: "PUBLISHED", actor: HUMAN })).toThrow(/link/);
    api.moveItem(repo, id, { to: "PUBLISHED", actor: HUMAN, publishedUrl: "https://example.com/video-test" });
    expect(() => api.moveItem(repo, id, { to: "MEASURED", actor: HUMAN })).toThrow(/chỉ số/);
    api.addMetrics(repo, { itemId: id, views: 1200, avgWatchSeconds: 31, comments: 14, consultMessages: 3, questions: ["Tê bì ban đêm có nên đi khám ngay không?"], enteredBy: HUMAN });
    api.moveItem(repo, id, { to: "MEASURED", actor: HUMAN });
    api.moveItem(repo, id, { to: "LEARNING_CAPTURED", actor: HUMAN, learning: "Hook dùng verbatim giữ người xem tốt" });
    it1 = api.getItem(repo, id);
    expect(it1.meta.status).toBe("LEARNING_CAPTURED");
    expect(it1.body).toContain("Hook dùng verbatim");
    // câu hỏi khách hàng quay về thư viện cho Agent 01
    expect(repo.customerData().some((r) => r.quote.startsWith("Tê bì ban đêm"))).toBe(true);
    // file cuối vẫn qua bộ kiểm tra Python
    const out = execFileSync("python3", [path.join(ROOT, "tools/check_content.py"), repo.abs(it1.file)], { encoding: "utf8" });
    expect(out).not.toContain("[FAIL]");
    expect(api.getApprovals(repo).log.length).toBeGreaterThan(5);
  });
});

describe("T09 Human Approval bắt buộc dừng", () => {
  it("không nhảy cóc, không vào cổng duyệt qua Kanban", () => {
    const repo = tempRepo();
    const { id } = api.createItem(repo, { title: "Skip", format: "video-gia-tri", author: HUMAN });
    expect(() => api.moveItem(repo, id, { to: "APPROVED_TO_RECORD", actor: HUMAN })).toThrow(/Hàng chờ phê duyệt/);
    expect(() => api.moveItem(repo, id, { to: "SCRIPT_DRAFT", actor: HUMAN })).toThrow(/Hàng chờ phê duyệt/);
    expect(() => api.moveItem(repo, id, { to: "NEEDS_SOURCE", actor: HUMAN })).toThrow(/nhảy cóc/);
  });
  it("AI không được ký duyệt", () => {
    const repo = tempRepo();
    const { id } = api.createItem(repo, { title: "AI sign", format: "video-gia-tri", author: HUMAN });
    fillValueVideo(repo, id);
    api.moveItem(repo, id, { to: "CONTENT_BRIEF", actor: HUMAN });
    for (const reviewer of ["Claude", "Agent 03", "AI"]) {
      expect(() => api.decide(repo, { targetType: "brief", targetId: id, action: "APPROVE", reviewer })).toThrow(/con người/);
    }
    expect(() => api.moveItem(repo, id, { to: "IDEA", actor: "Agent 02" })).toThrow(/không phải AI/);
  });
  it("từ chối phải có lý do; trả về hủy chữ ký", () => {
    const repo = tempRepo();
    const { id } = api.createItem(repo, { title: "Reject", format: "video-gia-tri", author: HUMAN });
    fillValueVideo(repo, id);
    api.moveItem(repo, id, { to: "CONTENT_BRIEF", actor: HUMAN });
    expect(() => api.decide(repo, { targetType: "brief", targetId: id, action: "REJECT", reviewer: HUMAN })).toThrow(/lý do/);
    api.decide(repo, { targetType: "brief", targetId: id, action: "APPROVE", reviewer: HUMAN });
    api.moveItem(repo, id, { to: "IDEA", actor: HUMAN, note: "Đổi hướng" });
    expect(api.getItem(repo, id).meta.brief_approved_by).toBe("");
  });
  it("nội dung đã duyệt không sửa được trong Studio", () => {
    const repo = tempRepo();
    const { id } = api.createItem(repo, { title: "Lock", format: "video-gia-tri", author: HUMAN });
    fillValueVideo(repo, id);
    api.moveItem(repo, id, { to: "CONTENT_BRIEF", actor: HUMAN });
    api.decide(repo, { targetType: "brief", targetId: id, action: "APPROVE", reviewer: HUMAN });
    api.moveItem(repo, id, { to: "NEEDS_REVIEW", actor: HUMAN });
    api.decide(repo, { targetType: "script", targetId: id, action: "APPROVE", reviewer: HUMAN });
    expect(() => fillValueVideo(repo, id)).toThrow(/đã được duyệt/);
  });
});

describe("T10 Nội dung có sản phẩm UNVERIFIED", () => {
  it("tự gắn nhãn chờ claim, không vào được NEEDS_REVIEW / duyệt quay, không vào Analytics", () => {
    const repo = tempRepo();
    const { id } = api.createItem(repo, { title: "Bán hàng", format: "video-ban-hang", stage_5a: "Act", pillar: "P5", claims: "CLM-007", author: HUMAN });
    const d = api.saveDraft(repo, id, {
      meta: { claims: "CLM-007" }, brief: {},
      blocks: [{ block: "Combo", line: "Nattokinase 60,000 FU hỗ trợ tăng cường tuần hoàn máu.", visual: "", claim: "CLM-007" }],
      caption: "", visuals: "",
    });
    expect(d.body).toContain("CHỜ CLAIM ĐƯỢC PHÊ DUYỆT");
    expect(d.scriptScore.verdict).toBe("BLOCKED");
    expect(d.compliance.result).not.toBe("FAIL");
    expect(api.getApprovals(repo).queue.find((q) => q.targetId === id)).toBeUndefined();
  });
  it("Analytics từ chối video có sản phẩm", () => {
    const repo = tempRepo();
    const file = "content/items/CI-TEST-P.md";
    repo.write(file, "---\nid: CI-TEST-P\ntitle: P\nstatus: PUBLISHED\nformat: video-ban-hang\nstage_5a: Act\npillar: P5\ninsight: INS-01\nclaims: CLM-007\n---\n# 2. Kịch bản\n**CHỜ CLAIM ĐƯỢC PHÊ DUYỆT**\n| Khối | Lời thoại |\n|---|---|\n| Combo | Nattokinase |\n");
    expect(() => api.addMetrics(repo, { itemId: "CI-TEST-P", views: 1, enteredBy: HUMAN })).toThrow(/không chứa sản phẩm/);
  });
});

describe("T11 Dữ liệu khách hàng & ẩn danh", () => {
  it("chặn thông tin nhận diện; lưu vào private/", () => {
    const repo = tempRepo();
    expect(() => api.addCustomerRecord(repo, { quote: "Gọi em số 0912 345 678 nhé", anonymized: true })).toThrow(/nhận diện/);
    expect(() => api.addCustomerRecord(repo, { quote: "Tay em hay tê", anonymized: false })).toThrow(/ẩn danh/);
    const r = api.addCustomerRecord(repo, { quote: "Tay em hay tê về đêm", type: "nỗi đau", anonymized: true });
    expect(r.source).toBe("CHƯA CÓ NGUỒN");
    expect(repo.exists("private/customer-data.json")).toBe(true);
    const req = api.createResearchRequest(repo, HUMAN);
    expect(req.file).toMatch(/^private\/research-requests\/RR-/);
    expect(req.prompt).toContain("/nghien-cuu");
    expect(repo.customerData().every((x) => x.processed)).toBe(true);
  });
});

describe("T12 Model Router & Manual Claude Task", () => {
  it("mặc định local-first: không có API → Manual Claude Task; việc duyệt không bao giờ giao AI", async () => {
    const repo = tempRepo();
    const r = api.getRouter(repo, {});
    expect(r.routes.find((x) => x.task === "compliance_check")?.tier).toBe(0);
    expect(r.routes.find((x) => x.task === "draft_script")?.tier).toBe(1);
    expect(r.humanOnly.every((x) => x.tier === null)).toBe(true);
    const res = await api.runAiTask(repo, {}, { task: "draft_script" }, async () => "không được gọi");
    expect(res.prompt).toContain("/viet-kich-ban");
    await expect(api.runAiTask(repo, {}, { task: "approve_publish" }, async () => "")).rejects.toThrow(/con người/);
  });
  it("bật tầng 3 + model từ biến môi trường + key → gọi API, kết quả chỉ là bản nháp", async () => {
    const repo = tempRepo();
    const cfg = repo.router();
    cfg.tiers["3"].enabled = true;
    repo.writeJson("config/model-router.json", cfg);
    const env = { AIOS_MODEL_HIGH: "model-tu-bien-moi-truong", ANTHROPIC_API_KEY: "test-key" };
    let usedModel = "";
    const res = await api.runAiTask(repo, env, { task: "draft_script" }, async (model) => { usedModel = model; return "Bản nháp"; });
    expect(usedModel).toBe("model-tu-bien-moi-truong");
    expect(res.draft).toBe("Bản nháp");
    expect(res.label).toMatch(/BẢN NHÁP/);
    expect(JSON.stringify(api.getRouter(repo, env))).not.toContain("test-key");
    // thiếu key → rơi về tầng 1
    expect((await api.runAiTask(repo, { AIOS_MODEL_HIGH: "x" }, { task: "draft_script" }, async () => "")).decision.tier).toBe(1);
  });
});

describe("T13 Dữ liệu cá nhân hóa & nguồn dữ liệu", () => {
  it("chiến lược nạp từ repo đúng định vị tuần hoàn, tim mạch; không có tử vi", () => {
    const repo = tempRepo();
    const b = api.getBrand(repo);
    const pos = b.docs.find((d) => d.key === "positioning")!.markdown;
    expect(pos).toMatch(/tim mạch/);
    expect(b.docs.find((d) => d.key === "bigidea")!.markdown).toContain("Hiểu đúng cơ thể, chọn đúng chuyên gia, sống trọn vẹn an yên");
    // decision-log được phép nhắc tới điều cấm (D-027); tài liệu chiến lược thì không
    expect(b.docs.filter((d) => d.key !== "decisions").map((d) => d.markdown).join(" ")).not.toMatch(/tử vi|xem tuổi/i);
  });
  it("kiểm tra nguồn: file trên máy kết nối, API chưa kết nối, không tự đánh dấu API", () => {
    const repo = tempRepo();
    const list = api.checkSources(repo, {});
    const st = (id: string) => list.find((s) => s.id === id)!.status;
    expect(st("repo-strategy")).toBe("CONNECTED");
    expect(st("claim-registry")).toBe("CONNECTED");
    expect(st("product-docs")).toBe("NOT_CONNECTED");
    expect(st("model-api")).toBe("NOT_CONNECTED");
    expect(st("social-api")).toBe("DEFERRED");
    expect(() => api.updateSource(repo, "model-api", { status: "CONNECTED" })).toThrow();
  });
  it("HTTP: định tuyến API cơ bản", async () => {
    const repo = tempRepo();
    const o = await handle(repo, {}, "GET", "/api/overview", {});
    expect((o as { parts: unknown[] }).parts.length).toBeGreaterThanOrEqual(4);
    await expect(handle(repo, {}, "GET", "/api/khong-co", {})).rejects.toThrow(/Không có API/);
  });
  it("front matter giữ đúng định dạng file nội dung", () => {
    const repo = tempRepo();
    const { id, file } = api.createItem(repo, { title: "FM: có dấu hai chấm", format: "vsl", author: HUMAN });
    const { meta } = parseFrontMatter(repo.read(file));
    expect(meta.id).toBe(id);
    expect(meta.title).toBe("FM: có dấu hai chấm");
    expect(meta.status).toBe("IDEA");
  });
});
