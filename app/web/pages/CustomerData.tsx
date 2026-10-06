import { useState } from "react";
import { api } from "../api";
import { Badge, Card, CopyBox, Empty, ErrorBox, Notice, useApi, useReviewerName } from "../components/ui";

const TYPES = ["câu hỏi", "nỗi đau", "mong muốn", "rào cản", "niềm tin", "phản đối", "khác"];

export function CustomerData() {
  const { data, error, reload } = useApi("customer-data");
  const [name, setName] = useReviewerName();
  const [form, setForm] = useState({ quote: "", type: "câu hỏi", source: "", channel: "", date: new Date().toISOString().slice(0, 10), anonymized: false, notes: "" });
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const save = async () => {
    try {
      await api("customer-data", { method: "POST", body: form });
      setForm({ ...form, quote: "", notes: "", anonymized: false });
      setErr(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const sendToAgent = async () => {
    try {
      setResult(await api("customer-data/research-request", { method: "POST", body: { requester: name } }));
      setErr(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const records = data.records.filter((r: any) => !filter || r.type === filter);
  return (
    <div className="stack">
      <Notice tone="warn">🔐 Dữ liệu khách hàng lưu trong <code>{data.privateFile}</code> — <b>không đưa lên git</b>. Chỉ lưu câu nói đã ẩn danh (bỏ tên, số điện thoại, địa chỉ, ảnh). Hệ thống tự chặn khi phát hiện số điện thoại, email, địa chỉ.</Notice>
      <div className="grid-2">
        <Card title="Thêm câu nói nguyên văn">
          <div className="form">
            <label className="field"><span>Nguyên văn (giữ đúng lời khách)</span>
              <textarea rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></label>
            <div className="row wrap">
              <label className="field"><span>Loại</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="field"><span>Ngày</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            </div>
            <label className="field"><span>Nguồn (ví dụ: bình luận video, ghi chú tư vấn)</span><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></label>
            <label className="field"><span>Kênh</span><input value={form.channel} placeholder="NOT_DECIDED" onChange={(e) => setForm({ ...form, channel: e.target.value })} /></label>
            <label className="field"><span>Ghi chú</span><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <label className="check"><input type="checkbox" checked={form.anonymized} onChange={(e) => setForm({ ...form, anonymized: e.target.checked })} /> Tôi xác nhận câu nói đã được ẩn danh</label>
            <ErrorBox error={err} />
            <button className="btn btn-primary" onClick={save} disabled={!form.quote.trim()}>Lưu vào thư viện</button>
          </div>
        </Card>
        <Card title="Gửi dữ liệu mới cho Agent 01">
          <p>{data.records.filter((r: any) => !r.processed).length} câu nói chưa được phân tích.</p>
          <label className="field"><span>Tên người yêu cầu</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <button className="btn" onClick={sendToAgent}>Tạo yêu cầu nghiên cứu</button>
          {result && (
            <div className="stack-sm">
              <Notice tone="ok">Đã tạo <code>{result.file}</code> ({result.count} câu). Dán lệnh dưới đây vào Claude Code:</Notice>
              <CopyBox text={result.prompt} />
            </div>
          )}
        </Card>
      </div>

      <Card title="Câu nói nguyên bản trong repo (PART-02)">
        <table className="table">
          <thead><tr><th>Mã</th><th>Nguyên văn</th><th>Chủ đề</th><th>Nguồn</th><th>Insight</th></tr></thead>
          <tbody>
            {data.repoVerbatims.map((v: any) => (
              <tr key={v.id}><td>{v.id}</td><td>“{v.quote.replace(/"/g, "")}”</td><td>{v.topic}</td><td><Badge value="MISSING" label={v.source} /></td><td>{v.insight}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={`Thư viện riêng (${data.records.length})`} actions={
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Tất cả loại</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>}>
        {records.length === 0 ? <Empty>Chưa có dữ liệu.</Empty> : (
          <table className="table">
            <thead><tr><th>Mã</th><th>Nguyên văn</th><th>Loại</th><th>Nguồn</th><th>Ẩn danh</th><th>Đã gửi Agent 01</th></tr></thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id}><td>{r.id}</td><td>“{r.quote}”</td><td>{r.type}</td><td>{r.source} · {r.channel} · {r.date}</td>
                  <td>{r.anonymized ? "✓" : "✗"}</td><td>{r.processed ? "✓" : "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
