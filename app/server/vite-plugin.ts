import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { Repo } from "./repo";
import * as api from "./api";

/** Đọc .env.local (nếu có) vào biến môi trường của tiến trình — không bao giờ gửi giá trị ra giao diện. */
function loadEnvLocal(root: string): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  const file = path.join(root, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  return env;
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 2_000_000) throw new api.HttpError(413, "Dữ liệu quá lớn");
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new api.HttpError(400, "JSON không hợp lệ");
  }
}

export async function handle(repo: Repo, env: Record<string, string | undefined>, method: string, url: string, body: Record<string, unknown>) {
  const u = new URL(url, "http://local");
  const p = u.pathname.replace(/\/+$/, "");
  const seg = p.split("/").slice(2); // sau /api
  const B = body as never;
  if (method === "GET") {
    if (p === "/api/overview") return api.getOverview(repo, env);
    if (p === "/api/meta") return api.getMeta();
    if (p === "/api/brand") return api.getBrand(repo);
    if (p === "/api/sources") return repo.sources();
    if (p === "/api/customer-data") return api.getCustomerData(repo);
    if (p === "/api/insights") return api.getInsights(repo);
    if (p === "/api/items") return api.listItems(repo);
    if (seg[0] === "items" && seg[1]) return api.getItem(repo, decodeURIComponent(seg[1]));
    if (p === "/api/approvals") return api.getApprovals(repo);
    if (p === "/api/content-map") return api.getContentMap(repo);
    if (p === "/api/analytics") return api.getAnalytics(repo);
    if (p === "/api/router") return api.getRouter(repo, env);
  }
  if (method === "POST") {
    if (p === "/api/sources/check") return api.checkSources(repo, env);
    if (p === "/api/customer-data") return api.addCustomerRecord(repo, B);
    if (p === "/api/customer-data/research-request") return api.createResearchRequest(repo, String(body.requester ?? ""));
    if (p === "/api/insights") return api.addInsight(repo, B);
    if (p === "/api/items") return api.createItem(repo, B);
    if (p === "/api/evaluate") return api.evaluateDraft(repo, B);
    if (seg[0] === "items" && seg[2] === "move") return api.moveItem(repo, decodeURIComponent(seg[1]), B);
    if (p === "/api/approvals/decide") return api.decide(repo, B);
    if (p === "/api/analytics") return api.addMetrics(repo, B);
    if (p === "/api/ai/run") {
      const { callModel } = await import("./llm");
      return api.runAiTask(repo, env, B, callModel);
    }
  }
  if (method === "PUT") {
    if (seg[0] === "sources" && seg[1]) return api.updateSource(repo, decodeURIComponent(seg[1]), B);
    if (seg[0] === "items" && seg[1]) return api.saveDraft(repo, decodeURIComponent(seg[1]), B);
  }
  throw new api.HttpError(404, `Không có API ${method} ${p}`);
}

export function apiPlugin(): Plugin {
  return {
    name: "personal-brand-ai-os-api",
    configureServer(server) {
      const root = path.resolve(server.config.root, "../..");
      const repo = new Repo(root);
      const env = loadEnvLocal(root);
      try {
        api.checkSources(repo, env);
      } catch (e) {
        console.error("Không kiểm tra được nguồn dữ liệu:", e);
      }
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith("/api/")) return next();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        try {
          const body = req.method === "GET" ? {} : await readBody(req);
          const data = await handle(repo, env, req.method ?? "GET", req.url, body);
          res.end(JSON.stringify(data));
        } catch (e) {
          const status = e instanceof api.HttpError ? e.status : 500;
          if (status === 500) console.error(e);
          res.statusCode = status;
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
        }
      });
    },
  };
}
