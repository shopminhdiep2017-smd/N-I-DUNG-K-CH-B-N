import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STATUSES, isHumanName, normalizeStatus } from "../shared/lifecycle";
import { checkCompliance, parseClaimRegistry } from "../shared/compliance";
import { parseFrontMatter } from "../shared/frontmatter";
import { ROOT, fixture } from "./helpers";

const registry = parseClaimRegistry(fixture("compliance/claim-registry.md"));
const run = (rel: string) => {
  const { meta, body } = parseFrontMatter(fixture(rel));
  return checkCompliance(meta, body, registry);
};
const codes = (rel: string) => run(rel).findings.filter((f) => f.severity === "FAIL").map((f) => f.code);

describe("T01 Vòng đời 13 trạng thái", () => {
  it("đúng thứ tự PART-05 và chuyển đổi tên cũ", () => {
    expect(STATUSES).toEqual(["IDEA", "CONTENT_BRIEF", "SCRIPT_DRAFT", "NEEDS_SOURCE", "NEEDS_REVIEW", "APPROVED_TO_RECORD", "RECORDED", "EDITING", "FINAL_REVIEW", "APPROVED_TO_PUBLISH", "PUBLISHED", "MEASURED", "LEARNING_CAPTURED"]);
    expect(normalizeStatus("DRAFT")).toBe("SCRIPT_DRAFT");
    expect(normalizeStatus("EDITED")).toBe("EDITING");
  });
  it("tên người duyệt không được là AI/Agent", () => {
    expect(isHumanName("Dược sĩ Lê Hương")).toBe(true);
    for (const n of ["Claude", "Agent 03", "AI", "", "  ", "gpt bot"]) expect(isHumanName(n)).toBe(false);
  });
});

describe("T02 Claim Registry", () => {
  it("26 claim, 0 APPROVED", () => {
    expect(Object.keys(registry)).toHaveLength(26);
    expect(Object.values(registry).filter((c) => c.approved)).toHaveLength(0);
  });
});

describe("T03 Kiểm tra tuân thủ trên dữ liệu test PART-04", () => {
  it("TC4 kịch bản giá trị không FAIL", () => expect(run("sessions/PART-04/test-results/tc04-value-script.md").result).not.toBe("FAIL"));
  it("TC5 kịch bản bán hàng UNVERIFIED có nhãn, không FAIL", () => expect(run("sessions/PART-04/test-results/tc05-sales-script.md").result).not.toBe("FAIL"));
  it("TC5b đẩy sản phẩm UNVERIFIED sang APPROVED_TO_RECORD bị chặn", () => expect(codes("tests/fixtures/tc05b-sales-forced-record.md")).toContain("UNAPPROVED_CLAIM_ADVANCED"));
  it("TC6 claim thiếu nguồn và số liệu bịa bị chặn", () => {
    const c = codes("tests/fixtures/tc06-missing-source.md");
    expect(c).toContain("PRODUCT_NO_CLAIM");
    expect(c).toContain("FABRICATION");
  });
  it("TC7 AI tự ký đăng / thiếu chữ ký bị chặn", () => {
    expect(codes("tests/fixtures/tc07-publish-by-agent.md")).toContain("SIGNATURE");
    expect(codes("tests/fixtures/tc07b-publish-unsigned.md")).toContain("SIGNATURE");
  });
});

describe("T04 Python và TypeScript cho cùng kết quả", () => {
  const files = [
    "sessions/PART-04/test-results/tc04-value-script.md", "sessions/PART-04/test-results/tc05-sales-script.md",
    "tests/fixtures/tc05b-sales-forced-record.md", "tests/fixtures/tc06-missing-source.md",
    "tests/fixtures/tc07-publish-by-agent.md", "tests/fixtures/tc07b-publish-unsigned.md",
  ];
  it.each(files)("%s", (rel) => {
    let out = "";
    try {
      out = execFileSync("python3", [path.join(ROOT, "tools/check_content.py"), path.join(ROOT, rel)], { encoding: "utf8" });
    } catch (e) {
      out = (e as { stdout: string }).stdout;
    }
    const py = out.match(/\[(PASS|WARN|FAIL)\]/)?.[1];
    expect(py).toBe(run(rel).result);
  });
});
