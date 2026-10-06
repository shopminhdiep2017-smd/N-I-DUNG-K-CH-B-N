import { useState } from "react";
import { api } from "../api";
import { Badge, Card, ErrorBox, Notice, QualityDetail, ScoreBadge, useApi, useReviewerName } from "../components/ui";

export function Insights() {
  const { data, error, reload } = useApi<any[]>("insights");
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useReviewerName();
  const [form, setForm] = useState({ text: "", refs: "", source: "" });
  const [err, setErr] = useState<string | null>(null);
  const add = async () => {
    try {
      const evidence = form.refs.split(",").map((r) => r.trim()).filter(Boolean).map((ref) => ({ ref, source: form.source || "CHƯA CÓ NGUỒN" }));
      await api("insights", { method: "POST", body: { text: form.text, evidence, proposedBy: name } });
      setForm({ text: "", refs: "", source: "" });
      setErr(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  return (
    <div className="stack">
      <Notice>Insight mới luôn là <b>HYPOTHESIS</b>. Chỉ con người xác nhận thành <b>CONFIRMED</b> trong Hàng chờ phê duyệt (cần ≥ 80 điểm, không có lỗi chặn). Điểm tin cậy = số bằng chứng có nguồn thật × 25.</Notice>
      <div className="cards">
        {data.map((i) => (
          <Card key={i.id} title={<>{i.id} <Badge value={i.status} /></>} actions={<span className="muted small">Tin cậy {i.confidence}/100</span>}>
            {i.topic && <p className="muted small">{i.topic}</p>}
            <p className={i.text ? "" : "muted"}>{i.text || i.notes}</p>
            {i.evidence.length > 0 && <p className="small">Bằng chứng: {i.evidence.map((e: any) => `${e.ref} (${e.source})`).join(", ")}</p>}
            <ScoreBadge q={i.quality} />
            <button className="link" onClick={() => setOpen(open === i.id ? null : i.id)}>{open === i.id ? "Ẩn chi tiết" : "Xem điểm & lịch sử"}</button>
            {open === i.id && (
              <div className="stack-sm">
                <QualityDetail q={i.quality} />
                <h4>Lịch sử phê duyệt</h4>
                <ul className="history">{i.history.map((h: any, k: number) => <li key={k}>{h.at} · <b>{h.by}</b>: {h.action}{h.reason ? ` — ${h.reason}` : ""}</li>)}</ul>
                {i.notes && <p className="muted small">{i.notes}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>
      <Card title="Thêm insight đề xuất (HYPOTHESIS)">
        <div className="form">
          <label className="field"><span>Insight theo cấu trúc “Tôi muốn… nhưng… bởi vì…”</span><textarea rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
          <div className="row wrap">
            <label className="field"><span>Mã dữ liệu làm bằng chứng (V-01, CD-…)</span><input value={form.refs} onChange={(e) => setForm({ ...form, refs: e.target.value })} /></label>
            <label className="field"><span>Nguồn của bằng chứng</span><input value={form.source} placeholder="CHƯA CÓ NGUỒN" onChange={(e) => setForm({ ...form, source: e.target.value })} /></label>
          </div>
          <label className="field"><span>Người / Agent đề xuất</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <ErrorBox error={err} />
          <button className="btn btn-primary" onClick={add} disabled={!form.text.trim()}>Thêm giả thuyết</button>
        </div>
      </Card>
    </div>
  );
}
