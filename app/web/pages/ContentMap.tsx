import { useMemo, useState } from "react";
import type { Go } from "../App";
import { Badge, Card, Empty, ErrorBox, ScoreBadge, useApi } from "../components/ui";

export function ContentMap({ go }: { go: Go }) {
  const { data, error } = useApi("content-map");
  const [f, setF] = useState({ pillar: "", insight: "", stage: "", status: "" });
  const items = useMemo(() => (data?.items ?? []).filter((i: any) =>
    (!f.pillar || i.meta.pillar === f.pillar) && (!f.insight || i.meta.insight === f.insight) &&
    (!f.stage || i.meta.stage_5a === f.stage) && (!f.status || i.meta.status === f.status)), [data, f]);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const sel = (key: keyof typeof f, label: string, options: { id: string; label: string }[]) => (
    <label className="field"><span>{label}</span>
      <select value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        <option value="">Tất cả</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select></label>
  );
  return (
    <div className="stack">
      <Card title="Bộ lọc">
        <div className="filters">
          <label className="field"><span>Phân khúc</span><select disabled><option>{data.segment}</option></select></label>
          {sel("pillar", "Trụ cột", data.pillars.map((p: any) => ({ id: p.id, label: `${p.id} · ${p.name}` })))}
          {sel("insight", "Insight", data.insights.filter((i: any) => i.status !== "MISSING").map((i: any) => ({ id: i.id, label: `${i.id} (${i.status})` })))}
          {sel("stage", "Hành trình 5A", data.stages.map((s: string) => ({ id: s, label: s })))}
          {sel("status", "Trạng thái", data.statuses.map((s: any) => ({ id: s.id, label: `${s.id} · ${s.label}` })))}
        </div>
      </Card>

      <Card title={`Nội dung (${items.length})`}>
        {items.length === 0 ? <Empty>Không có nội dung khớp bộ lọc.</Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Mã</th><th>Tên</th><th>5A</th><th>Trụ cột</th><th>Insight</th><th>Trạng thái</th><th>Kịch bản</th><th></th></tr></thead>
            <tbody>
              {items.map((i: any) => (
                <tr key={i.id}>
                  <td>{i.id}</td><td>{i.meta.title}{i.hasProduct && <Badge value="WARN" label="có sản phẩm" />}</td>
                  <td>{i.meta.stage_5a}</td><td>{i.meta.pillar}</td><td>{i.meta.insight}</td>
                  <td><Badge value={i.meta.status} /></td><td><ScoreBadge q={i.scriptScore} /></td>
                  <td><button className="btn btn-small" onClick={() => go("studio", i.id)}>Mở</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>

      <Card title="Ma trận Giai đoạn 5A × Trụ cột">
        <div className="table-wrap"><table className="table matrix">
          <thead><tr><th></th>{data.stages.map((s: string) => <th key={s}>{s}</th>)}</tr></thead>
          <tbody>
            {data.pillars.map((p: any) => (
              <tr key={p.id}><th title={p.name}>{p.id}</th>
                {data.stages.map((s: string) => {
                  const n = data.items.filter((i: any) => i.meta.pillar === p.id && i.meta.stage_5a === s).length;
                  return <td key={s} className={n ? "has" : ""}>{n || ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>

      <Card title="Ngân hàng ý tưởng (30 ô — PART-03)">
        <p className="muted small">Nội dung ý tưởng: CHƯA CÓ NGUỒN — chủ thương hiệu chưa bàn giao. Hệ thống không tự viết ý tưởng.</p>
        <div className="idea-grid">
          {data.ideas.map((i: any) => <div key={i.id} className="idea" title={i.group}><b>{i.id}</b><small>{i.status || "CHƯA CÓ NGUỒN"}</small></div>)}
        </div>
      </Card>
    </div>
  );
}
