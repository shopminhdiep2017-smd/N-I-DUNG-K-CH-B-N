import type { Go } from "../App";
import { Badge, Card, Empty, ErrorBox, useApi } from "../components/ui";

export function Overview({ go }: { go: Go }) {
  const { data, error } = useApi("overview");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const pipeline = ["IDEA", "CONTENT_BRIEF", "SCRIPT_DRAFT", "NEEDS_SOURCE", "NEEDS_REVIEW", "APPROVED_TO_RECORD", "RECORDED", "EDITING", "FINAL_REVIEW", "APPROVED_TO_PUBLISH", "PUBLISHED", "MEASURED", "LEARNING_CAPTURED"];
  const totalItems = pipeline.reduce((a, s) => a + (data.counts[s] ?? 0), 0);
  return (
    <div className="stack">
      <div className="stats">
        <button className="stat" onClick={() => go("approvals")}><span>Chờ con người duyệt</span><b>{data.queueCount}</b></button>
        <button className="stat" onClick={() => go("insights")}><span>Insight giả thuyết</span><b>{data.insightsPending}</b></button>
        <button className="stat" onClick={() => go("kanban")}><span>Kịch bản chờ duyệt</span><b>{data.scriptsPending}</b></button>
        <button className="stat" onClick={() => go("prompter")}><span>Video sẵn sàng quay</span><b>{data.readyToRecord.length}</b></button>
        <button className="stat" onClick={() => go("sources")}><span>Nguồn đã kết nối</span><b>{data.sources.connected}/{data.sources.total}</b></button>
      </div>

      <div className="grid-2">
        <Card title="Việc hôm nay">
          <ol className="tasks">
            {data.tasks.map((t: string) => <li key={t}>{t}</li>)}
          </ol>
        </Card>
        <Card title="Cảnh báo tuân thủ & claim">
          <ul className="alerts">
            {data.alerts.map((a: any) => (
              <li key={a.text} className={`al-${a.level}`}>{a.level === "error" ? "⛔" : a.level === "warn" ? "⚠" : "ℹ"} {a.text}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Tiến độ hệ thống">
        <div className="parts">
          {data.parts.map((p: any) => (
            <div key={p.id} className="part">
              <b>{p.id}</b>
              <span>{p.title}</span>
              <Badge value={p.unlocked ? "CONNECTED" : "NOT_CONNECTED"} label={p.label || p.status} tone={p.unlocked ? (/(limited|conflict|constraint)/.test(p.status) ? "warn" : "ok") : "muted"} />
            </div>
          ))}
        </div>
      </Card>

      <Card title={`Dòng sản xuất nội dung (${totalItems} nội dung)`}>
        {totalItems === 0 ? (
          <Empty>Chưa có nội dung. Vào <a onClick={() => go("studio")}>Script Studio</a> để tạo Content Brief đầu tiên.</Empty>
        ) : (
          <div className="pipeline">
            {pipeline.map((s) => (
              <div key={s} className={`pipe ${data.counts[s] ? "has" : ""}`}>
                <b>{data.counts[s] ?? 0}</b>
                <small>{s}</small>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Trạng thái nguồn dữ liệu">
        <p>
          Đã kết nối <b>{data.sources.connected}</b> · Nhập thủ công <b>{data.sources.manual}</b> · Hoãn (Deferred) <b>{data.sources.deferred}</b> · Chưa kết nối <b>{data.sources.notConnected}</b> · Lỗi <b>{data.sources.error}</b>
        </p>
      </Card>
    </div>
  );
}
