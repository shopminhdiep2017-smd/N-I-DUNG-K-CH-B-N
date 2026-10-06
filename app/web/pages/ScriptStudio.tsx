import { useEffect, useRef, useState } from "react";
import type { Go } from "../App";
import { api } from "../api";
import { Badge, Card, ComplianceList, CopyBox, Empty, ErrorBox, Notice, QualityDetail, ScoreBadge, useApi, useReviewerName } from "../components/ui";

const BRIEF_FIELDS = [
  "Khách hàng mục tiêu", "Giai đoạn hành trình (5A)", "Insight", "Vấn đề", "Niềm tin cần thay đổi", "Mục tiêu nội dung",
  "Thông điệp chính", "Liên quan đến sản phẩm nào", "Claim được sử dụng", "Nguồn bằng chứng", "Hook", "Nội dung chính",
  "CTA", "Trạng thái kiểm duyệt", "Người duyệt", "Chỉ số cần theo dõi",
];
const STAGES = ["Aware", "Appeal", "Ask", "Act", "Advocate"];
const PILLARS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
const EDITABLE = ["IDEA", "CONTENT_BRIEF", "SCRIPT_DRAFT", "NEEDS_SOURCE", "NEEDS_REVIEW"];

export function ScriptStudio({ itemId, go }: { itemId?: string; go: Go }) {
  const meta = useApi("meta");
  const list = useApi<any[]>("items");
  const insights = useApi<any[]>("insights");
  if (!itemId) return <StudioHome go={go} meta={meta.data} items={list.data} insights={insights.data} error={meta.error || list.error} />;
  return <Editor key={itemId} itemId={itemId} go={go} formats={meta.data?.formats ?? []} insights={insights.data ?? []} />;
}

function StudioHome({ go, meta, items, insights, error }: any) {
  const [name] = useReviewerName();
  const [f, setF] = useState({ title: "", format: "video-gia-tri", stage_5a: "Aware", pillar: "P1", insight: "INS-01", claims: "" });
  const [err, setErr] = useState<string | null>(null);
  const create = async () => {
    try {
      const it = await api("items", { method: "POST", body: { ...f, author: name } });
      go("studio", it.id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  if (error) return <ErrorBox error={error} />;
  if (!meta || !items) return <p className="muted">Đang tải…</p>;
  const fmt = meta.formats.find((x: any) => x.id === f.format);
  return (
    <div className="stack">
      <Card title="Tạo nội dung mới (Content Brief)">
        <div className="form">
          <label className="field"><span>Tên nội dung</span><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ví dụ: Già rồi ai chẳng thế? — đừng chịu đựng tê bì âm thầm" /></label>
          <div className="row wrap">
            <label className="field"><span>Cấu trúc kịch bản</span>
              <select value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}>{meta.formats.map((x: any) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
            <label className="field"><span>Giai đoạn 5A</span><select value={f.stage_5a} onChange={(e) => setF({ ...f, stage_5a: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Trụ cột</span><select value={f.pillar} onChange={(e) => setF({ ...f, pillar: e.target.value })}>{PILLARS.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Insight</span><select value={f.insight} onChange={(e) => setF({ ...f, insight: e.target.value })}>{(insights ?? []).filter((i: any) => i.status !== "MISSING").map((i: any) => <option key={i.id} value={i.id}>{i.id} ({i.status})</option>)}</select></label>
          </div>
          <label className="field"><span>Claim dùng (để trống nếu không nhắc sản phẩm/công dụng)</span><input value={f.claims} placeholder="CLM-007, …" onChange={(e) => setF({ ...f, claims: e.target.value })} /></label>
          {fmt && <p className="muted small">Cấu trúc: {fmt.blocks.map((b: any) => b.label).join(" → ")} · Gợi ý giai đoạn: {fmt.stages.join(", ")}</p>}
          {f.claims.trim() && <Notice tone="warn">Nội dung có claim: toàn bộ claim hiện là UNVERIFIED → nội dung sẽ dừng ở NEEDS_SOURCE, không quay/đăng được.</Notice>}
          <ErrorBox error={err} />
          <button className="btn btn-primary" onClick={create} disabled={!f.title.trim()}>Tạo</button>
        </div>
      </Card>
      <Card title="Nội dung hiện có">
        {items.length === 0 ? <Empty>Chưa có nội dung.</Empty> : (
          <ul className="item-list">
            {items.map((i: any) => (
              <li key={i.id}><button className="link" onClick={() => go("studio", i.id)}>{i.id} — {i.meta.title}</button> <Badge value={i.meta.status} /> <ScoreBadge q={i.scriptScore} /></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Editor({ itemId, go, formats, insights }: { itemId: string; go: Go; formats: any[]; insights: any[] }) {
  const { data, error, reload } = useApi(`items/${encodeURIComponent(itemId)}`);
  const [name, setName] = useReviewerName();
  const [m, setM] = useState<any>(null);
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<any[]>([]);
  const [caption, setCaption] = useState("");
  const [visuals, setVisuals] = useState("");
  const [evalRes, setEvalRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [ai, setAi] = useState<any>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!data) return;
    setM({ ...data.meta });
    setBrief({ ...data.brief });
    setBlocks(data.script.blocks.map((b: any) => ({ ...b })));
    setCaption(data.script.caption);
    setVisuals(data.script.visuals);
  }, [data]);

  useEffect(() => {
    if (!m) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        setEvalRes(await api("evaluate", { method: "POST", body: { meta: m, brief, blocks, caption, visuals } }));
      } catch {
        /* bỏ qua lỗi đánh giá tạm */
      }
    }, 400);
  }, [m, brief, blocks, caption, visuals]);

  if (error) return <ErrorBox error={error} />;
  if (!data || !m) return <p className="muted">Đang tải…</p>;
  const editable = EDITABLE.includes(data.meta.status);
  const fmt = formats.find((f) => f.id === m.format);

  const applyTemplate = () => {
    if (!fmt) return;
    const next = fmt.blocks.map((d: any) => blocks.find((b) => d.match.some((k: string) => b.block.toLowerCase().includes(k))) ?? { block: d.label, line: "", visual: "", claim: "" });
    setBlocks(next);
  };
  const save = async () => {
    try {
      await api(`items/${encodeURIComponent(itemId)}`, { method: "PUT", body: { meta: m, brief, blocks, caption, visuals, editor: name } });
      setSaved(new Date().toLocaleTimeString("vi-VN"));
      setErr(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const runAi = async (task: string) => {
    try {
      setAi(await api("ai/run", { method: "POST", body: { task, itemId } }));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const setBlock = (i: number, k: string, v: string) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, [k]: v } : b)));

  return (
    <div className="studio">
      <div className="stack">
        <div className="row wrap">
          <button className="btn" onClick={() => go("studio")}>← Danh sách</button>
          <Badge value={data.meta.status} label={`${data.meta.status} · ${data.statusLabel}`} />
          <code className="path">{data.file}</code>
          {data.meta.status === "APPROVED_TO_RECORD" && <button className="btn btn-primary" onClick={() => go("prompter", itemId)}>▶ Mở chế độ quay</button>}
        </div>
        {!editable && <Notice tone="warn">Nội dung đã qua cổng duyệt ({data.meta.status}). Chỉ xem. Muốn sửa: dùng “Trả về bản thảo” trên Kanban — chữ ký duyệt cũ sẽ bị hủy.</Notice>}
        {data.meta.status === "IDEA" && <Notice>Bước tiếp theo: hoàn thiện brief → chuyển sang CONTENT_BRIEF trên Kanban → người duyệt ký brief trong Hàng chờ phê duyệt.</Notice>}

        <Card title="Thông tin">
          <div className="row wrap">
            <label className="field grow"><span>Tên</span><input disabled={!editable} value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} /></label>
            <label className="field"><span>Cấu trúc</span><select disabled={!editable} value={m.format} onChange={(e) => setM({ ...m, format: e.target.value })}>{formats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
            <label className="field"><span>5A</span><select disabled={!editable} value={m.stage_5a} onChange={(e) => setM({ ...m, stage_5a: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Trụ cột</span><select disabled={!editable} value={m.pillar} onChange={(e) => setM({ ...m, pillar: e.target.value })}>{PILLARS.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Insight</span><select disabled={!editable} value={m.insight} onChange={(e) => setM({ ...m, insight: e.target.value })}>{insights.filter((i) => i.status !== "MISSING").map((i) => <option key={i.id} value={i.id}>{i.id}</option>)}</select></label>
            <label className="field"><span>Claim</span><input disabled={!editable} value={m.claims === "-" ? "" : m.claims} placeholder="trống = không có" onChange={(e) => setM({ ...m, claims: e.target.value })} /></label>
          </div>
          <p className="muted small">Brief duyệt bởi: {data.meta.brief_approved_by || "—"} · Duyệt quay: {data.meta.record_approved_by || "—"} · Duyệt đăng: {data.meta.publish_approved_by || "—"}</p>
        </Card>

        <Card title="1. Content Brief">
          <div className="brief-grid">
            {BRIEF_FIELDS.map((k) => (
              <label key={k} className="field"><span>{k}</span>
                <textarea rows={k === "Nội dung chính" ? 3 : 1} disabled={!editable} value={brief[k] ?? ""} onChange={(e) => setBrief({ ...brief, [k]: e.target.value })} /></label>
            ))}
          </div>
        </Card>

        <Card title={`2. Kịch bản — ${fmt?.label ?? m.format}`} actions={editable && <button className="btn btn-small" onClick={applyTemplate}>Sắp khối theo cấu trúc</button>}>
          {evalRes?.pendingLabel && <Notice tone="warn">Sẽ tự gắn nhãn: <b>CHỜ CLAIM ĐƯỢC PHÊ DUYỆT – KHÔNG ĐƯỢC SỬ DỤNG CÔNG KHAI</b></Notice>}
          {blocks.length === 0 && <Empty>Chưa có khối. Bấm “Sắp khối theo cấu trúc”.</Empty>}
          {blocks.map((b, i) => {
            const def = fmt?.blocks.find((d: any) => d.match.some((k: string) => b.block.toLowerCase().includes(k)));
            return (
              <div key={i} className="block">
                <div className="row wrap">
                  <input className="block-name" disabled={!editable} value={b.block} onChange={(e) => setBlock(i, "block", e.target.value)} />
                  {def?.hint && <small className="muted">{def.hint}</small>}
                </div>
                <textarea rows={3} disabled={!editable} placeholder="Lời thoại" value={b.line} onChange={(e) => setBlock(i, "line", e.target.value)} />
                <div className="row wrap">
                  <input className="grow" disabled={!editable} placeholder="Hình ảnh / chữ trên màn hình" value={b.visual} onChange={(e) => setBlock(i, "visual", e.target.value)} />
                  <input disabled={!editable} placeholder="Claim (CLM-…)" value={b.claim} onChange={(e) => setBlock(i, "claim", e.target.value)} />
                  {editable && <button className="btn btn-small" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>Xóa</button>}
                </div>
              </div>
            );
          })}
          {editable && <button className="btn btn-small" onClick={() => setBlocks([...blocks, { block: "Khối mới", line: "", visual: "", claim: "" }])}>+ Thêm khối</button>}
          <label className="field"><span>Caption</span><textarea rows={3} disabled={!editable} value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
          <label className="field"><span>Gợi ý tư liệu trực quan (từ khóa Pinterest/CapCut — bản quyền do con người kiểm tra)</span><textarea rows={2} disabled={!editable} value={visuals} onChange={(e) => setVisuals(e.target.value)} /></label>
        </Card>

        {editable && (
          <div className="row wrap sticky-actions">
            <label className="field"><span>Người sửa</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <button className="btn btn-primary" onClick={save}>Lưu</button>
            {saved && <span className="muted">Đã lưu {saved}</span>}
          </div>
        )}
        <ErrorBox error={err} />
      </div>

      <aside className="stack side">
        <Card title="Quality Gate — Kịch bản">
          <QualityDetail q={evalRes?.scriptScore ?? data.scriptScore} />
        </Card>
        <Card title="Quality Gate — Brief">
          <QualityDetail q={evalRes?.briefScore ?? data.briefScore} />
        </Card>
        <Card title="Kiểm tra tuân thủ (Tầng 0)">
          <ComplianceList c={evalRes?.compliance ?? data.compliance} />
        </Card>
        <Card title="Nhờ AI (Model Router)">
          <p className="small muted">Mặc định: tạo prompt để bạn dán vào Claude Code (Tầng 1). Chỉ gọi API khi đã bật tầng 2/3.</p>
          <div className="row wrap">
            <button className="btn btn-small" onClick={() => runAi("draft_script")}>Viết/sửa kịch bản</button>
            <button className="btn btn-small" onClick={() => runAi("semantic_review")}>Kiểm duyệt ngữ nghĩa</button>
          </div>
          {ai && (
            <div className="stack-sm">
              <p className="small"><Badge value="MANUAL" label={`Tầng ${ai.decision.tier}`} /> {ai.decision.reason}</p>
              {ai.prompt && <CopyBox text={ai.prompt} />}
              {ai.draft && <><Notice tone="warn">{ai.label}</Notice><CopyBox text={ai.draft} /></>}
            </div>
          )}
        </Card>
      </aside>
    </div>
  );
}
