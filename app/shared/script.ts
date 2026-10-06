import type { ScriptBlock } from "./types";
import { escapeCell, splitTopSections } from "./markdown-table";

export interface BlockDef {
  key: string;
  label: string;
  match: string[];
  required: boolean;
  hint: string;
}

export interface FormatDef {
  label: string;
  stages: string[];
  blocks: BlockDef[];
}

const cta = (hint = "CTA theo giai đoạn 5A"): BlockDef => ({ key: "cta", label: "CTA", match: ["cta", "kêu gọi"], required: true, hint });

/** 7 cấu trúc kịch bản đã chốt ở PART-03 (content/templates/). */
export const FORMATS: Record<string, FormatDef> = {
  "video-gia-tri": {
    label: "Video giá trị",
    stages: ["Aware", "Appeal"],
    blocks: [
      { key: "hook", label: "Hook – Vấn đề nhức nhối", match: ["hook"], required: true, hint: "Có thể dùng verbatim V-01..V-05" },
      { key: "insight", label: "Insight – Nỗi khổ thầm kín", match: ["insight"], required: true, hint: "Ghi INS-xx" },
      { key: "solution", label: "Giải pháp khoa học ngắn gọn", match: ["giải pháp"], required: true, hint: "Kiến thức, thói quen, khuyên đi khám; không nêu nguyên nhân y khoa khi chưa có nguồn" },
      cta("Aware/Appeal: mời bình luận"),
    ],
  },
  "video-sua-niem-tin": {
    label: "Video sửa niềm tin",
    stages: ["Aware", "Ask"],
    blocks: [
      { key: "belief", label: "Định kiến phổ biến", match: ["định kiến"], required: true, hint: "Ví dụ V-05" },
      { key: "rebuttal", label: "Phản biện khoa học/thực tế", match: ["phản biện"], required: true, hint: "Mọi kiến thức y khoa cần nguồn" },
      { key: "view", label: "Góc nhìn đúng của Dược sĩ", match: ["góc nhìn"], required: true, hint: "" },
      cta(),
    ],
  },
  "video-chuyen-mon": {
    label: "Video chuyên môn",
    stages: ["Appeal", "Ask"],
    blocks: [
      { key: "expert", label: "Góc nhìn chuyên gia về hoạt chất/cơ chế", match: ["chuyên gia", "cơ chế", "hoạt chất"], required: true, hint: "Bắt buộc Claim ID nếu nhắc sản phẩm" },
      { key: "local", label: "Liên hệ cơ địa người Việt trung niên", match: ["cơ địa", "liên hệ"], required: true, hint: "CLM-026 – UNVERIFIED (C-21)" },
      { key: "safety", label: "Khuyến nghị an toàn", match: ["khuyến nghị", "an toàn"], required: true, hint: "Không trấn an khi chưa có nguồn" },
    ],
  },
  "video-cau-chuyen": {
    label: "Video câu chuyện khách hàng",
    stages: ["Act", "Advocate"],
    blocks: [
      { key: "story", label: "Câu chuyện thật (ẩn danh)", match: ["câu chuyện"], required: true, hint: "CHỈ chuyện thật, có đồng ý (C-20)" },
      { key: "milestone", label: "Mốc thay đổi sau khi tư vấn", match: ["mốc", "thay đổi"], required: true, hint: "Không gán kết quả cho sản phẩm khi claim chưa APPROVED" },
      { key: "lesson", label: "Bài học", match: ["bài học"], required: true, hint: "" },
    ],
  },
  "video-xu-ly-phan-doi": {
    label: "Video xử lý phản đối",
    stages: ["Ask", "Act"],
    blocks: [
      { key: "acknowledge", label: "Thừa nhận băn khoăn", match: ["thừa nhận"], required: true, hint: "Lặp lại đúng lời khách (OBJ-xx)" },
      { key: "value", label: "Phân tích giá trị đầu tư sức khỏe dài hạn", match: ["phân tích", "giá trị"], required: true, hint: "Giá: CHƯA CÓ NGUỒN" },
      { key: "commit", label: "Cam kết đồng hành 1-1", match: ["đồng hành", "cam kết"], required: true, hint: "Phạm vi 'trọn đời' NOT_DECIDED (C-06)" },
      { ...cta(), required: false },
    ],
  },
  "video-ban-hang": {
    label: "Video bán hàng",
    stages: ["Act"],
    blocks: [
      { key: "combo", label: "Combo bảo vệ tuần hoàn chủ động", match: ["combo"], required: true, hint: "CLM-025 – UNVERIFIED (C-16)" },
      { key: "price", label: "Xử lý rào cản giá", match: ["giá"], required: true, hint: "Giá, quyền lợi: CHƯA CÓ NGUỒN" },
      { key: "invite", label: "Lời mời tư vấn cá nhân hóa", match: ["lời mời", "mời tư vấn"], required: true, hint: "Ask/Act: mời nhắn tin, không áp lực" },
    ],
  },
  vsl: {
    label: "VSL (Video Sales Letter)",
    stages: ["Act"],
    blocks: [
      { key: "title", label: "Tiêu đề", match: ["tiêu đề"], required: true, hint: "Không ghi độ tuổi cụ thể (C-01)" },
      { key: "pain", label: "Nỗi đau cốt lõi & Đồng cảm", match: ["nỗi đau", "đồng cảm"], required: true, hint: "INS-01, V-01..V-05" },
      { key: "myth", label: "Vạch trần giải pháp sai lầm", match: ["vạch trần", "sai lầm"], required: true, hint: "Không bôi nhọ (C-19)" },
      { key: "solution", label: "Giới thiệu giải pháp minh bạch", match: ["giới thiệu", "giải pháp minh bạch"], required: true, hint: "UNVERIFIED – CLM-001..013" },
      { key: "rtb", label: "Lý do để tin", match: ["lý do"], required: true, hint: "RTB-1..3 cần duyệt" },
      { key: "offer", label: "Quyền lợi & Lời hứa giá trị", match: ["quyền lợi", "lời hứa"], required: true, hint: "Quyền lợi: CHƯA CÓ NGUỒN" },
      { key: "cta", label: "Kêu gọi tư vấn 1-1 không áp lực", match: ["kêu gọi", "cta"], required: true, hint: "" },
    ],
  },
};

export const BRIEF_FIELDS = [
  "Khách hàng mục tiêu", "Giai đoạn hành trình (5A)", "Insight", "Vấn đề", "Niềm tin cần thay đổi",
  "Mục tiêu nội dung", "Thông điệp chính", "Liên quan đến sản phẩm nào", "Claim được sử dụng",
  "Nguồn bằng chứng", "Hook", "Nội dung chính", "CTA", "Trạng thái kiểm duyệt", "Người duyệt",
  "Chỉ số cần theo dõi",
];

export const STAGES = ["Aware", "Appeal", "Ask", "Act", "Advocate"];

export const STAGE_CTA: Record<string, string[]> = {
  Aware: ["bình luận"],
  Appeal: ["bình luận"],
  Ask: ["nhắn tin", "nhắn"],
  Act: ["nhắn tin", "nhắn"],
  Advocate: ["chia sẻ"],
};

/** Bảng markdown có tiêu đề: trả về tiêu đề và các dòng. */
export function parseTable(section: string): { header: string[]; rows: string[][] } {
  const lines = section.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  const cells = (l: string) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  if (lines.length < 2) return { header: [], rows: [] };
  const header = cells(lines[0]);
  const rows = lines.slice(1).map(cells).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
  return { header, rows };
}

function findSection(body: string, prefix: string): string {
  const sec = splitTopSections(body).find((s) => s.heading.startsWith(prefix));
  return sec ? sec.content : "";
}

export function parseBrief(body: string): Record<string, string> {
  const brief: Record<string, string> = {};
  const { rows } = parseTable(findSection(body, "# 1."));
  for (const r of rows) if (r[0]) brief[r[0]] = r[1] ?? "";
  return brief;
}

export function parseScript(body: string): { blocks: ScriptBlock[]; caption: string; visuals: string; scriptText: string } {
  const section = findSection(body, "# 2.");
  const { header, rows } = parseTable(section);
  const col = (names: string[]) => header.findIndex((h) => names.some((n) => h.toLowerCase().includes(n)));
  const iBlock = Math.max(0, col(["khối"]));
  const iLine = col(["lời thoại"]) >= 0 ? col(["lời thoại"]) : 1;
  const iVisual = col(["hình"]);
  const iClaim = col(["claim"]);
  const blocks = rows.map((r) => ({
    block: r[iBlock] ?? "",
    line: r[iLine] ?? "",
    visual: iVisual >= 0 ? r[iVisual] ?? "" : "",
    claim: iClaim >= 0 ? r[iClaim] ?? "" : "",
  }));
  const grab = (label: string) => {
    const m = section.match(new RegExp(`\\*\\*${label}[^*]*\\*\\*:?\\s*\\n?([\\s\\S]*?)(?=\\n\\*\\*|\\n# |$)`, "i"));
    return m ? m[1].trim() : "";
  };
  return { blocks, caption: grab("Caption"), visuals: grab("Gợi ý tư liệu"), scriptText: blocks.map((b) => b.line).join("\n") };
}

export function matchBlock(def: BlockDef, blockName: string): boolean {
  const n = blockName.toLowerCase();
  return def.match.some((m) => n.includes(m));
}

/** Ghi lại mục 1 (Brief) và mục 2 (Kịch bản); giữ nguyên các mục khác. */
export function renderBody(
  body: string,
  brief: Record<string, string>,
  blocks: ScriptBlock[],
  caption: string,
  visuals: string,
  pendingLabel: string | null,
): string {
  const sections = splitTopSections(body);
  const briefMd =
    "# 1. Content Brief\n| Mục | Nội dung |\n|---|---|\n" +
    BRIEF_FIELDS.map((f) => `| ${f} | ${escapeCell(brief[f] ?? "")} |`).join("\n") +
    "\n\n";
  const scriptMd =
    "# 2. Kịch bản\n" +
    (pendingLabel ? `**${pendingLabel}**\n\n` : "") +
    "| Khối | Lời thoại | Hình ảnh / chữ trên màn hình | Claim |\n|---|---|---|---|\n" +
    blocks.map((b) => `| ${escapeCell(b.block)} | ${escapeCell(b.line)} | ${escapeCell(b.visual)} | ${escapeCell(b.claim)} |`).join("\n") +
    `\n\n**Caption:**\n${caption.trim()}\n\n**Gợi ý tư liệu trực quan (chỉ là từ khóa/ý tưởng; bản quyền do con người kiểm tra):**\n${visuals.trim()}\n\n`;
  const others = sections.filter((s) => !s.heading.startsWith("# 1.") && !s.heading.startsWith("# 2."));
  const rest = others.map((s) => (s.heading ? `${s.heading}\n${s.content}` : s.content)).join("");
  const defaults = rest.includes("# 4.")
    ? rest
    : rest + "# 3. Kiểm tra\n\n# 4. Nhật ký trạng thái\n| Ngày | Từ | Sang | Người thực hiện | Ghi chú |\n|---|---|---|---|---|\n\n# 5. Kết quả sau xuất bản\n**Bài học rút ra (LEARNING_CAPTURED):**\n";
  return briefMd + scriptMd + defaults;
}

/** Thêm một dòng vào bảng "# 4. Nhật ký trạng thái". */
export function appendStatusLog(body: string, row: { date: string; from: string; to: string; by: string; note: string }): string {
  const line = `| ${row.date} | ${row.from} | ${row.to} | ${escapeCell(row.by)} | ${escapeCell(row.note)} |`;
  const sections = splitTopSections(body);
  const idx = sections.findIndex((s) => s.heading.startsWith("# 4."));
  if (idx < 0) {
    return body.trimEnd() + `\n\n# 4. Nhật ký trạng thái\n| Ngày | Từ | Sang | Người thực hiện | Ghi chú |\n|---|---|---|---|---|\n${line}\n`;
  }
  const s = sections[idx];
  const lines = s.content.split("\n");
  let last = -1;
  lines.forEach((l, i) => {
    if (l.trim().startsWith("|")) last = i;
  });
  if (last < 0) lines.unshift("| Ngày | Từ | Sang | Người thực hiện | Ghi chú |", "|---|---|---|---|---|", line);
  else lines.splice(last + 1, 0, line);
  sections[idx] = { ...s, content: lines.join("\n") };
  return sections.map((x) => (x.heading ? `${x.heading}\n${x.content}` : x.content)).join("");
}

/** Chia lời thoại thành câu ngắn cho Teleprompter. */
export function splitForPrompter(text: string, maxWords = 16): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const words = s.split(" ");
    if (words.length <= maxWords) {
      out.push(s);
      continue;
    }
    let chunk: string[] = [];
    for (const w of words) {
      chunk.push(w);
      if ((/[,;:—–]$/.test(w) && chunk.length >= 6) || chunk.length >= maxWords) {
        out.push(chunk.join(" "));
        chunk = [];
      }
    }
    if (chunk.length) out.push(chunk.join(" "));
  }
  return out;
}
