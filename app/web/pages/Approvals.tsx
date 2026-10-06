import { useState } from "react";
import type { Go } from "../App";
import { api } from "../api";
import { Badge, Card, Empty, ErrorBox, Notice, ScoreBadge, useApi, useReviewerName } from "../components/ui";

const TYPE_LABEL: Record<string, string> = {
  insight: "Insight → CONFIRMED",
  brief: "Content Brief → SCRIPT_DRAFT",
  script: "Kịch bản → APPROVED_TO_RECORD",
  publish: "Bản dựng cuối → APPROVED_TO_PUBLISH",
};

export function Approvals({ go }: { go: Go }) {
  const { data, error, reload } = useApi("approvals");
  const [name, setName] = useReviewerName();
  const [reason, setReason] = useState<Record<string, string>>({});
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const decide = async (e: any, action: string) => {
    const key = `${e.targetType}:${e.targetId}`;
    try {
      await api("approvals/decide", { method: "POST", body: { targetType: e.targetType, targetId: e.targetId, action, reviewer: name, reason: reason[key], confirmWatched: watched[key] } });
      setOk(`${action === "APPROVE" ? "Đã phê duyệt" : action === "REJECT" ? "Đã từ chối" : "Đã yêu cầu sửa"}: ${e.targetId}`);
      setErr(null);
      reload();
    } catch (x) {
      setErr((x as Error).message);
      setOk(null);
    }
  };
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  return (
    <div className="stack">
      <Notice tone="warn">Đây là điểm <b>Human-in-the-loop</b>. Hệ thống không bao giờ tự phê duyệt. Tên người duyệt phải là người thật (không chấp nhận “AI”, “Claude”, “Agent”…). Đạt ≥ 90 điểm chỉ có nghĩa là đủ điều kiện được xem xét — <b>không</b> tự động xuất bản.</Notice>
      <Card title="Người duyệt">
        <label className="field"><span>Họ tên người duyệt</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Dược sĩ Lê Hương" /></label>
      </Card>
      <ErrorBox error={err} />
      {ok && <Notice tone="ok">{ok}</Notice>}

      <h2>Đủ điều kiện xem xét ({data.queue.length})</h2>
      {data.queue.length === 0 && <Empty>Không có mục nào chờ duyệt.</Empty>}
      <div className="cards">
        {data.queue.map((e: any) => {
          const key = `${e.targetType}:${e.targetId}`;
          return (
            <Card key={key} title={<>{e.targetId} <Badge value="MANUAL" label={TYPE_LABEL[e.targetType]} /></>}>
              <p>{e.title}</p>
              <ScoreBadge q={e} />
              {e.needsCarefulReview && <Notice tone="warn">Điểm 80–89 hoặc bước đăng: hãy đọc kỹ toàn bộ trước khi duyệt.</Notice>}
              {e.targetType !== "insight" && <button className="link" onClick={() => go("studio", e.targetId)}>Mở nội dung để đọc</button>}
              {e.targetType === "publish" && (
                <label className="check"><input type="checkbox" checked={!!watched[key]} onChange={(x) => setWatched({ ...watched, [key]: x.target.checked })} /> Tôi đã xem bản dựng cuối; chữ trên màn hình và caption khớp kịch bản đã duyệt</label>
              )}
              <label className="field"><span>Lý do / ghi chú (bắt buộc khi từ chối hoặc yêu cầu sửa)</span>
                <input value={reason[key] ?? ""} onChange={(x) => setReason({ ...reason, [key]: x.target.value })} /></label>
              <div className="row wrap">
                <button className="btn btn-primary" onClick={() => decide(e, "APPROVE")}>✔ Phê duyệt</button>
                <button className="btn" onClick={() => decide(e, "REVISE")}>✎ Yêu cầu sửa</button>
                <button className="btn btn-danger" onClick={() => decide(e, "REJECT")}>✕ Từ chối</button>
              </div>
            </Card>
          );
        })}
      </div>

      <h2>Chưa đủ điều kiện ({data.notEligible.length})</h2>
      <div className="cards">
        {data.notEligible.map((e: any) => (
          <Card key={`${e.targetType}:${e.targetId}`} title={<>{e.targetId} <Badge value="FAIL" label={TYPE_LABEL[e.targetType]} /></>}>
            <p className="small">{e.title}</p>
            <ScoreBadge q={e} />
            <ul className="blockers">{e.blockers.map((b: string) => <li key={b}>⛔ {b}</li>)}</ul>
            {e.targetType !== "insight" && <button className="link" onClick={() => go("studio", e.targetId)}>Mở để sửa</button>}
          </Card>
        ))}
      </div>

      <Card title="Nhật ký phê duyệt (50 gần nhất)">
        {data.log.length === 0 ? <Empty>Chưa có.</Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Thời gian</th><th>Loại</th><th>Mục</th><th>Hành động</th><th>Người</th><th>Ghi chú</th></tr></thead>
            <tbody>{data.log.map((l: any, i: number) => (
              <tr key={i}><td>{new Date(l.at).toLocaleString("vi-VN")}</td><td>{l.targetType}</td><td>{l.targetId}</td><td>{l.action}{l.to ? ` → ${l.to}` : ""}</td><td>{l.reviewer}</td><td>{l.reason ?? ""}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
