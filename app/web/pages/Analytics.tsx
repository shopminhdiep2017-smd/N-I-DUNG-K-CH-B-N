import { useState } from "react";
import type { Go } from "../App";
import { api } from "../api";
import { Badge, Card, CopyBox, Empty, ErrorBox, Notice, useApi, useReviewerName } from "../components/ui";

export function Analytics({ go }: { go: Go }) {
  const { data, error, reload } = useApi("analytics");
  const router = useApi("router");
  const [name, setName] = useReviewerName();
  const [form, setForm] = useState<any>({ itemId: "", views: "", avgWatchSeconds: "", comments: "", consultMessages: "", questions: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const save = async () => {
    try {
      await api("analytics", { method: "POST", body: { ...form, questions: String(form.questions).split("\n"), enteredBy: name } });
      setOk("Đã lưu chỉ số. Câu hỏi khách hàng đã vào Thư viện dữ liệu khách hàng (private/).");
      setErr(null);
      setForm({ itemId: "", views: "", avgWatchSeconds: "", comments: "", consultMessages: "", questions: "" });
      reload();
    } catch (e) {
      setErr((e as Error).message);
      setOk(null);
    }
  };
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const s = data.summary;
  return (
    <div className="stack">
      <Notice>{data.note}</Notice>
      <div className="stats">
        <div className="stat"><span>Video đã đăng (không sản phẩm)</span><b>{s.videos}</b></div>
        <div className="stat"><span>Lượt xem</span><b>{s.views.toLocaleString("vi-VN")}</b></div>
        <div className="stat"><span>Thời gian xem TB (giây)</span><b>{s.avgWatchSeconds}</b></div>
        <div className="stat"><span>Bình luận</span><b>{s.comments}</b></div>
        <div className="stat"><span>Tin nhắn tư vấn</span><b>{s.consultMessages}</b></div>
        <div className="stat"><span>Câu hỏi khách hàng</span><b>{s.questions}</b></div>
      </div>

      <Card title="Video đã đăng">
        {data.rows.length === 0 ? <Empty>Chưa có video giáo dục nào ở trạng thái PUBLISHED.</Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Mã</th><th>Tên</th><th>Trạng thái</th><th>Lượt xem</th><th>Xem TB</th><th>Bình luận</th><th>Tin nhắn</th><th>Lần nhập</th></tr></thead>
            <tbody>{data.rows.map((r: any) => (
              <tr key={r.id}><td><button className="link" onClick={() => go("studio", r.id)}>{r.id}</button></td><td>{r.title}</td><td><Badge value={r.status} /></td>
                <td className="num">{r.latest?.views ?? "—"}</td><td className="num">{r.latest?.avgWatchSeconds ?? "—"}</td><td className="num">{r.latest?.comments ?? "—"}</td><td className="num">{r.latest?.consultMessages ?? "—"}</td><td className="num">{r.entries}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>

      <div className="grid-2">
        <Card title="Nhập chỉ số">
          <div className="form">
            <label className="field"><span>Video</span>
              <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                <option value="">— chọn —</option>{data.rows.map((r: any) => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}</select></label>
            <div className="row wrap">
              {[["views", "Lượt xem"], ["avgWatchSeconds", "Thời gian xem TB (giây)"], ["comments", "Bình luận"], ["consultMessages", "Tin nhắn tư vấn"]].map(([k, l]) => (
                <label key={k} className="field"><span>{l}</span><input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
              ))}
            </div>
            <label className="field"><span>Câu hỏi khách hàng (mỗi dòng một câu, đã ẩn danh)</span><textarea rows={4} value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} /></label>
            <label className="field"><span>Người nhập</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <ErrorBox error={err} />
            {ok && <Notice tone="ok">{ok}</Notice>}
            <button className="btn btn-primary" disabled={!form.itemId} onClick={save}>Lưu chỉ số</button>
          </div>
        </Card>
        <Card title="Vòng phản hồi → Agent 01">
          <ol className="tasks">
            <li>Nhập chỉ số và câu hỏi khách hàng ở bên trái.</li>
            <li>Câu hỏi tự vào <button className="link" onClick={() => go("customers")}>Thư viện dữ liệu khách hàng</button> ({data.pendingFeedback} câu chưa phân tích).</li>
            <li>Bấm “Tạo yêu cầu nghiên cứu” ở thư viện → dán lệnh vào Claude Code (Agent 01).</li>
            <li>Duyệt insight mới trong Hàng chờ phê duyệt → tạo brief mới.</li>
            <li>Trên Kanban: video đã đo → ghi bài học → LEARNING_CAPTURED.</li>
          </ol>
          <p className="small muted">Prompt rút bài học (Manual Claude Task):</p>
          <CopyBox text={data.manualPromptLearning} />
        </Card>
      </div>

      <Card title="Model Router & Manual Claude Task">
        {router.data && (
          <div className="stack-sm">
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Tầng</th><th>Tên</th><th>Bật</th><th>Tên model (biến môi trường)</th><th>Dùng được</th></tr></thead>
              <tbody>{router.data.tiers.map((t: any) => (
                <tr key={t.tier}><td>{t.tier}</td><td>{t.name}</td><td>{t.enabled ? "✓" : "—"}</td><td>{t.modelEnv ? `${t.modelEnv}: ${t.modelSet ? "đã đặt" : "chưa đặt"}` : "—"}{t.keySet !== undefined ? ` · API key: ${t.keySet ? "đã đặt" : "chưa đặt"}` : ""}</td><td><Badge value={t.usable ? "CONNECTED" : "NOT_CONNECTED"} label={t.usable ? "Có" : "Không"} /></td></tr>
              ))}</tbody>
            </table></div>
            <p className="small muted">{router.data.howToEnable}</p>
            <details><summary>Việc nào đi tầng nào</summary>
              <ul className="small">{[...router.data.routes, ...router.data.humanOnly].map((r: any) => <li key={r.task}><code>{r.task}</code>: {r.tier === null ? "CHỈ CON NGƯỜI" : `tầng ${r.tier}`} — {r.reason}</li>)}</ul>
            </details>
            <details><summary>Prompt chuẩn (Manual Claude Task)</summary>
              {router.data.manualTasks.map((t: any) => <div key={t.id} className="stack-sm"><b>{t.title}</b><small className="muted">{t.when}</small><CopyBox text={t.prompt} /></div>)}
            </details>
          </div>
        )}
      </Card>
    </div>
  );
}
