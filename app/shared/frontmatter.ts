import type { Meta } from "./types";

/** Front matter dạng "key: value" phẳng — cùng định dạng mà tools/check_content.py đọc. */
export function parseFrontMatter(text: string): { meta: Meta; body: string; order: string[] } {
  const meta: Meta = {};
  const order: string[] = [];
  if (!text.startsWith("---")) return { meta, body: text, order };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { meta, body: text, order };
  const head = text.slice(3, end).split("\n");
  for (const line of head) {
    if (!line.includes(":") || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf(":");
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1);
    const hash = value.indexOf(" #");
    if (hash >= 0) value = value.slice(0, hash);
    meta[key] = value.trim().replace(/^"(.*)"$/, "$1");
    order.push(key);
  }
  const rest = text.slice(end + 4);
  const body = rest.startsWith("\n") ? rest.slice(1) : rest;
  return { meta, body, order };
}

const DEFAULT_ORDER = [
  "id", "title", "status", "format", "stage_5a", "pillar", "insight", "idea_ref", "claims",
  "brief_approved_by", "brief_approved_date", "record_approved_by", "record_approved_date",
  "publish_approved_by", "publish_approved_date", "published_url",
];

export function serializeFrontMatter(meta: Meta, body: string, order: string[] = []): string {
  const keys = [...new Set([...order, ...DEFAULT_ORDER, ...Object.keys(meta)])].filter((k) => k in meta);
  const lines = keys.map((k) => {
    const v = (meta[k] ?? "").replace(/\n/g, " ");
    return v === "" ? `${k}:` : `${k}: ${/[:#]/.test(v) && !/^CLM-/.test(v) ? JSON.stringify(v) : v}`;
  });
  return `---\n${lines.join("\n")}\n---\n${body}`;
}
