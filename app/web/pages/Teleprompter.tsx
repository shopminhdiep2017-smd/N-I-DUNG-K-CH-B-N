import { useEffect, useMemo, useRef, useState } from "react";
import type { Go } from "../App";
import { Badge, Card, Empty, ErrorBox, Notice, useApi } from "../components/ui";

function splitLines(text: string, maxWords = 14): string[] {
  const out: string[] = [];
  for (const s of text.replace(/\s+/g, " ").split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter(Boolean)) {
    const words = s.split(" ");
    let chunk: string[] = [];
    for (const w of words) {
      chunk.push(w);
      if ((/[,;:—–]$/.test(w) && chunk.length >= 5) || chunk.length >= maxWords) {
        out.push(chunk.join(" "));
        chunk = [];
      }
    }
    if (chunk.length) out.push(chunk.join(" "));
  }
  return out;
}

const CHECKLIST = [
  "Kịch bản đang ở trạng thái APPROVED_TO_RECORD (đã có người duyệt quay)",
  "Chỉ đọc đúng kịch bản đã duyệt — không thêm tuyên bố sức khỏe/sản phẩm ngoài kịch bản",
  "Không nhắc tên sản phẩm nếu kịch bản không có",
  "Chữ trên màn hình khi dựng sẽ khớp kịch bản đã duyệt",
  "Đã kiểm tra ánh sáng, âm thanh, khung hình",
];

export function Teleprompter({ itemId, go }: { itemId?: string; go: Go }) {
  if (!itemId) return <PickList go={go} />;
  return <Prompter itemId={itemId} go={go} />;
}

function PickList({ go }: { go: Go }) {
  const { data, error } = useApi<any[]>("items");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const ready = data.filter((i) => ["APPROVED_TO_RECORD", "RECORDED"].includes(i.meta.status));
  const drafts = data.filter((i) => !["APPROVED_TO_RECORD", "RECORDED"].includes(i.meta.status));
  return (
    <div className="stack">
      <Card title="Video sẵn sàng quay">
        {ready.length === 0 ? <Empty>Chưa có kịch bản nào được duyệt quay. Duyệt trong Hàng chờ phê duyệt.</Empty> : (
          <ul className="item-list">{ready.map((i) => <li key={i.id}><button className="btn btn-primary" onClick={() => go("prompter", i.id)}>▶ {i.id} — {i.meta.title}</button></li>)}</ul>
        )}
      </Card>
      <Card title="Đọc thử bản nháp (có dấu “NHÁP”)">
        <ul className="item-list">{drafts.map((i) => <li key={i.id}><button className="link" onClick={() => go("prompter", i.id)}>{i.id} — {i.meta.title}</button> <Badge value={i.meta.status} /></li>)}</ul>
      </Card>
    </div>
  );
}

function Prompter({ itemId, go }: { itemId: string; go: Go }) {
  const { data, error } = useApi(`items/${encodeURIComponent(itemId)}`);
  const [size, setSize] = useState(44);
  const [speed, setSpeed] = useState(40);
  const [playing, setPlaying] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [started, setStarted] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (t: number) => {
      const el = scroller.current;
      if (el) el.scrollTop += ((t - last) / 1000) * speed;
      last = t;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) return;
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "ArrowUp") setSpeed((s) => Math.min(200, s + 10));
      if (e.key === "ArrowDown") setSpeed((s) => Math.max(10, s - 10));
      if (e.key === "Escape") setStarted(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

  const blocks = useMemo(() => (data?.script.blocks ?? []).map((b: any) => ({ ...b, lines: splitLines(b.line) })), [data]);
  if (error) return <div className="content"><ErrorBox error={error} /></div>;
  if (!data) return <p className="muted content">Đang tải…</p>;
  const approved = ["APPROVED_TO_RECORD", "RECORDED"].includes(data.meta.status);
  const hook = blocks[0];
  const cta = blocks[blocks.length - 1];

  if (!started) {
    return (
      <div className="prompter-setup">
        <button className="btn" onClick={() => go("prompter")}>← Quay lại</button>
        <h1>{data.meta.title}</h1>
        {!approved && <Notice tone="error">BẢN NHÁP — CHƯA ĐƯỢC DUYỆT QUAY ({data.meta.status}). Chỉ dùng để tập đọc.</Notice>}
        {approved && <Notice tone="ok">Được duyệt quay bởi <b>{data.meta.record_approved_by}</b> ngày {data.meta.record_approved_date}.</Notice>}
        <div className="grid-2">
          <Card title="Hook (câu mở đầu)"><p className="big-quote">{hook?.line || "—"}</p></Card>
          <Card title="CTA (lời kêu gọi cuối)"><p className="big-quote">{cta?.line || "—"}</p></Card>
        </div>
        <Card title="Checklist trước khi quay">
          {CHECKLIST.map((c, i) => (
            <label key={c} className="check"><input type="checkbox" checked={checked[i]} onChange={(e) => setChecked(checked.map((v, j) => (j === i ? e.target.checked : v)))} /> {c}</label>
          ))}
        </Card>
        <button className="btn btn-primary btn-big" disabled={approved && !checked.every(Boolean)} onClick={() => { setStarted(true); setPlaying(false); }}>
          {approved ? "Bắt đầu quay" : "Tập đọc bản nháp"}
        </button>
        {approved && !checked.every(Boolean) && <p className="muted small">Đánh dấu đủ checklist để bắt đầu.</p>}
      </div>
    );
  }

  return (
    <div className="prompter">
      <div className="prompter-bar">
        <button className="btn" onClick={() => setStarted(false)}>✕ Thoát</button>
        <button className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? "⏸ Dừng" : "▶ Chạy"}</button>
        <label>Tốc độ <input type="range" min={10} max={200} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
        <label>Cỡ chữ <input type="range" min={28} max={96} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Lật gương</label>
        <button className="btn" onClick={() => { if (scroller.current) scroller.current.scrollTop = 0; }}>⤒ Đầu</button>
        <span className="hint">Phím cách: chạy/dừng · ↑↓: tốc độ · Esc: thoát</span>
      </div>
      {!approved && <div className="watermark">NHÁP — CHƯA DUYỆT QUAY</div>}
      <div className="prompter-scroll" ref={scroller} style={{ fontSize: size, transform: mirror ? "scaleX(-1)" : undefined }}>
        <div className="prompter-pad" />
        {blocks.map((b: any, i: number) => (
          <section key={i} className={`pblock ${i === 0 ? "is-hook" : i === blocks.length - 1 ? "is-cta" : ""}`}>
            <div className="plabel">{i === 0 && !/hook/i.test(b.block) ? "HOOK · " : i === blocks.length - 1 && !/cta/i.test(b.block) ? "CTA · " : ""}{b.block}</div>
            {b.lines.map((l: string, k: number) => <p key={k}>{l}</p>)}
          </section>
        ))}
        <div className="prompter-pad" />
      </div>
    </div>
  );
}
