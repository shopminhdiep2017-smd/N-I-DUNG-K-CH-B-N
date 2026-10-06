import { describe, expect, it } from "vitest";
import { parseClaimRegistry } from "../shared/compliance";
import { parseFrontMatter } from "../shared/frontmatter";
import { insightConfidence, scoreInsight, scoreScript, verdictFor } from "../shared/quality";
import type { Insight } from "../shared/types";
import { fixture } from "./helpers";

const registry = parseClaimRegistry(fixture("compliance/claim-registry.md"));
const IDS = ["INS-01"];
const script = (rel: string) => {
  const { meta, body } = parseFrontMatter(fixture(rel));
  return scoreScript(meta, body, registry, IDS);
};

describe("T05 Ngưỡng Quality Gate 100 điểm", () => {
  it("< 80 bắt sửa, 80–89 cần xem kỹ, ≥ 90 đủ điều kiện vào hàng chờ", () => {
    expect(verdictFor(79, [])).toBe("NEEDS_REVISION");
    expect(verdictFor(80, [])).toBe("NEEDS_REVIEW");
    expect(verdictFor(89, [])).toBe("NEEDS_REVIEW");
    expect(verdictFor(90, [])).toBe("READY_FOR_APPROVAL");
  });
  it("blocker thắng điểm số", () => {
    expect(verdictFor(100, [{ kind: "BLOCKED" }])).toBe("BLOCKED");
    expect(verdictFor(100, [{ kind: "REJECTED" }, { kind: "BLOCKED" }])).toBe("REJECTED");
  });
});

describe("T06 Chấm kịch bản thật từ PART-04", () => {
  it("TC4 video giá trị: không bị chặn", () => {
    const q = script("sessions/PART-04/test-results/tc04-value-script.md");
    expect(q.blockers).toEqual([]);
    expect(q.score).toBeGreaterThanOrEqual(80);
  });
  it("TC5 video bán hàng có claim UNVERIFIED: BLOCKED (tuyên bố thiếu nguồn)", () => {
    const q = script("sessions/PART-04/test-results/tc05-sales-script.md");
    expect(q.verdict).toBe("BLOCKED");
    expect(q.blockers.join(" ")).toMatch(/thiếu nguồn/);
  });
  it("TC6 số liệu bịa: REJECTED", () => {
    expect(script("tests/fixtures/tc06-missing-source.md").verdict).toBe("REJECTED");
  });
  it("sai định vị (tử vi) bị chặn", () => {
    const body = "# 2. Kịch bản\n| Khối | Lời thoại |\n|---|---|\n| Hook | Xem tử vi tuổi Dần năm nay để biết sức khỏe |\n";
    const q = scoreScript({ status: "SCRIPT_DRAFT", format: "video-gia-tri", stage_5a: "Aware", pillar: "P1", insight: "INS-01" }, body, registry, IDS);
    expect(q.verdict).toBe("BLOCKED");
    expect(q.blockers.join(" ")).toMatch(/Sai định vị/);
  });
});

describe("T07 Chấm insight", () => {
  const base: Insight = { id: "X", text: "", status: "HYPOTHESIS", evidence: [], history: [{ at: "2026-10-06", by: "A", action: "x" }] };
  it("INS-01 chưa có nguồn thật → chưa đủ điều kiện xác nhận, độ tin cậy 0", () => {
    const ins = JSON.parse(fixture("data/insights.json")).find((i: Insight) => i.id === "INS-01");
    const q = scoreInsight(ins, registry);
    expect(q.score).toBeLessThan(80);
    expect(insightConfidence(ins)).toBe(0);
  });
  it("insight có 3 bằng chứng nguồn thật → ≥ 90", () => {
    const ins = { ...base, text: "Tôi muốn hết tê bì chân tay, nhưng tôi sợ mua hàng giả, bởi vì không có dược sĩ đồng hành.", evidence: [1, 2, 3].map((n) => ({ ref: `CD-${n}`, source: "Bình luận video 2026-10-01" })) };
    expect(scoreInsight(ins, registry).score).toBeGreaterThanOrEqual(90);
    expect(insightConfidence(ins)).toBe(75);
  });
  it("insight chưa có nội dung → BLOCKED", () => {
    expect(scoreInsight({ ...base, status: "MISSING" }, registry).verdict).toBe("BLOCKED");
  });
});
