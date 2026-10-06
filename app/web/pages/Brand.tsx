import { useState } from "react";
import { Card, ErrorBox, Markdown, Notice, useApi } from "../components/ui";

export function Brand() {
  const { data, error } = useApi("brand");
  const [key, setKey] = useState("positioning");
  if (error) return <ErrorBox error={error} />;
  if (!data) return <p className="muted">Đang tải…</p>;
  const doc = data.docs.find((d: any) => d.key === key) ?? data.docs[0];
  return (
    <div className="stack">
      <Notice tone="info">🔒 <b>Chỉ đọc.</b> {data.note}</Notice>
      <div className="split">
        <nav className="doc-nav">
          {data.docs.map((d: any) => (
            <button key={d.key} className={d.key === key ? "active" : ""} onClick={() => setKey(d.key)}>
              {d.title}
              {!d.exists && <small> (chưa có)</small>}
            </button>
          ))}
        </nav>
        <Card title={doc.title} actions={<code className="path">{doc.path}</code>}>
          <Markdown text={doc.markdown} />
        </Card>
      </div>
    </div>
  );
}
