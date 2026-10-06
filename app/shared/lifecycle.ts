import { RULES } from "./rules";

export const STATUSES = RULES.statuses;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  IDEA: "Ý tưởng",
  CONTENT_BRIEF: "Content Brief",
  SCRIPT_DRAFT: "Bản thảo kịch bản",
  NEEDS_SOURCE: "Cần nguồn / claim",
  NEEDS_REVIEW: "Chờ người duyệt",
  APPROVED_TO_RECORD: "Được phép quay",
  RECORDED: "Đã quay",
  EDITING: "Đang dựng",
  FINAL_REVIEW: "Duyệt bản dựng",
  APPROVED_TO_PUBLISH: "Được phép đăng",
  PUBLISHED: "Đã đăng",
  MEASURED: "Đã đo",
  LEARNING_CAPTURED: "Đã rút bài học",
};

/** Trạng thái chỉ vào được qua Hàng chờ phê duyệt (con người ký tên). */
export const APPROVAL_ONLY = new Set(["SCRIPT_DRAFT", "APPROVED_TO_RECORD", "APPROVED_TO_PUBLISH"]);

export function normalizeStatus(raw: string | undefined): string {
  const s = (raw ?? "").trim().toUpperCase();
  return RULES.aliases[s] ?? s;
}

export function statusIndex(status: string): number {
  return STATUSES.indexOf(normalizeStatus(status));
}

export function isValidStatus(status: string): boolean {
  return statusIndex(status) >= 0;
}

export function nextStatus(status: string): string | null {
  const i = statusIndex(status);
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}

/** Tên người duyệt hợp lệ: không trống, không phải AI/Agent/bot. */
export function isHumanName(name: string | undefined): boolean {
  if (!name || !name.trim()) return false;
  const tokens = name.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return !tokens.some((t) => RULES.nonHuman.includes(t));
}
