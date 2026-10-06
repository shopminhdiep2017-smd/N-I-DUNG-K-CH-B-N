import { useEffect, useState } from "react";
import { Overview } from "./pages/Overview";
import { Brand } from "./pages/Brand";
import { Sources } from "./pages/Sources";
import { CustomerData } from "./pages/CustomerData";
import { Insights } from "./pages/Insights";
import { ContentMap } from "./pages/ContentMap";
import { ScriptStudio } from "./pages/ScriptStudio";
import { Teleprompter } from "./pages/Teleprompter";
import { Kanban } from "./pages/Kanban";
import { Approvals } from "./pages/Approvals";
import { Analytics } from "./pages/Analytics";

export type Go = (page: string, param?: string) => void;

const PAGES: { id: string; label: string; icon: string }[] = [
  { id: "overview", label: "Tổng quan", icon: "◎" },
  { id: "brand", label: "Chiến lược thương hiệu", icon: "◆" },
  { id: "sources", label: "Nguồn dữ liệu", icon: "⇄" },
  { id: "customers", label: "Dữ liệu khách hàng", icon: "❝" },
  { id: "insights", label: "Thư viện Insight", icon: "✦" },
  { id: "map", label: "Bản đồ nội dung", icon: "▦" },
  { id: "studio", label: "Script Studio", icon: "✎" },
  { id: "prompter", label: "Chế độ quay video", icon: "▶" },
  { id: "kanban", label: "Kanban sản xuất", icon: "☰" },
  { id: "approvals", label: "Hàng chờ phê duyệt", icon: "✔" },
  { id: "analytics", label: "Phân tích hiệu quả", icon: "↗" },
];

function parseHash(): [string, string | undefined] {
  const [page, param] = window.location.hash.replace(/^#\/?/, "").split("/");
  return [PAGES.some((p) => p.id === page) ? page : "overview", param ? decodeURIComponent(param) : undefined];
}

export function App() {
  const [[page, param], setRoute] = useState(parseHash);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go: Go = (p, prm) => {
    window.location.hash = `/${p}${prm ? "/" + encodeURIComponent(prm) : ""}`;
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  const current = PAGES.find((p) => p.id === page)!;
  if (page === "prompter" && param) return <Teleprompter itemId={param} go={go} />;
  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand-mark">
          <div className="logo">LH</div>
          <div>
            <strong>Personal Brand AI OS</strong>
            <small>Dược sĩ Lê Hương · tuần hoàn, tim mạch</small>
          </div>
        </div>
        <nav>
          {PAGES.map((p) => (
            <button key={p.id} className={p.id === page ? "active" : ""} onClick={() => go(p.id)}>
              <span className="icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>
        <p className="sidebar-foot">Chạy trên máy của bạn · AI chỉ soạn nháp · Con người duyệt mọi bước quan trọng</p>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Mở menu">☰</button>
          <h1>{current.label}</h1>
        </header>
        <main className="content">
          {page === "overview" && <Overview go={go} />}
          {page === "brand" && <Brand />}
          {page === "sources" && <Sources />}
          {page === "customers" && <CustomerData />}
          {page === "insights" && <Insights />}
          {page === "map" && <ContentMap go={go} />}
          {page === "studio" && <ScriptStudio itemId={param} go={go} />}
          {page === "prompter" && <Teleprompter go={go} />}
          {page === "kanban" && <Kanban go={go} />}
          {page === "approvals" && <Approvals go={go} />}
          {page === "analytics" && <Analytics go={go} />}
        </main>
      </div>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
