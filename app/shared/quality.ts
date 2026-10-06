import { RULES } from "./rules";
import { checkCompliance, mentionedProducts, parseClaimList, type ClaimInfo } from "./compliance";
import { FORMATS, STAGES, STAGE_CTA, matchBlock, parseBrief, parseScript } from "./script";
import type { Criterion, GateVerdict, Insight, Meta, QualityResult } from "./types";

/**
 * Quality Gate 100 điểm — Tầng 0 (logic, không gọi AI).
 * < 80: NEEDS_REVISION · 80–89: NEEDS_REVIEW · ≥ 90: READY_FOR_APPROVAL.
 * Blocker luôn thắng điểm. Đạt 90 KHÔNG có nghĩa là tự động xuất bản.
 */
export function verdictFor(score: number, blockers: { kind: "BLOCKED" | "REJECTED" }[]): GateVerdict {
  if (blockers.some((b) => b.kind === "REJECTED")) return "REJECTED";
  if (blockers.length) return "BLOCKED";
  if (score < 80) return "NEEDS_REVISION";
  if (score < 90) return "NEEDS_REVIEW";
  return "READY_FOR_APPROVAL";
}

function build(kind: QualityResult["kind"], criteria: Criterion[], blockers: { kind: "BLOCKED" | "REJECTED"; message: string }[]): QualityResult {
  const score = Math.round(criteria.reduce((a, c) => a + c.earned, 0));
  return { kind, score, verdict: verdictFor(score, blockers), blockers: blockers.map((b) => `${b.kind}: ${b.message}`), criteria };
}

const crit = (id: string, label: string, points: number, ok: boolean | number, note?: string): Criterion => ({
  id, label, points, earned: typeof ok === "number" ? Math.max(0, Math.min(points, ok)) : ok ? points : 0, note,
});

const filled = (v: string | undefined) => !!v && !/^(—|-|\s*)$/.test(v.trim());
const SEGMENT_WORDS = ["tuần hoàn", "tim mạch", "tê bì", "mất ngủ", "hoa mắt", "chóng mặt", "đột quỵ", "tai biến", "hàng giả", "gánh nặng", "dược sĩ", "đi khám", "sức khỏe", "trung niên"];
const isRealSource = (src: string) => !!src && !/chưa có nguồn|giả lập/i.test(src);

function blockersFromText(text: string, claims: string[], registry: Record<string, ClaimInfo>) {
  const low = text.toLowerCase();
  const out: { kind: "BLOCKED" | "REJECTED"; message: string }[] = [];
  for (const w of RULES.offPositioning) if (low.includes(w)) out.push({ kind: "BLOCKED", message: `Sai định vị: '${w}'` });
  for (const rx of RULES.fabricationPatterns) {
    const m = low.match(new RegExp(rx, "i"));
    if (m) out.push({ kind: "REJECTED", message: `Thông tin bịa đặt/không kiểm chứng: '${m[0]}'` });
  }
  const unapproved = claims.filter((c) => !registry[c]?.approved);
  if (unapproved.length) out.push({ kind: "BLOCKED", message: `Tuyên bố thiếu nguồn: ${unapproved.join(", ")} chưa APPROVED` });
  const highRisk = unapproved.filter((c) => RULES.highRiskClaims.includes(c));
  if (highRisk.length) out.push({ kind: "BLOCKED", message: `Lĩnh vực rủi ro cao chưa duyệt: ${highRisk.join(", ")}` });
  const products = mentionedProducts(text);
  if (products.length && !claims.length) out.push({ kind: "BLOCKED", message: `Nhắc sản phẩm (${products.join(", ")}) không có claim` });
  return out;
}

export function scoreInsight(ins: Insight, registry: Record<string, ClaimInfo>): QualityResult {
  const text = ins.text ?? "";
  const low = text.toLowerCase();
  const sourced = ins.evidence.filter((e) => isRealSource(e.source));
  const criteria = [
    crit("I1", "Cấu trúc “Tôi muốn… nhưng… bởi vì…”", 25, /tôi muốn/.test(low) && /nhưng/.test(low) && /bởi vì/.test(low)),
    crit("I2", "Có ít nhất 1 bằng chứng có nguồn thật", 15, sourced.length >= 1, `${sourced.length} bằng chứng có nguồn`),
    crit("I3", "Có từ 3 bằng chứng có nguồn thật", 15, sourced.length >= 3),
    crit("I4", "Liên kết dữ liệu (V-xx, OBJ-xx, dữ liệu khách)", 10, ins.evidence.length > 0),
    crit("I5", "Nguồn dữ liệu không phải giả lập/CHƯA CÓ NGUỒN", 10, ins.evidence.length > 0 && sourced.length === ins.evidence.length),
    crit("I6", "Đúng phân khúc tuần hoàn, tim mạch", 10, SEGMENT_WORDS.some((w) => low.includes(w))),
    crit("I7", "Không chứa tuyên bố sản phẩm", 10, mentionedProducts(text).length === 0),
    crit("I8", "Có lịch sử phê duyệt/ghi nhận", 5, ins.history.length > 0),
  ];
  if (ins.status === "MISSING" || !text.trim()) {
    return build("insight", criteria.map((c) => ({ ...c, earned: 0 })), [{ kind: "BLOCKED", message: "Insight chưa có nội dung (CHƯA CÓ NGUỒN)" }]);
  }
  return build("insight", criteria, blockersFromText(text, [], registry));
}

export function insightConfidence(ins: Insight): number {
  return Math.min(100, ins.evidence.filter((e) => isRealSource(e.source)).length * 25);
}

export function scoreBrief(meta: Meta, body: string, registry: Record<string, ClaimInfo>, insightIds: string[]): QualityResult {
  const b = parseBrief(body);
  const core = ["Khách hàng mục tiêu", "Giai đoạn hành trình (5A)", "Insight", "Vấn đề", "Niềm tin cần thay đổi", "Mục tiêu nội dung", "Thông điệp chính", "Hook", "Nội dung chính", "CTA", "Chỉ số cần theo dõi"];
  const coreFilled = core.filter((f) => filled(b[f])).length;
  const claims = parseClaimList(meta.claims);
  const productField = (b["Liên quan đến sản phẩm nào"] ?? "").toLowerCase();
  const productNamed = filled(productField) && !productField.startsWith("không");
  const criteria = [
    crit("B1", "11 mục cốt lõi của brief đã điền", 55, coreFilled * 5, `${coreFilled}/11`),
    crit("B2", "Sản phẩm ↔ claim nhất quán", 15, productNamed ? claims.length > 0 : true),
    crit("B3", "Insight có trong thư viện", 10, insightIds.includes((meta.insight ?? "").trim())),
    crit("B4", "Giai đoạn 5A và trụ cột hợp lệ", 10, STAGES.includes(meta.stage_5a ?? "") && /^P[1-8]$/.test(meta.pillar ?? "")),
    crit("B5", "Có nguồn bằng chứng hoặc ghi UNVERIFIED", 10, filled(b["Nguồn bằng chứng"])),
  ];
  const all = Object.values(b).join("\n") + "\n" + (meta.title ?? "");
  const blockers = blockersFromText(all, claims, registry).filter((x) => !x.message.startsWith("Tuyên bố thiếu nguồn") && !x.message.startsWith("Lĩnh vực rủi ro"));
  const banned = RULES.banned.filter((w) => all.toLowerCase().includes(w));
  if (banned.length) blockers.push({ kind: "BLOCKED", message: `Từ cấm trong brief: ${banned.join(", ")}` });
  return build("brief", criteria, blockers);
}

/** Có từ 3 từ VIẾT HOA liên tiếp (mỗi từ ≥ 3 chữ cái) = la hét. */
export function hasShouting(text: string): boolean {
  let run = 0;
  // Bỏ qua phần giữ chỗ trong ngoặc vuông, ví dụ [CHƯA CÓ NGUỒN]
  for (const raw of text.replace(/\[[^\]]*\]/g, " ").split(/\s+/)) {
    const w = raw.replace(/[^\p{L}]/gu, "");
    const upper = w.length >= 3 && w === w.toUpperCase() && w !== w.toLowerCase();
    run = upper ? run + 1 : 0;
    if (run >= 3) return true;
  }
  return false;
}

export function scoreScript(meta: Meta, body: string, registry: Record<string, ClaimInfo>, insightIds: string[]): QualityResult {
  const fmt = FORMATS[meta.format ?? ""];
  const { blocks, caption, scriptText } = parseScript(body);
  const low = scriptText.toLowerCase();
  const required = fmt ? fmt.blocks.filter((d) => d.required) : [];
  const present = required.filter((d) => blocks.some((bl) => matchBlock(d, bl.block)));
  const ctaWords = STAGE_CTA[meta.stage_5a ?? ""] ?? [];
  const lastLines = blocks.slice(-2).map((b) => b.line.toLowerCase()).join(" ");
  const health = RULES.healthWords.some((w) => low.includes(w));
  const exclam = (scriptText.match(/!/g) ?? []).length;
  const shouting = hasShouting(scriptText);
  const words = scriptText.split(/\s+/).filter(Boolean).length;
  const [minW, maxW] = meta.format === "vsl" ? [250, 3000] : [40, 450];
  const absolute = RULES.absolute.filter((w) => low.includes(w));
  const hook = blocks[0]?.line ?? "";
  const criteria = [
    crit("S1", `Đúng cấu trúc ${fmt?.label ?? "(định dạng không hợp lệ)"}`, 25, fmt ? (present.length / Math.max(1, required.length)) * 25 : 0, `${present.length}/${required.length} khối bắt buộc`),
    crit("S2", "Hook có và ngắn gọn (≤ 2 câu)", 10, !!hook && hook.split(/[.!?…]/).filter((s) => s.trim()).length <= 2),
    crit("S3", "CTA đúng giai đoạn 5A", 10, ctaWords.length > 0 && ctaWords.some((w) => lastLines.includes(w))),
    crit("S4", "Nói triệu chứng thì khuyên đi khám bác sĩ", 10, !health || /bác sĩ|đi khám|thăm khám/.test(low)),
    crit("S5", "Giọng từ tốn: không hô hào, không viết hoa la hét", 10, exclam <= 1 && !shouting, `${exclam} dấu "!"`),
    crit("S6", "Không dùng cụm tuyệt đối", 10, absolute.length === 0, absolute.join(", ")),
    crit("S7", "Không ghi độ tuổi cụ thể, không hứa 'trọn đời'", 5, !/\b(35|40)\s*[–-]\s*65\b|\bu40/i.test(low) && !low.includes("trọn đời")),
    crit("S8", "Có caption", 5, caption.trim().length > 0),
    crit("S9", "Truy xuất được: insight, trụ cột, giai đoạn hợp lệ", 10, insightIds.includes((meta.insight ?? "").trim()) && /^P[1-8]$/.test(meta.pillar ?? "") && STAGES.includes(meta.stage_5a ?? "")),
    crit("S10", "Độ dài lời thoại phù hợp", 5, words >= minW && words <= maxW, `${words} từ`),
  ];
  const claims = parseClaimList(meta.claims);
  const blockers = blockersFromText(scriptText + "\n" + caption, claims, registry);
  const comp = checkCompliance(meta, body, registry);
  for (const f of comp.findings) {
    if (f.severity === "FAIL" && ["BAN", "PRODUCT_NO_CLAIM", "NO_PENDING_LABEL", "CLAIM_UNKNOWN"].includes(f.code)) {
      blockers.push({ kind: "BLOCKED", message: f.message });
    }
  }
  if (!blocks.length) blockers.push({ kind: "BLOCKED", message: "Chưa có kịch bản" });
  return build("script", criteria, blockers);
}
