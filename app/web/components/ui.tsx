import { useCallback, useEffect, useState, type ReactNode } from "react";
import { marked } from "marked";
import { api } from "../api";

export function useApi<T = any>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

const STATUS_TONE: Record<string, string> = {
  IDEA: "muted", CONTENT_BRIEF: "muted", SCRIPT_DRAFT: "info", NEEDS_SOURCE: "warn", NEEDS_REVIEW: "warn",
  APPROVED_TO_RECORD: "ok", RECORDED: "info", EDITING: "info", FINAL_REVIEW: "warn", APPROVED_TO_PUBLISH: "ok",
  PUBLISHED: "ok", MEASURED: "info", LEARNING_CAPTURED: "ok",
  HYPOTHESIS: "warn", CONFIRMED: "ok", REJECTED: "bad", MISSING: "muted",
  CONNECTED: "ok", NOT_CONNECTED: "muted", ERROR: "bad", MANUAL: "info", DEFERRED: "muted",
  PASS: "ok", WARN: "warn", FAIL: "bad",
  READY_FOR_APPROVAL: "ok", NEEDS_REVIEW_GATE: "warn", NEEDS_REVISION: "bad", BLOCKED: "bad",
};

export const VERDICT_LABEL: Record<string, string> = {
  READY_FOR_APPROVAL: "Đủ điều kiện vào hàng chờ duyệt",
  NEEDS_REVIEW: "Cần người xem kỹ (80–89)",
  NEEDS_REVISION: "Bắt buộc sửa (< 80)",
  BLOCKED: "BỊ CHẶN",
  REJECTED: "BỊ LOẠI",
};

export function Badge({ value, label, tone }: { value?: string; label?: string; tone?: string }) {
  const t = tone ?? STATUS_TONE[value ?? ""] ?? "muted";
  return <span className={`badge badge-${t}`}>{label ?? value}</span>;
}

export function ScoreBadge({ q }: { q: { score: number; verdict: string } | undefined }) {
  if (!q) return null;
  const tone = q.verdict === "READY_FOR_APPROVAL" ? "ok" : q.verdict === "NEEDS_REVIEW" ? "warn" : "bad";
  return (
    <span className={`score score-${tone}`} title={VERDICT_LABEL[q.verdict]}>
      <b>{q.score}</b>/100 · {VERDICT_LABEL[q.verdict] ?? q.verdict}
    </span>
  );
}

export function QualityDetail({ q }: { q: any }) {
  if (!q) return null;
  return (
    <div className="quality">
      <ScoreBadge q={q} />
      {q.blockers?.length > 0 && (
        <ul className="blockers">
          {q.blockers.map((b: string) => (
            <li key={b}>⛔ {b}</li>
          ))}
        </ul>
      )}
      <table className="table compact">
        <tbody>
          {q.criteria.map((c: any) => (
            <tr key={c.id} className={c.earned < c.points ? "miss" : ""}>
              <td>{c.earned >= c.points ? "✓" : c.earned > 0 ? "◐" : "✗"}</td>
              <td>{c.label}{c.note ? <small className="muted"> — {c.note}</small> : null}</td>
              <td className="num">{c.earned}/{c.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComplianceList({ c }: { c: any }) {
  if (!c) return null;
  return (
    <div>
      <Badge value={c.result} label={`Tuân thủ: ${c.result}`} />
      <ul className="findings">
        {c.findings.map((f: any, i: number) => (
          <li key={i} className={f.severity === "FAIL" ? "fail" : "warn"}>
            {f.severity === "FAIL" ? "✗" : "!"} {f.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Card({ title, children, actions, className }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className ?? ""}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Markdown({ text }: { text: string }) {
  return <div className="md" dangerouslySetInnerHTML={{ __html: marked.parse(text, { async: false }) as string }} />;
}

export function ErrorBox({ error }: { error: string | null }) {
  return error ? <div className="alert alert-error">⚠ {error}</div> : null;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" | "ok" }) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

/** Tên người thao tác — nhớ trên trình duyệt này (localStorage) cho tiện, không phải chữ ký tự động. */
export function useReviewerName(): [string, (v: string) => void] {
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem("aios.reviewer") ?? "";
    } catch {
      return "";
    }
  });
  const save = (v: string) => {
    setName(v);
    try {
      localStorage.setItem("aios.reviewer", v);
    } catch {
      /* bỏ qua */
    }
  };
  return [name, save];
}

export function CopyBox({ text, label = "Sao chép" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copybox">
      <pre>{text}</pre>
      <button
        className="btn btn-small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Đã chép ✓" : label}
      </button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
