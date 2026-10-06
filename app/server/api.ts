import { APPROVAL_ONLY, STATUSES, STATUS_LABELS, isHumanName, isValidStatus, nextStatus, normalizeStatus, statusIndex } from "../shared/lifecycle";
import { checkCompliance, mentionedProducts, parseClaimList } from "../shared/compliance";
import { insightConfidence, scoreBrief, scoreInsight, scoreScript } from "../shared/quality";
import { FORMATS, appendStatusLog, parseBrief, parseScript, parseTable, renderBody } from "../shared/script";
import { MANUAL_TASKS, apiDraftSystemPrompt, learningPrompt, researchPrompt, reviewPrompt, writeScriptPrompt } from "../shared/prompts";
import { route, routerStatus } from "../shared/router";
import { RULES } from "../shared/rules";
import type { ApprovalEntry, ContentItem, CustomerDataType, CustomerRecord, Insight, Meta, MetricEntry, ScriptBlock, SourceStatus } from "../shared/types";
import { Repo, today } from "./repo";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
const bad = (msg: string) => new HttpError(400, msg);

type Env = Record<string, string | undefined>;

// ---------------------------------------------------------------- đánh giá
function evaluateItem(repo: Repo, item: ContentItem) {
  const registry = repo.claims();
  const insightIds = repo.insights().map((i) => i.id);
  const compliance = checkCompliance(item.meta, item.body, registry);
  const brief = scoreBrief(item.meta, item.body, registry, insightIds);
  const script = scoreScript(item.meta, item.body, registry, insightIds);
  const s = statusIndex(item.meta.status);
  const products = mentionedProducts(item.body);
  return {
    id: item.id,
    file: item.file,
    meta: { ...item.meta, status: normalizeStatus(item.meta.status) } as Meta,
    statusLabel: STATUS_LABELS[normalizeStatus(item.meta.status)] ?? item.meta.status,
    compliance,
    briefScore: brief,
    scriptScore: script,
    hasProduct: products.length > 0 || parseClaimList(item.meta.claims).length > 0,
    products,
    stageIndex: s,
  };
}

function itemDetail(repo: Repo, item: ContentItem) {
  const ev = evaluateItem(repo, item);
  return { ...ev, body: item.body, brief: parseBrief(item.body), script: parseScript(item.body) };
}

// ---------------------------------------------------------------- tổng quan
export function getOverview(repo: Repo, env: Env) {
  const items = repo.items().map((i) => evaluateItem(repo, i));
  const insights = repo.insights();
  const sources = repo.sources();
  const claims = Object.values(repo.claims());
  const status = repo.status() as { parts?: Record<string, { title?: string; status?: string; status_label?: string; unlocked?: boolean }> };
  const parts = Object.entries(status.parts ?? {}).map(([id, p]) => ({ id, title: p.title ?? "", status: p.status ?? "", label: p.status_label ?? "", unlocked: !!p.unlocked }));
  const by = (st: string) => items.filter((i) => i.meta.status === st);
  const queue = getApprovals(repo).queue;
  const openConflicts = (repo.readOr("decision-log.md").match(/^\| C-\d+/gm) ?? []).length;
  const alerts: { level: "error" | "warn" | "info"; text: string }[] = [];
  for (const i of items.filter((x) => x.compliance.result === "FAIL")) alerts.push({ level: "error", text: `${i.id}: ${i.compliance.findings.filter((f) => f.severity === "FAIL").length} lỗi tuân thủ (FAIL)` });
  const approved = claims.filter((c) => c.approved).length;
  alerts.push({ level: approved === 0 ? "warn" : "info", text: `Claim Registry: ${approved}/${claims.length} claim đã APPROVED — nội dung nhắc sản phẩm không được quay/đăng` });
  if (openConflicts) alerts.push({ level: "warn", text: `${openConflicts} mâu thuẫn mở trong decision-log.md chờ con người quyết định` });
  const router = routerStatus(repo.router(), env);
  if (!router.some((t) => t.tier >= 2 && t.usable)) alerts.push({ level: "info", text: "Model API (tầng 2/3) chưa bật — hệ thống dùng logic + Manual Claude Task" });
  const published = items.filter((i) => i.meta.status === "PUBLISHED");
  const measuredIds = new Set(repo.metrics().map((m) => m.itemId));
  const tasks: string[] = [];
  if (queue.length) tasks.push(`Duyệt ${queue.length} mục trong Hàng chờ phê duyệt`);
  if (by("APPROVED_TO_RECORD").length) tasks.push(`Quay ${by("APPROVED_TO_RECORD").length} video đã được phép quay (dùng Chế độ quay)`);
  if (by("RECORDED").length + by("EDITING").length) tasks.push(`Dựng ${by("RECORDED").length + by("EDITING").length} video (CapCut/Vbee)`);
  const toMeasure = published.filter((i) => !measuredIds.has(i.id));
  if (toMeasure.length) tasks.push(`Nhập chỉ số cho ${toMeasure.length} video đã đăng`);
  const unprocessed = repo.customerData().filter((r) => !r.processed).length;
  if (unprocessed) tasks.push(`Gửi ${unprocessed} câu nói khách hàng mới cho Agent 01 (Thư viện dữ liệu khách hàng)`);
  if (by("NEEDS_SOURCE").length) tasks.push(`${by("NEEDS_SOURCE").length} nội dung chờ tài liệu nguồn/claim — xem compliance/human-review-list.md`);
  if (!tasks.length) tasks.push("Tạo Content Brief mới trong Script Studio (nội dung không nhắc sản phẩm có thể đi tới xuất bản)");
  const countBy = (st: SourceStatus) => sources.filter((s) => s.status === st).length;
  return {
    parts,
    counts: Object.fromEntries(STATUSES.map((s) => [s, by(s).length])),
    insightsPending: insights.filter((i) => i.status === "HYPOTHESIS").length,
    scriptsPending: by("NEEDS_REVIEW").length,
    readyToRecord: by("APPROVED_TO_RECORD").map((i) => ({ id: i.id, title: i.meta.title })),
    queueCount: queue.length,
    sources: { total: sources.length, connected: countBy("CONNECTED"), manual: countBy("MANUAL"), deferred: countBy("DEFERRED"), error: countBy("ERROR"), notConnected: countBy("NOT_CONNECTED") },
    tasks,
    alerts,
  };
}

// ---------------------------------------------------------------- chiến lược (chỉ đọc)
export const BRAND_DOCS = [
  { key: "expert", title: "Hồ sơ chuyên gia", path: "brand/expert-profile.md" },
  { key: "voice", title: "Giá trị & phong cách", path: "brand/values-and-voice.md" },
  { key: "segment", title: "Phân khúc thị trường", path: "brand/market-segment.md" },
  { key: "target", title: "Khách hàng mục tiêu", path: "brand/target-customer.md" },
  { key: "persona", title: "Chân dung khách hàng", path: "brand/customer-persona.md" },
  { key: "positioning", title: "Định vị", path: "strategy/positioning.md" },
  { key: "value", title: "Lời hứa giá trị", path: "strategy/value-proposition.md" },
  { key: "bigidea", title: "Big Idea", path: "strategy/big-idea.md" },
  { key: "messagehouse", title: "Message House", path: "strategy/message-house.md" },
  { key: "insights", title: "Insight khách hàng", path: "strategy/customer-insights.md" },
  { key: "productmap", title: "Bản đồ sản phẩm – nhu cầu – bằng chứng", path: "products/product-need-evidence.md" },
  { key: "q10", title: "Rich Coenzyme Q10", path: "products/rich-coenzyme-q10.md" },
  { key: "dha", title: "DHA EPA SQ", path: "products/dha-epa-sq.md" },
  { key: "natto", title: "Nattokinase 60,000 FU", path: "products/nattokinase-60000-fu.md" },
  { key: "poli", title: "Policosanol 10", path: "products/policosanol-10.md" },
  { key: "claims", title: "Claim Registry", path: "compliance/claim-registry.md" },
  { key: "policy", title: "Claim Policy", path: "compliance/claim-policy.md" },
  { key: "decisions", title: "Decision Log (quyết định & mâu thuẫn mở)", path: "decision-log.md" },
];

export function getBrand(repo: Repo) {
  return {
    readOnly: true,
    note: "Chỉ đọc. Mọi thay đổi chiến lược phải ghi vào decision-log.md (nhờ Claude Code theo yêu cầu trực tiếp của chủ thương hiệu).",
    docs: BRAND_DOCS.map((d) => ({ ...d, exists: repo.exists(d.path), markdown: repo.readOr(d.path, "_CHƯA CÓ NGUỒN — file chưa tồn tại_") })),
  };
}

// ---------------------------------------------------------------- nguồn dữ liệu
export function checkSources(repo: Repo, env: Env) {
  const router = routerStatus(repo.router(), env);
  const stored = repo.sources();
  const checkedAt = new Date().toISOString();
  const list = stored.map((s) => {
    const next = { ...s };
    delete next.checkedAt;
    if (s.kind === "local" && s.path) {
      if (!repo.exists(s.path)) next.status = "NOT_CONNECTED";
      else if (s.path === "compliance/claim-registry.md") next.status = Object.keys(repo.claims()).length ? "CONNECTED" : "ERROR";
      else next.status = "CONNECTED";
    }
    if (s.kind === "api" && s.id === "model-api") next.status = router.some((t) => t.tier >= 2 && t.usable) ? "CONNECTED" : "NOT_CONNECTED";
    return next;
  });
  // Chỉ ghi file khi trạng thái thay đổi (tránh làm bẩn git mỗi lần khởi động)
  if (list.some((s, i) => s.status !== stored[i].status || stored[i].checkedAt)) repo.saveSources(list);
  return list.map((s) => ({ ...s, checkedAt }));
}

const SOURCE_STATUSES: SourceStatus[] = ["NOT_CONNECTED", "CONNECTED", "ERROR", "MANUAL", "DEFERRED"];
export function updateSource(repo: Repo, id: string, input: { status?: string; note?: string }) {
  const list = repo.sources();
  const s = list.find((x) => x.id === id);
  if (!s) throw new HttpError(404, "Không tìm thấy nguồn dữ liệu");
  if (input.status) {
    if (!SOURCE_STATUSES.includes(input.status as SourceStatus)) throw bad("Trạng thái không hợp lệ");
    if (s.kind === "local" && input.status === "CONNECTED" && s.path && !repo.exists(s.path)) throw bad("File/thư mục chưa tồn tại — không thể đánh dấu Đã kết nối");
    if (s.kind === "api" && input.status === "CONNECTED") throw bad("Nguồn API chỉ được hệ thống tự đánh dấu khi kiểm tra kết nối thành công");
    s.status = input.status as SourceStatus;
  }
  if (input.note !== undefined) s.note = String(input.note).slice(0, 500);
  repo.saveSources(list);
  return s;
}

// ---------------------------------------------------------------- dữ liệu khách hàng
const PII_PATTERNS: [RegExp, string][] = [
  [/(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}/, "số điện thoại"],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, "email"],
  [/(họ tên|tên tôi là|tên em là|địa chỉ|số nhà|zalo\s*:|facebook\.com\/)/i, "tên/địa chỉ/tài khoản"],
  [/\b\d{9,12}\b/, "dãy số định danh (CMND/CCCD/tài khoản)"],
];
export function detectPII(text: string): string[] {
  return PII_PATTERNS.filter(([rx]) => rx.test(text)).map(([, label]) => label);
}

export function getCustomerData(repo: Repo) {
  const { rows } = parseTable(repo.readOr("research/customer-language/verbatims.md"));
  const repoVerbatims = rows.map((r) => ({ id: r[0], quote: r[1], topic: r[2], source: r[3], insight: r[4] }));
  return { repoVerbatims, records: repo.customerData(), privateFile: "private/customer-data.json" };
}

const CD_TYPES: CustomerDataType[] = ["câu hỏi", "nỗi đau", "mong muốn", "rào cản", "niềm tin", "phản đối", "khác"];
export function addCustomerRecord(repo: Repo, input: Partial<CustomerRecord>) {
  const quote = String(input.quote ?? "").trim();
  if (!quote) throw bad("Cần nhập câu nói nguyên văn");
  if (!input.anonymized) throw bad("Chỉ lưu dữ liệu đã ẩn danh (bỏ tên, số điện thoại, địa chỉ, ảnh)");
  const pii = detectPII(quote + " " + (input.notes ?? ""));
  if (pii.length) throw bad(`Phát hiện thông tin nhận diện (${pii.join(", ")}). Hãy ẩn danh trước khi lưu.`);
  const type = CD_TYPES.includes(input.type as CustomerDataType) ? (input.type as CustomerDataType) : "khác";
  const list = repo.customerData();
  const rec: CustomerRecord = {
    id: `CD-${today().replace(/-/g, "")}-${String(list.length + 1).padStart(3, "0")}`,
    quote, type,
    source: String(input.source ?? "").trim() || "CHƯA CÓ NGUỒN",
    channel: String(input.channel ?? "").trim() || "NOT_DECIDED",
    date: String(input.date ?? today()),
    anonymized: true, processed: false,
    notes: input.notes ? String(input.notes) : undefined,
  };
  repo.saveCustomerData([...list, rec]);
  return rec;
}

export function createResearchRequest(repo: Repo, requester: string) {
  if (!isHumanName(requester)) throw bad("Cần tên người yêu cầu");
  const list = repo.customerData();
  const pending = list.filter((r) => !r.processed);
  if (!pending.length) throw bad("Không có dữ liệu khách hàng mới để gửi Agent 01");
  const n = repo.list("private/research-requests").length + 1;
  const id = `RR-${today().replace(/-/g, "")}-${String(n).padStart(2, "0")}`;
  const file = `private/research-requests/${id}.md`;
  const md = `# Yêu cầu nghiên cứu ${id}\n**Người yêu cầu:** ${requester} · **Ngày:** ${today()}\n\n## Câu hỏi cần trả lời\nPhân loại dữ liệu mới, đề xuất insight (HYPOTHESIS), đối chiếu định vị Dược sĩ tư vấn tuần hoàn, tim mạch.\n\n## Dữ liệu thô (đã ẩn danh)\n| # | Nguyên văn | Loại | Nguồn (kênh, ngày) | Đã ẩn danh? |\n|---|---|---|---|---|\n${pending.map((r) => `| ${r.id} | ${r.quote.replace(/\|/g, "/")} | ${r.type} | ${r.channel}, ${r.date} — ${r.source} | Có |`).join("\n")}\n`;
  repo.write(file, md);
  repo.saveCustomerData(list.map((r) => (r.processed ? r : { ...r, processed: true })));
  return { file, count: pending.length, prompt: researchPrompt(file) };
}

// ---------------------------------------------------------------- insight
export function getInsights(repo: Repo) {
  const registry = repo.claims();
  return repo.insights().map((ins) => ({ ...ins, quality: scoreInsight(ins, registry), confidence: insightConfidence(ins) }));
}

export function addInsight(repo: Repo, input: { text?: string; evidence?: { ref: string; source: string; quote?: string }[]; proposedBy?: string; topic?: string }) {
  const text = String(input.text ?? "").trim();
  if (!text) throw bad("Cần nội dung insight");
  if (!input.proposedBy?.trim()) throw bad("Cần ghi người/Agent đề xuất");
  const list = repo.insights();
  const n = list.filter((i) => i.id.startsWith("PINS-")).length + 1;
  const ins: Insight = {
    id: `PINS-${String(n).padStart(2, "0")}`,
    text, status: "HYPOTHESIS", topic: input.topic,
    evidence: (input.evidence ?? []).filter((e) => e.ref).map((e) => ({ ref: e.ref, source: e.source || "CHƯA CÓ NGUỒN", quote: e.quote })),
    history: [{ at: today(), by: input.proposedBy.trim(), action: "Đề xuất (HYPOTHESIS)" }],
  };
  repo.saveInsights([...list, ins]);
  return ins;
}

// ---------------------------------------------------------------- nội dung
export function listItems(repo: Repo) {
  return repo.items().map((i) => evaluateItem(repo, i));
}

export function getItem(repo: Repo, id: string) {
  const item = repo.findItem(id);
  if (!item) throw new HttpError(404, "Không tìm thấy nội dung");
  return itemDetail(repo, item);
}

interface DraftInput {
  meta: Meta;
  brief: Record<string, string>;
  blocks: ScriptBlock[];
  caption: string;
  visuals: string;
}

const EDITABLE_META = ["title", "format", "stage_5a", "pillar", "insight", "idea_ref", "claims"];
const STUDIO_STATUSES = ["IDEA", "CONTENT_BRIEF", "SCRIPT_DRAFT", "NEEDS_SOURCE", "NEEDS_REVIEW"];

function pendingLabelNeeded(repo: Repo, meta: Meta, text: string): boolean {
  const registry = repo.claims();
  const claims = parseClaimList(meta.claims);
  return claims.some((c) => !registry[c]?.approved) || mentionedProducts(text).length > 0;
}

function composeBody(repo: Repo, baseBody: string, d: DraftInput): string {
  const text = d.blocks.map((b) => b.line).join(" ") + " " + d.caption;
  const label = pendingLabelNeeded(repo, d.meta, text) ? `${RULES.pendingLabel} – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI` : null;
  return renderBody(baseBody, d.brief, d.blocks, d.caption, d.visuals, label);
}

export function evaluateDraft(repo: Repo, d: DraftInput) {
  const base = d.meta.id ? repo.findItem(d.meta.id)?.body ?? "" : "";
  const body = composeBody(repo, base, d);
  const registry = repo.claims();
  const ids = repo.insights().map((i) => i.id);
  const meta: Meta = { ...d.meta, status: normalizeStatus(d.meta.status || "SCRIPT_DRAFT") };
  return {
    compliance: checkCompliance(meta, body, registry),
    briefScore: scoreBrief(meta, body, registry, ids),
    scriptScore: scoreScript(meta, body, registry, ids),
    pendingLabel: pendingLabelNeeded(repo, d.meta, body),
  };
}

export function createItem(repo: Repo, input: { title?: string; format?: string; stage_5a?: string; pillar?: string; insight?: string; claims?: string; author?: string }) {
  if (!input.title?.trim()) throw bad("Cần tên nội dung");
  if (!FORMATS[input.format ?? ""]) throw bad("Định dạng kịch bản không hợp lệ");
  const date = today().replace(/-/g, "");
  const n = repo.list("content/items").filter((f) => f.includes(`CI-${date}`)).length + 1;
  const id = `CI-${date}-${String(n).padStart(2, "0")}`;
  const meta: Meta = {
    id, title: input.title.trim(), status: "IDEA", format: input.format!, stage_5a: input.stage_5a ?? "Aware",
    pillar: input.pillar ?? "P1", insight: input.insight ?? "INS-01", idea_ref: "-", claims: input.claims?.trim() || "-",
    brief_approved_by: "", brief_approved_date: "", record_approved_by: "", record_approved_date: "",
    publish_approved_by: "", publish_approved_date: "", published_url: "",
  };
  const fmt = FORMATS[meta.format];
  const blocks = fmt.blocks.map((b) => ({ block: b.label, line: "", visual: "", claim: "" }));
  const brief: Record<string, string> = {
    "Khách hàng mục tiêu": "Người trung niên bị tê bì chân tay, hoa mắt, mất ngủ (độ tuổi: NOT_DECIDED, C-01)",
    "Giai đoạn hành trình (5A)": meta.stage_5a, Insight: meta.insight,
    "Liên quan đến sản phẩm nào": "Không", "Claim được sử dụng": meta.claims === "-" ? "Không" : meta.claims,
    "Nguồn bằng chứng": meta.claims === "-" ? "Không cần (không có tuyên bố sản phẩm)" : "UNVERIFIED",
    "Trạng thái kiểm duyệt": "theo trường status", "Người duyệt": "",
  };
  let body = renderBody("", brief, blocks, "", "", null);
  body = appendStatusLog(body, { date: today(), from: "—", to: "IDEA", by: input.author?.trim() || "Script Studio", note: "Tạo mới" });
  const file = `content/items/${id}.md`;
  repo.saveItem(file, meta, body);
  return getItem(repo, id);
}

export function saveDraft(repo: Repo, id: string, d: DraftInput & { editor?: string }) {
  const item = repo.findItem(id);
  if (!item) throw new HttpError(404, "Không tìm thấy nội dung");
  const status = normalizeStatus(item.meta.status);
  if (!STUDIO_STATUSES.includes(status)) {
    throw new HttpError(409, `Nội dung đang ở ${status} (đã được duyệt). Muốn sửa, hãy "Trả về bản thảo" trên Kanban — chữ ký duyệt cũ sẽ bị hủy.`);
  }
  const meta: Meta = { ...item.meta };
  for (const k of EDITABLE_META) if (d.meta[k] !== undefined) meta[k] = String(d.meta[k]).trim() || (k === "claims" || k === "idea_ref" ? "-" : "");
  if (!FORMATS[meta.format]) throw bad("Định dạng kịch bản không hợp lệ");
  // Sửa nội dung sau khi brief đã duyệt: giữ trạng thái nhưng ghi nhật ký; claim chưa duyệt → NEEDS_SOURCE
  let body = composeBody(repo, item.body, { ...d, meta });
  let nextSt = status;
  if (status === "NEEDS_REVIEW" && pendingLabelNeeded(repo, meta, body)) nextSt = "NEEDS_SOURCE";
  if (nextSt !== status || d.editor) {
    body = appendStatusLog(body, { date: today(), from: status, to: nextSt, by: d.editor?.trim() || "Script Studio", note: "Sửa nội dung trong Script Studio" });
  }
  meta.status = nextSt;
  repo.saveItem(item.file, meta, body);
  return getItem(repo, id);
}

// ---------------------------------------------------------------- kanban
export function moveItem(repo: Repo, id: string, input: { to?: string; actor?: string; note?: string; publishedUrl?: string; learning?: string }) {
  const item = repo.findItem(id);
  if (!item) throw new HttpError(404, "Không tìm thấy nội dung");
  const from = normalizeStatus(item.meta.status);
  const to = normalizeStatus(input.to);
  if (!isValidStatus(to)) throw bad("Trạng thái đích không hợp lệ");
  if (!isHumanName(input.actor)) throw bad("Cần tên người thực hiện (không phải AI/Agent)");
  if (APPROVAL_ONLY.has(to) && statusIndex(to) > statusIndex(from)) {
    throw bad(`${to} chỉ vào được qua Hàng chờ phê duyệt (cần người duyệt ký tên)`);
  }
  const fi = statusIndex(from);
  const ti = statusIndex(to);
  const meta: Meta = { ...item.meta, status: to };
  let body = item.body;
  if (ti < fi) {
    // Trả về: hủy chữ ký các cổng phía sau
    if (ti < statusIndex("APPROVED_TO_PUBLISH")) { meta.publish_approved_by = ""; meta.publish_approved_date = ""; }
    if (ti < statusIndex("APPROVED_TO_RECORD")) { meta.record_approved_by = ""; meta.record_approved_date = ""; }
    if (ti < statusIndex("SCRIPT_DRAFT")) { meta.brief_approved_by = ""; meta.brief_approved_date = ""; }
  } else {
    const allowed = new Set([nextStatus(from)]);
    if (from === "SCRIPT_DRAFT") allowed.add("NEEDS_REVIEW");
    if (!allowed.has(to)) throw bad(`Không được nhảy cóc từ ${from} sang ${to}`);
    if (to === "NEEDS_REVIEW" && pendingLabelNeeded(repo, meta, body)) throw bad("Còn claim chưa APPROVED hoặc nhắc sản phẩm → phải ở NEEDS_SOURCE");
    if (to === "PUBLISHED") {
      if (!input.publishedUrl?.trim()) throw bad("Cần đường link bài đã đăng");
      meta.published_url = input.publishedUrl.trim();
    }
    if (to === "MEASURED" && !repo.metrics().some((m) => m.itemId === id)) throw bad("Cần nhập chỉ số ở trang Phân tích hiệu quả trước");
    if (to === "LEARNING_CAPTURED") {
      if (!input.learning?.trim()) throw bad("Cần ghi bài học rút ra");
      body = body.replace(/\*\*Bài học rút ra[^*]*\*\*:?/, (m) => `${m}\n- ${today()} (${input.actor}): ${input.learning!.trim()}`);
      if (!/Bài học rút ra/.test(body)) body += `\n**Bài học rút ra (LEARNING_CAPTURED):**\n- ${today()} (${input.actor}): ${input.learning.trim()}\n`;
    }
  }
  const comp = checkCompliance(meta, body, repo.claims());
  const blocking = comp.findings.filter((f) => f.severity === "FAIL" && ["SIGNATURE", "UNAPPROVED_CLAIM_ADVANCED"].includes(f.code));
  if (blocking.length) throw bad(blocking.map((f) => f.message).join("; "));
  body = appendStatusLog(body, { date: today(), from, to, by: input.actor!, note: input.note?.trim() || (ti < fi ? "Trả về" : "Chuyển bước") });
  repo.saveItem(item.file, meta, body);
  repo.logApproval({ at: new Date().toISOString(), targetType: "transition", targetId: id, action: "MOVE", reviewer: input.actor!, reason: input.note, from, to });
  return getItem(repo, id);
}

// ---------------------------------------------------------------- hàng chờ phê duyệt
interface QueueEntry {
  targetType: "insight" | "brief" | "script" | "publish";
  targetId: string;
  title: string;
  score: number;
  verdict: string;
  blockers: string[];
  needsCarefulReview: boolean;
  approveTo: string;
}

export function getApprovals(repo: Repo) {
  const queue: QueueEntry[] = [];
  const notEligible: QueueEntry[] = [];
  const push = (e: QueueEntry, eligible: boolean) => (eligible ? queue : notEligible).push(e);
  for (const ins of getInsights(repo).filter((i) => i.status === "HYPOTHESIS")) {
    const q = ins.quality;
    push({ targetType: "insight", targetId: ins.id, title: ins.text.slice(0, 120), score: q.score, verdict: q.verdict, blockers: q.blockers, needsCarefulReview: q.verdict === "NEEDS_REVIEW", approveTo: "CONFIRMED" },
      !q.blockers.length && q.score >= 80);
  }
  for (const it of listItems(repo)) {
    const st = it.meta.status;
    const title = it.meta.title ?? it.id;
    if (st === "CONTENT_BRIEF") {
      const q = it.briefScore;
      push({ targetType: "brief", targetId: it.id, title, score: q.score, verdict: q.verdict, blockers: q.blockers, needsCarefulReview: q.verdict === "NEEDS_REVIEW", approveTo: "SCRIPT_DRAFT" }, !q.blockers.length && q.score >= 80);
    } else if (st === "NEEDS_REVIEW") {
      const q = it.scriptScore;
      const fails = it.compliance.findings.filter((f) => f.severity === "FAIL").map((f) => f.message);
      push({ targetType: "script", targetId: it.id, title, score: q.score, verdict: q.verdict, blockers: [...q.blockers, ...fails], needsCarefulReview: q.verdict === "NEEDS_REVIEW", approveTo: "APPROVED_TO_RECORD" },
        !q.blockers.length && !fails.length && q.score >= 80);
    } else if (st === "FINAL_REVIEW") {
      const q = it.scriptScore;
      const fails = it.compliance.findings.filter((f) => f.severity === "FAIL" && f.code !== "SIGNATURE").map((f) => f.message);
      push({ targetType: "publish", targetId: it.id, title, score: q.score, verdict: q.verdict, blockers: [...q.blockers, ...fails], needsCarefulReview: true, approveTo: "APPROVED_TO_PUBLISH" }, !q.blockers.length && !fails.length);
    }
  }
  return { queue, notEligible, log: repo.approvals().slice(-50).reverse() };
}

export function decide(repo: Repo, input: { targetType?: string; targetId?: string; action?: string; reviewer?: string; reason?: string; confirmWatched?: boolean }) {
  const { targetType, targetId, action } = input;
  const reviewer = input.reviewer?.trim() ?? "";
  if (!isHumanName(reviewer)) throw bad("Cần tên người duyệt là con người (không phải AI/Claude/Agent)");
  if (!["APPROVE", "REJECT", "REVISE"].includes(action ?? "")) throw bad("Hành động không hợp lệ");
  if (action !== "APPROVE" && !input.reason?.trim()) throw bad("Từ chối hoặc yêu cầu sửa phải ghi lý do");
  const { queue, notEligible } = getApprovals(repo);
  const entry = [...queue, ...notEligible].find((e) => e.targetType === targetType && e.targetId === targetId);
  if (!entry) throw new HttpError(404, "Mục không có trong hàng chờ");
  if (action === "APPROVE" && !queue.includes(entry)) throw bad(`Chưa đủ điều kiện duyệt: ${entry.blockers.join("; ") || `điểm ${entry.score} < 80`}`);
  if (action === "APPROVE" && targetType === "publish" && !input.confirmWatched) throw bad("Cần xác nhận đã xem bản dựng cuối");
  const d = today();
  const log: ApprovalEntry = { at: new Date().toISOString(), targetType: targetType as ApprovalEntry["targetType"], targetId: targetId!, action: action as ApprovalEntry["action"], reviewer, reason: input.reason?.trim(), score: entry.score };

  if (targetType === "insight") {
    const list = repo.insights();
    const ins = list.find((i) => i.id === targetId)!;
    if (action === "APPROVE") ins.status = "CONFIRMED";
    if (action === "REJECT") ins.status = "REJECTED";
    ins.history.push({ at: d, by: reviewer, action: action === "APPROVE" ? "Xác nhận (CONFIRMED)" : action === "REJECT" ? "Từ chối" : "Yêu cầu sửa", reason: input.reason?.trim() });
    repo.saveInsights(list);
    repo.logApproval(log);
    return { ok: true, insight: ins };
  }

  const item = repo.findItem(targetId!)!;
  const meta: Meta = { ...item.meta };
  const from = normalizeStatus(meta.status);
  let to = from;
  if (action === "APPROVE") {
    to = entry.approveTo;
    if (targetType === "brief") { meta.brief_approved_by = reviewer; meta.brief_approved_date = d; }
    if (targetType === "script") { meta.record_approved_by = reviewer; meta.record_approved_date = d; }
    if (targetType === "publish") { meta.publish_approved_by = reviewer; meta.publish_approved_date = d; }
  } else {
    to = targetType === "brief" ? "IDEA" : targetType === "publish" ? "EDITING" : "SCRIPT_DRAFT";
  }
  meta.status = to;
  const comp = checkCompliance(meta, item.body, repo.claims());
  const fails = comp.findings.filter((f) => f.severity === "FAIL");
  if (action === "APPROVE" && fails.length) throw bad(`Không thể duyệt: ${fails.map((f) => f.message).join("; ")}`);
  const verb = action === "APPROVE" ? "Phê duyệt" : action === "REJECT" ? "Từ chối" : "Yêu cầu sửa";
  const body = appendStatusLog(item.body, { date: d, from, to, by: reviewer, note: `${verb} (${targetType}, điểm ${entry.score})${input.reason ? ": " + input.reason.trim() : ""}` });
  repo.saveItem(item.file, meta, body);
  repo.logApproval({ ...log, from, to });
  return { ok: true, item: getItem(repo, targetId!) };
}

// ---------------------------------------------------------------- bản đồ nội dung
export function getContentMap(repo: Repo) {
  const pillars = parseTable(repo.readOr("content/content-pillars.md")).rows.filter((r) => /^P\d/.test(r[0])).map((r) => ({ id: r[0], name: r[1] }));
  const ideaRows: { id: string; idea: string; status: string; group: string }[] = [];
  for (const part of repo.readOr("content/idea-bank.md").split("\n## ").slice(1)) {
    const group = part.split("\n")[0];
    for (const r of parseTable(part).rows) if (/^N\d-\d+/.test(r[0])) ideaRows.push({ id: r[0], idea: r[1], status: r[7] ?? "", group });
  }
  return {
    segment: "Người trung niên gặp vấn đề tuần hoàn, tim mạch (độ tuổi: NOT_DECIDED — C-01)",
    pillars,
    stages: ["Aware", "Appeal", "Ask", "Act", "Advocate"],
    insights: repo.insights().map((i) => ({ id: i.id, status: i.status })),
    items: listItems(repo),
    ideas: ideaRows,
    statuses: STATUSES.map((s) => ({ id: s, label: STATUS_LABELS[s] })),
  };
}

// ---------------------------------------------------------------- phân tích & vòng phản hồi
export function getAnalytics(repo: Repo) {
  const items = listItems(repo);
  const metrics = repo.metrics();
  const eligible = items.filter((i) => statusIndex(i.meta.status) >= statusIndex("PUBLISHED") && !i.hasProduct);
  const rows = eligible.map((i) => {
    const ms = metrics.filter((m) => m.itemId === i.id);
    const last = ms[ms.length - 1];
    return { id: i.id, title: i.meta.title, status: i.meta.status, url: i.meta.published_url, latest: last ?? null, entries: ms.length };
  });
  const sum = (k: keyof MetricEntry) => rows.reduce((a, r) => a + (r.latest ? Number(r.latest[k]) || 0 : 0), 0);
  const measured = rows.filter((r) => r.latest);
  return {
    rows,
    summary: {
      videos: rows.length,
      measured: measured.length,
      views: sum("views"),
      avgWatchSeconds: measured.length ? Math.round(sum("avgWatchSeconds") / measured.length) : 0,
      comments: sum("comments"),
      consultMessages: sum("consultMessages"),
      questions: sum("questionsCount"),
    },
    note: "Chỉ theo dõi video giáo dục KHÔNG chứa sản phẩm (PART-05). Câu hỏi khách hàng được lưu vào private/ và đưa vào vòng học của Agent 01.",
    pendingFeedback: repo.customerData().filter((r) => !r.processed).length,
    manualPromptLearning: learningPrompt("content/items/<id>.md"),
  };
}

export function addMetrics(repo: Repo, input: { itemId?: string; views?: number; avgWatchSeconds?: number; comments?: number; consultMessages?: number; questions?: string[]; enteredBy?: string; date?: string }) {
  if (!isHumanName(input.enteredBy)) throw bad("Cần tên người nhập số liệu");
  const item = repo.findItem(input.itemId ?? "");
  if (!item) throw new HttpError(404, "Không tìm thấy nội dung");
  const ev = evaluateItem(repo, item);
  if (statusIndex(ev.meta.status) < statusIndex("PUBLISHED")) throw bad("Chỉ nhập chỉ số cho video đã đăng (PUBLISHED)");
  if (ev.hasProduct) throw bad("PART-05 chỉ theo dõi video giáo dục không chứa sản phẩm");
  const num = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw bad("Chỉ số phải là số không âm");
    return Math.round(n);
  };
  const questions = (input.questions ?? []).map((q) => String(q).trim()).filter(Boolean);
  for (const q of questions) {
    const pii = detectPII(q);
    if (pii.length) throw bad(`Câu hỏi "${q.slice(0, 40)}…" có thông tin nhận diện (${pii.join(", ")}) — hãy ẩn danh`);
  }
  const entry: MetricEntry = {
    itemId: item.id, date: input.date || today(), views: num(input.views ?? 0), avgWatchSeconds: num(input.avgWatchSeconds ?? 0),
    comments: num(input.comments ?? 0), consultMessages: num(input.consultMessages ?? 0), questionsCount: questions.length, enteredBy: input.enteredBy!.trim(),
  };
  repo.saveMetrics([...repo.metrics(), entry]);
  for (const q of questions) {
    addCustomerRecord(repo, { quote: q, type: "câu hỏi", source: `Bình luận video ${item.id}`, channel: item.meta.published_url || "NOT_DECIDED", date: entry.date, anonymized: true });
  }
  return entry;
}

// ---------------------------------------------------------------- router & manual tasks
export function getRouter(repo: Repo, env: Env) {
  const cfg = repo.router();
  return {
    tiers: routerStatus(cfg, env),
    routes: Object.keys(cfg.tasks).map((t) => route(t, cfg, env)),
    humanOnly: cfg.humanOnlyTasks.map((t) => route(t, cfg, env)),
    manualTasks: MANUAL_TASKS,
    howToEnable: "Bật tầng 2/3 trong config/model-router.json (enabled: true), đặt tên model vào biến môi trường AIOS_MODEL_LOW / AIOS_MODEL_HIGH và ANTHROPIC_API_KEY trong file .env.local (không commit).",
  };
}

export async function runAiTask(repo: Repo, env: Env, input: { task?: string; itemId?: string; instruction?: string }, callModel: (model: string, system: string, user: string) => Promise<string>) {
  const task = input.task ?? "";
  const decision = route(task, repo.router(), env);
  if (decision.tier === null) throw new HttpError(403, "Việc này chỉ con người được làm");
  if (decision.tier === 0) throw bad("Việc này xử lý bằng logic, không cần AI");
  const item = input.itemId ? repo.findItem(input.itemId) : undefined;
  const file = item?.file ?? "content/items/<id>.md";
  const manualPrompt = task === "semantic_review" ? reviewPrompt(file) : task === "propose_learning" ? learningPrompt(file) : writeScriptPrompt(file);
  if (decision.tier === 1) return { decision, prompt: manualPrompt };
  const user = [
    `Nhiệm vụ: ${task}.`,
    input.instruction ? `Yêu cầu thêm: ${input.instruction}` : "",
    item ? `Nội dung hiện tại (file ${item.file}):\n${item.body}` : "",
    `Claim Registry (trạng thái):\n${Object.values(repo.claims()).map((c) => `${c.id}: ${c.text} — ${c.status}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");
  const draft = await callModel(decision.model!, apiDraftSystemPrompt(), user);
  return { decision, draft, label: "BẢN NHÁP AI — cần con người đọc, sửa và duyệt; chưa được lưu vào nội dung" };
}

export function getMeta() {
  return { statuses: STATUSES.map((s) => ({ id: s, label: STATUS_LABELS[s] })), formats: Object.entries(FORMATS).map(([id, f]) => ({ id, ...f })) };
}
