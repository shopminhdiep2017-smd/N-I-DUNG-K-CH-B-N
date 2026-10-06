import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Repo } from "../server/repo";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const COPY = ["config", "compliance", "data", "content", "strategy", "brand", "products", "research", "decision-log.md", "system-status.yaml", "tests/fixtures", "sessions/PART-04/test-results"];

/** Bản sao tạm của repo để test ghi dữ liệu mà không đụng repo thật. */
export function tempRepo(): Repo {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aios-test-"));
  for (const rel of COPY) {
    const src = path.join(ROOT, rel);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, rel), { recursive: true });
  }
  return new Repo(dir);
}

export const fixture = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
