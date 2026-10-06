export type Severity = "FAIL" | "WARN";

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

export interface ComplianceResult {
  result: "PASS" | "WARN" | "FAIL";
  findings: Finding[];
}

export type GateVerdict =
  | "BLOCKED"
  | "REJECTED"
  | "NEEDS_REVISION"
  | "NEEDS_REVIEW"
  | "READY_FOR_APPROVAL";

export interface Criterion {
  id: string;
  label: string;
  points: number;
  earned: number;
  note?: string;
}

export interface QualityResult {
  kind: "insight" | "brief" | "script";
  score: number;
  verdict: GateVerdict;
  blockers: string[];
  criteria: Criterion[];
}

export interface Meta {
  [key: string]: string;
}

export interface ContentItem {
  id: string;
  file: string;
  meta: Meta;
  body: string;
}

export interface ScriptBlock {
  block: string;
  line: string;
  visual: string;
  claim: string;
}

export interface Evidence {
  ref: string;
  quote?: string;
  source: string;
}

export interface InsightHistory {
  at: string;
  by: string;
  action: string;
  reason?: string;
}

export type InsightStatus = "HYPOTHESIS" | "CONFIRMED" | "REJECTED" | "MISSING";

export interface Insight {
  id: string;
  text: string;
  status: InsightStatus;
  topic?: string;
  evidence: Evidence[];
  history: InsightHistory[];
  notes?: string;
}

export type SourceStatus = "NOT_CONNECTED" | "CONNECTED" | "ERROR" | "MANUAL" | "DEFERRED";

export interface DataSource {
  id: string;
  name: string;
  kind: "local" | "manual" | "api";
  path?: string;
  status: SourceStatus;
  note: string;
  checkedAt?: string;
}

export type CustomerDataType = "câu hỏi" | "nỗi đau" | "mong muốn" | "rào cản" | "niềm tin" | "phản đối" | "khác";

export interface CustomerRecord {
  id: string;
  quote: string;
  type: CustomerDataType;
  source: string;
  channel: string;
  date: string;
  anonymized: boolean;
  processed: boolean;
  notes?: string;
}

export interface ApprovalEntry {
  at: string;
  targetType: "insight" | "brief" | "script" | "publish" | "transition" | "learning";
  targetId: string;
  action: "APPROVE" | "REJECT" | "REVISE" | "MOVE";
  reviewer: string;
  reason?: string;
  score?: number;
  from?: string;
  to?: string;
}

export interface MetricEntry {
  itemId: string;
  date: string;
  views: number;
  avgWatchSeconds: number;
  comments: number;
  consultMessages: number;
  questionsCount: number;
  enteredBy: string;
}
