import { RULES } from "./rules";
import { isHumanName, isValidStatus, normalizeStatus, statusIndex } from "./lifecycle";
import type { ComplianceResult, Finding, Meta } from "./types";

export interface ClaimInfo {
  id: string;
  text: string;
  scope: string;
  approved: boolean;
  status: string;
  risk: string;
}

/** Đọc compliance/claim-registry.md: mỗi dòng "| CLM-xxx | ..." */
export function parseClaimRegistry(md: string): Record<string, ClaimInfo> {
  const out: Record<string, ClaimInfo> = {};
  for (const line of md.split("\n")) {
    if (!line.startsWith("| CLM-")) continue;
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    const status = cells.find((c) => /^(APPROVED|VERIFIED|UNVERIFIED|CẦN CON NGƯỜI PHÊ DUYỆT|CHƯA QUYẾT ĐỊNH)/.test(c)) ?? "";
    const risk = cells.find((c) => /^(Thấp|Trung bình|Cao|Rất cao)$/.test(c)) ?? "";
    out[cells[0]] = { id: cells[0], text: cells[1] ?? "", scope: cells[2] ?? "", approved: cells.includes("APPROVED"), status, risk };
  }
  return out;
}

export function parseClaimList(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((c) => c.trim()).filter((c) => c && c !== "-");
}

export function mentionedProducts(text: string): string[] {
  const low = text.toLowerCase();
  return Object.entries(RULES.products).filter(([, rx]) => new RegExp(rx, "i").test(low)).map(([name]) => name);
}

function negated(low: string, pos: number): boolean {
  return low.slice(Math.max(0, pos - 15), pos).includes("không");
}

/** Cùng luật với tools/check_content.py (đọc chung config/compliance-rules.json). */
export function checkCompliance(meta: Meta, body: string, registry: Record<string, ClaimInfo>): ComplianceResult {
  const findings: Finding[] = [];
  const fail = (code: string, message: string) => findings.push({ severity: "FAIL", code, message });
  const warn = (code: string, message: string) => findings.push({ severity: "WARN", code, message });
  const low = body.toLowerCase();
  const status = normalizeStatus(meta.status);

  if (!isValidStatus(status)) {
    fail("STATUS", `Trạng thái '${meta.status ?? ""}' không hợp lệ`);
    return finish(findings);
  }
  const s = statusIndex(status);

  for (const w of RULES.banned) {
    let pos = low.indexOf(w);
    while (pos >= 0) {
      if (negated(low, pos)) warn("BAN_NEGATED", `Có cụm cấm '${w}' trong câu phủ định — người duyệt kiểm tra lại`);
      else fail("BAN", `Từ cấm: '${w}'`);
      pos = low.indexOf(w, pos + w.length);
    }
  }
  for (const w of RULES.offPositioning) {
    if (low.includes(w)) fail("OFF_POSITIONING", `Ngoài định vị chuyên môn (tuần hoàn, tim mạch): '${w}'`);
  }
  for (const rx of RULES.fabricationPatterns) {
    const m = low.match(new RegExp(rx, "i"));
    if (m) fail("FABRICATION", `Số liệu/khan hiếm/kết quả không có nguồn: '${m[0]}'`);
  }
  for (const w of RULES.absolute) {
    if (low.includes(w)) warn("ABSOLUTE", `Cụm tuyệt đối/nhạy cảm: '${w}' — cần người duyệt`);
  }

  const claimIds = parseClaimList(meta.claims);
  for (const c of claimIds) if (!registry[c]) fail("CLAIM_UNKNOWN", `Claim ${c} không có trong Claim Registry`);
  const unapproved = claimIds.filter((c) => registry[c] && !registry[c].approved);
  const products = mentionedProducts(body);
  const hasLabel = low.includes(RULES.pendingLabel.toLowerCase());

  if (products.length && !claimIds.length) {
    fail("PRODUCT_NO_CLAIM", `Nhắc sản phẩm ${products.join(", ")} nhưng không khai báo claim`);
    if (!hasLabel) fail("NO_PENDING_LABEL", "Nội dung nhắc sản phẩm thiếu nhãn chờ claim");
  }
  if (unapproved.length && !hasLabel) {
    fail("NO_PENDING_LABEL", `Claim chưa APPROVED (${unapproved.join(", ")}) nhưng thiếu nhãn '${RULES.pendingLabel} – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI'`);
  }
  if ((unapproved.length || (products.length && !claimIds.length)) && s >= statusIndex("APPROVED_TO_RECORD")) {
    fail("UNAPPROVED_CLAIM_ADVANCED", `Trạng thái ${status} không được phép khi còn claim chưa APPROVED`);
  }
  const health = RULES.healthWords.filter((w) => low.includes(w));
  if (health.length && !claimIds.length) {
    warn("HEALTH_WORDS", `Có từ khóa sức khỏe (${health.join(", ")}) — xác định có phải tuyên bố cần claim không`);
  }

  for (const [gate, fields] of Object.entries(RULES.signatures)) {
    if (s >= statusIndex(gate)) {
      const [by, date] = fields;
      if (!isHumanName(meta[by]) || !meta[date]) {
        fail("SIGNATURE", `${gate} cần ${by} là tên người (không phải AI/Agent) và ${date}`);
      }
    }
  }

  if (/\b(35|40)\s*[–-]\s*65\b|\bu40/i.test(low)) warn("AGE", "Có độ tuổi cụ thể — độ tuổi đã chốt 35–65 (D-032); tránh ghi số tuổi trong lời thoại công khai");
  if (low.includes("trọn đời")) warn("LIFETIME", "'trọn đời' — phạm vi cam kết NOT_DECIDED (C-06)");
  return finish(findings);
}

function finish(findings: Finding[]): ComplianceResult {
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    const k = f.severity + f.message;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const result = unique.some((f) => f.severity === "FAIL") ? "FAIL" : unique.length ? "WARN" : "PASS";
  return { result, findings: unique };
}
