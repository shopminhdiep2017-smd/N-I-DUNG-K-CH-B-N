import { useState } from "react";
import type { Go } from "../App";
import { api } from "../api";
import { Badge, ErrorBox, Notice, ScoreBadge, useApi, useReviewerName } from "../components/ui";

const APPROVAL_ONLY = ["SCRIPT_DRAFT", "APPROVED_TO_RECORD", "APPROVED_TO_PUBLISH"];

export function Kanban({ go }: { go: Go }) {
  const meta = useApi("meta");
  const { data, error, reload } = useApi<any[]>("items");
  const [name, setName] = useReviewerName();
  const [err, setErr] = useState<string | null>(null);
  if (error || meta.error) return <ErrorBox error={error || meta.error} />;
  if (!data || !meta.data) return <p className="muted">Đang tải…</p>;
  const statuses: { id: string; label: string }[] = meta.data.statuses;
  const idx = (s: string) => statuses.findIndex((x) => x.id === s);

  const move = async (item: any, to: string) => {
    const body: any = { to, actor: name };
    if (to === "PUBLISHED") {
      const url = window.prompt("Đường link bài đã đăng:");
      if (!url) return;
      body.publishedUrl = url;
    }
    if (to === "LEARNING_CAPTURED") {
      const learning = window.prompt("Bài học rút ra từ video này:");
      if (!learning) return;
      body.learning = learning;
    }
    if (idx(to) < idx(item.meta.status)) {
      const note = window.prompt("Lý do trả về (chữ ký duyệt phía sau sẽ bị hủy):");
      if (!note) return;
      body.note = note;
    }
    try {
      await api(`items/${encodeURIComponent(item.id)}/move`, { method: "POST", body });
      setErr(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="stack">
      <Notice>Các bước <b>SCRIPT_DRAFT</b> (duyệt brief), <b>APPROVED_TO_RECORD</b> và <b>APPROVED_TO_PUBLISH</b> chỉ vào được qua <a onClick={() => go("approvals")}>Hàng chờ phê duyệt</a>. Mọi thao tác được ghi tên người thực hiện.</Notice>
      <div className="row wrap">
        <label className="field"><span>Tên người thực hiện</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      </div>
      <ErrorBox error={err} />
      <div className="kanban">
        {statuses.map((s) => {
          const cards = data.filter((i) => i.meta.status === s.id);
          return (
            <div key={s.id} className={`kcol ${APPROVAL_ONLY.includes(s.id) ? "gate" : ""}`}>
              <header><b>{s.label}</b><small>{s.id}</small><span className="count">{cards.length}</span></header>
              {cards.map((i) => {
                const next = statuses[idx(s.id) + 1]?.id;
                const canNext = next && !APPROVAL_ONLY.includes(next);
                return (
                  <article key={i.id} className="kcard">
                    <button className="link" onClick={() => go("studio", i.id)}>{i.meta.title}</button>
                    <small className="muted">{i.id} · {i.meta.format} · {i.meta.stage_5a}</small>
                    <div className="row wrap">
                      <Badge value={i.compliance.result} />
                      {i.hasProduct && <Badge value="WARN" label="sản phẩm" />}
                    </div>
                    {idx(s.id) <= idx("CONTENT_BRIEF") ? <><small className="muted">Điểm brief</small><ScoreBadge q={i.briefScore} /></> : <><small className="muted">Điểm kịch bản</small><ScoreBadge q={i.scriptScore} /></>}
                    <div className="row wrap">
                      {canNext && <button className="btn btn-small" onClick={() => move(i, s.id === "SCRIPT_DRAFT" && i.hasProduct ? "NEEDS_SOURCE" : next)}>→ {s.id === "SCRIPT_DRAFT" && i.hasProduct ? "NEEDS_SOURCE" : next}</button>}
                      {s.id === "SCRIPT_DRAFT" && !i.hasProduct && <button className="btn btn-small" onClick={() => move(i, "NEEDS_REVIEW")}>→ NEEDS_REVIEW</button>}
                      {next && APPROVAL_ONLY.includes(next) && <button className="btn btn-small" onClick={() => go("approvals")}>Chờ duyệt →</button>}
                      {idx(s.id) > idx("SCRIPT_DRAFT") && <button className="btn btn-small btn-ghost" onClick={() => move(i, "SCRIPT_DRAFT")}>↺ Trả về bản thảo</button>}
                      {["APPROVED_TO_RECORD", "RECORDED"].includes(s.id) && <button className="btn btn-small" onClick={() => go("prompter", i.id)}>▶ Quay</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
