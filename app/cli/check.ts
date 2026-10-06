import path from "node:path";
import { Repo } from "../server/repo";
import { checkCompliance } from "../shared/compliance";
import { scoreBrief, scoreScript } from "../shared/quality";
import { parseFrontMatter } from "../shared/frontmatter";

/** npm run check -- content/items/<file>.md [...] — kiểm tra tuân thủ + Quality Gate (Tầng 0). */
const repo = new Repo(process.cwd());
const files = process.argv.slice(2);
if (!files.length) {
  console.log("Cách dùng: npm run check -- content/items/<file>.md");
  process.exit(0);
}
let failed = false;
const registry = repo.claims();
const ids = repo.insights().map((i) => i.id);
for (const f of files) {
  const { meta, body } = parseFrontMatter(repo.read(path.relative(repo.root, path.resolve(f))));
  const c = checkCompliance(meta, body, registry);
  const b = scoreBrief(meta, body, registry, ids);
  const s = scoreScript(meta, body, registry, ids);
  console.log(`\n[${c.result}] ${f}`);
  for (const x of c.findings) console.log(`  ${x.severity === "FAIL" ? "✗" : "!"} ${x.message}`);
  console.log(`  Brief: ${b.score}/100 ${b.verdict} · Kịch bản: ${s.score}/100 ${s.verdict}`);
  for (const bl of s.blockers) console.log(`  ⛔ ${bl}`);
  if (c.result === "FAIL") failed = true;
}
process.exit(failed ? 1 : 0);
