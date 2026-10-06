import { useState } from "react";
import { api } from "../api";
import { Badge, Card, ErrorBox, Notice, useApi } from "../components/ui";

const LABEL: Record<string, string> = {
  NOT_CONNECTED: "Chưa kết nối", CONNECTED: "Đã kết nối", ERROR: "Lỗi", MANUAL: "Nhập thủ công", DEFERRED: "Deferred Task",
};

export function Sources() {
  const { data, error, reload, setData } = useApi<any[]>("sources");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const check = async () => {
    try {
      setData(await api("sources/check", { method: "POST" }));
      setMsg("Đã kiểm tra lại các nguồn trên máy.");
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const update = async (id: string, patch: Record<string, string>) => {
    try {
      await api(`sources/${id}`, { method: "PUT", body: patch });
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
      <Notice>Hệ thống chạy trên máy (local-first). Nguồn “trên máy” được kiểm tra tự động; kết nối API bên ngoài để ở trạng thái <b>Deferred Task</b> cho đến khi bạn quyết định kênh và quyền truy cập.</Notice>
      <div className="row">
        <button className="btn btn-primary" onClick={check}>Kiểm tra kết nối</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
      <ErrorBox error={err} />
      <div className="cards">
        {data.map((s) => (
          <Card key={s.id} title={s.name} actions={<Badge value={s.status} label={LABEL[s.status]} />}>
            <p className="muted small">{s.kind === "local" ? `Trên máy: ${s.path}` : s.kind === "api" ? "API bên ngoài" : "Nhập thủ công"}{s.checkedAt ? ` · kiểm tra ${new Date(s.checkedAt).toLocaleString("vi-VN")}` : ""}</p>
            <p>{s.note}</p>
            {s.kind !== "local" && (
              <label className="field inline">
                <span>Trạng thái</span>
                <select value={s.status} onChange={(e) => update(s.id, { status: e.target.value })}>
                  {Object.entries(LABEL).map(([k, v]) => (
                    <option key={k} value={k} disabled={s.kind === "api" && k === "CONNECTED"}>{v}</option>
                  ))}
                </select>
              </label>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
