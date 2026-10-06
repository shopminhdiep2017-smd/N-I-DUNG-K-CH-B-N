import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { parseFrontMatter, serializeFrontMatter } from "../shared/frontmatter";
import { parseClaimRegistry, type ClaimInfo } from "../shared/compliance";
import type { ApprovalEntry, ContentItem, CustomerRecord, DataSource, Insight, Meta, MetricEntry } from "../shared/types";
import type { RouterConfig } from "../shared/router";

/** Mọi đọc/ghi đi qua lớp này; không cho phép ra ngoài thư mục repo. */
export class Repo {
  constructor(public readonly root: string) {}

  abs(rel: string): string {
    const p = path.resolve(this.root, rel);
    if (p !== this.root && !p.startsWith(this.root + path.sep)) throw new Error(`Đường dẫn ngoài repo: ${rel}`);
    return p;
  }

  exists(rel: string): boolean {
    return fs.existsSync(this.abs(rel));
  }

  read(rel: string): string {
    return fs.readFileSync(this.abs(rel), "utf8");
  }

  readOr(rel: string, fallback = ""): string {
    return this.exists(rel) ? this.read(rel) : fallback;
  }

  write(rel: string, content: string): void {
    const p = this.abs(rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, content, "utf8");
    fs.renameSync(tmp, p);
  }

  readJson<T>(rel: string, fallback: T): T {
    if (!this.exists(rel)) return fallback;
    try {
      return JSON.parse(this.read(rel)) as T;
    } catch {
      return fallback;
    }
  }

  writeJson(rel: string, data: unknown): void {
    this.write(rel, JSON.stringify(data, null, 2) + "\n");
  }

  list(relDir: string, ext = ".md"): string[] {
    const d = this.abs(relDir);
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d).filter((f) => f.endsWith(ext)).sort().map((f) => path.posix.join(relDir, f));
  }

  // ---- Dữ liệu chuyên biệt ----
  claims(): Record<string, ClaimInfo> {
    return parseClaimRegistry(this.readOr("compliance/claim-registry.md"));
  }

  status(): Record<string, unknown> {
    return YAML.parse(this.readOr("system-status.yaml", "{}")) ?? {};
  }

  router(): RouterConfig {
    return this.readJson<RouterConfig>("config/model-router.json", { tiers: {}, tasks: {}, humanOnlyTasks: [] });
  }

  items(): ContentItem[] {
    return this.list("content/items").map((file) => this.item(file));
  }

  item(file: string): ContentItem {
    const { meta, body } = parseFrontMatter(this.read(file));
    return { id: meta.id || path.basename(file, ".md"), file, meta, body };
  }

  findItem(id: string): ContentItem | undefined {
    return this.items().find((i) => i.id === id);
  }

  saveItem(file: string, meta: Meta, body: string): void {
    const existing = this.exists(file) ? parseFrontMatter(this.read(file)).order : [];
    this.write(file, serializeFrontMatter(meta, body, existing));
  }

  insights(): Insight[] {
    return this.readJson<Insight[]>("data/insights.json", []);
  }
  saveInsights(list: Insight[]): void {
    this.writeJson("data/insights.json", list);
  }

  sources(): DataSource[] {
    return this.readJson<DataSource[]>("data/data-sources.json", []);
  }
  saveSources(list: DataSource[]): void {
    this.writeJson("data/data-sources.json", list);
  }

  approvals(): ApprovalEntry[] {
    return this.readJson<ApprovalEntry[]>("data/approvals.json", []);
  }
  logApproval(entry: ApprovalEntry): void {
    this.writeJson("data/approvals.json", [...this.approvals(), entry]);
  }

  metrics(): MetricEntry[] {
    return this.readJson<MetricEntry[]>("data/analytics.json", []);
  }
  saveMetrics(list: MetricEntry[]): void {
    this.writeJson("data/analytics.json", list);
  }

  /** Dữ liệu khách hàng thật: chỉ trong private/ (ngoài git). */
  customerData(): CustomerRecord[] {
    return this.readJson<CustomerRecord[]>("private/customer-data.json", []);
  }
  saveCustomerData(list: CustomerRecord[]): void {
    this.writeJson("private/customer-data.json", list);
  }
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
