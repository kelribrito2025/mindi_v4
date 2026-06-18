import React, { useEffect } from "react";

// Static demo dashboard page 1 - pixel perfect replica for landing page iframe

// ─── SVG Icon Components (matching Mindi's exact icons) ──────────────

// Dashboard icon - Lucide LayoutDashboard (filled to match visual appearance at small sizes)
function IconDashboard({ color = "#ef4444", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

// Frente de Caixa - monitor/desktop
function IconMonitor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// Mapa de mesas - fork and knife (utensils)
function IconMapaMesas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

// Pedidos - clipboard
function IconPedidos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

// Entregadores - Bike (bicycle) - matches Lucide Bike icon
function IconEntregadores() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}

// Menu - BookOpen (open book) - matches Lucide BookOpen icon
function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// Estoque - box/package
function IconEstoque() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}

// Finanças - BadgeDollarSign - matches Lucide BadgeDollarSign icon
function IconFinancas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

// Relatórios - bar chart
function IconRelatorios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  );
}

// Stories - Clapperboard (cinema clapper) - matches Lucide Clapperboard icon
function IconStories() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
      <path d="m6.2 5.3 3.1 3.9" />
      <path d="m12.4 3.4 3.1 4" />
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

// Cupons - Ticket - matches Lucide Ticket icon
function IconCupons() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

// Campanhas - megaphone/send
function IconCampanhas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

// Fidelização - heart
function IconFidelizacao() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const SIDEBAR_ICONS: Record<string, () => React.ReactElement> = {
  "Dashboard": () => <IconDashboard color="#ef4444" size={18} />,
  "Frente de Caixa": IconMonitor,
  "Mapa de mesas": IconMapaMesas,
  "Pedidos": IconPedidos,
  "Entregadores": IconEntregadores,
  "Menu": IconMenu,
  "Estoque": IconEstoque,
  "Finanças": IconFinancas,
  "Relatórios": IconRelatorios,
  "Stories": IconStories,
  "Cupons": IconCupons,
  "Campanhas": IconCampanhas,
  "Fidelização": IconFidelizacao,
};

const SIDEBAR_SECTIONS = [
  { title: "OPERAÇÕES", items: [
    { label: "Dashboard", active: true },
    { label: "Frente de Caixa" },
    { label: "Mapa de mesas" },
  ]},
  { title: "GESTÃO", items: [
    { label: "Pedidos" },
    { label: "Entregadores" },
    { label: "Menu", hasArrow: true },
    { label: "Estoque" },
  ]},
  { title: "FINANCEIRO", items: [
    { label: "Finanças" },
    { label: "Relatórios" },
  ]},
  { title: "MARKETING", items: [
    { label: "Stories" },
    { label: "Cupons" },
    { label: "Campanhas" },
    { label: "Fidelização" },
  ]},
  { title: "SISTEMA", items: [] as { label: string; active?: boolean; hasArrow?: boolean }[] },
];

const KPI_DATA = [
  { label: "PEDIDOS DO MÊS", value: "62", change: "+85%", positive: true, borderColor: "#3b82f6", iconBg: "#dbeafe", iconColor: "#3b82f6", hasDot: true, dotColor: "#3b82f6", icon: "clipboard" },
  { label: "FATURAMENTO DO MÊS", value: "R$ 2.355", change: "", positive: true, borderColor: "#10b981", iconBg: "#d1fae5", iconColor: "#10b981", hasDot: true, dotColor: "#3b82f6", icon: "dollar" },
  { label: "TICKET MÉDIO", value: "R$ 51,68", change: "+19%", positive: true, borderColor: "#10b981", iconBg: "#dbeafe", iconColor: "#3b82f6", hasDot: true, dotColor: "#3b82f6", icon: "trending" },
  { label: "TAXA DE CONVERSÃO", value: "34.4%", change: "+9%", positive: true, borderColor: "#10b981", iconBg: "#d1fae5", iconColor: "#10b981", hasDot: true, dotColor: "#22c55e", icon: "check" },
  { label: "C. FIDELIZADOS", value: "44", change: "~0%", positive: false, borderColor: "#ef4444", iconBg: "#fee2e2", iconColor: "#ef4444", hasDot: true, dotColor: "#ef4444", icon: "users" },
];

function KpiIcon({ type, color }: { type: string; color: string }) {
  switch (type) {
    case "clipboard":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14h6" /><path d="M9 18h6" /></svg>;
    case "dollar":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case "trending":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>;
    case "check":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
    case "users":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    default:
      return null;
  }
}

const BAR_DATA = [
  { month: "Nov", h: 3 },
  { month: "Dez", h: 5 },
  { month: "Jan", h: 7 },
  { month: "Fev", h: 50 },
  { month: "Mar", h: 70 },
  { month: "Abr", h: 12 },
];

const HEATMAP_HOURS = ["8h","9h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h","20h","21h","22h","23h","0h","1h","2h","3h","4h","5h","6h","7h"];
const HEATMAP_DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const HEATMAP_DATA = [
  [0,0,0,0,0,1,1,2,1,1,2,3,5,6,4,2,1,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,2,3,2,2,3,4,4,3,2,1,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,2,2,3,3,2,3,5,6,5,4,3,2,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,3,4,3,2,4,5,6,5,4,3,2,1,1,0,0,0,0,0],
  [0,0,0,0,1,2,4,7,4,2,3,4,5,4,3,2,1,1,0,0,0,0,0,0],
  [0,1,0,1,1,2,3,5,4,3,4,6,8,7,5,4,2,1,1,0,0,0,0,0],
  [0,0,1,1,2,3,5,8,5,3,4,6,7,5,4,3,2,1,0,0,0,0,0,0],
];

// Tooltip data for the heatmap
const TOOLTIP_DAY = 4; // Qui
const TOOLTIP_HOUR = 7; // 15h (index 7 = 15h)

// Lighter blue heatmap colors matching the reference
function getHeatColor(val: number) {
  if (val === 0) return "#f0f4f8";
  if (val <= 1) return "#dbeafe";
  if (val <= 2) return "#bfdbfe";
  if (val <= 3) return "#93c5fd";
  if (val <= 4) return "#60a5fa";
  if (val <= 5) return "#3b82f6";
  if (val <= 6) return "#2563eb";
  if (val <= 7) return "#1d4ed8";
  if (val <= 8) return "#1e40af";
  return "#1e3a8a";
}

// ─── Shared Styles ─────────────────────────────────────────────────────
const s = {
  card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" } as React.CSSProperties,
  sectionTitle: { fontSize: "10px", fontWeight: 700, color: "#ef4444", padding: "14px 16px 6px", letterSpacing: "0.5px" } as React.CSSProperties,
  sidebarItem: (active?: boolean) => ({
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: active ? "#ef4444" : "#555",
    background: active ? "#fef2f2" : "transparent",
    borderRadius: "8px",
    margin: "1px 8px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
  } as React.CSSProperties),
};

export default function DemoDashboard1({ embedded = false }: { embedded?: boolean }) {
  useEffect(() => {
    if (embedded) return;
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.body.style.overflow = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
    };
  }, [embedded]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "12px", color: "#1a1a2e", background: "#f7f8fa", display: "flex", height: "100vh", overflow: "hidden", lineHeight: 1.4 }}>
      {/* ─── Sidebar ─── */}
      <aside style={{ width: "210px", minWidth: "210px", background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Logo / Brand - aligned with topbar height */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", borderBottom: "1px solid #f0f0f0", minHeight: "46px" }}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/burger-house-logo-HPT3FFDJWJAWtF8ZJTeRAW.webp" alt="BH" style={{ width: "36px", height: "36px", borderRadius: "22%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a2e" }}>Burger House</div>
            <div style={{ fontSize: "10.5px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              Aberto
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflow: "hidden", paddingTop: "4px" }}>
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title}>
              {section.title && <div style={s.sectionTitle}>{section.title}</div>}
              {section.items.map((item) => {
                const IconComp = SIDEBAR_ICONS[item.label];
                return (
                  <div key={item.label} style={s.sidebarItem(item.active)}>
                    <span style={{ width: "20px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      {IconComp ? <IconComp /> : <span>•</span>}
                    </span>
                    <span>{item.label}</span>
                    {item.hasArrow && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ marginLeft: "auto" }}><path d="m9 18 6-6-6-6" /></svg>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 20px", display: "flex", alignItems: "center", gap: "12px", minHeight: "46px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #e5e5e8", borderRadius: "10px", padding: "6px 14px", width: "240px" }}>
            <IconSearch />
            <span style={{ color: "#aaa", fontSize: "12px" }}>Buscar produtos, pedidos...</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Timer badge */}
            <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "14px", fontSize: "10.5px", fontWeight: 600, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              49min
            </span>
            {/* Ver menu - uses bg-primary/10 text-primary (red/pink) */}
            <span style={{ background: "#fef2f2", color: "#ef4444", padding: "3px 10px", borderRadius: "14px", fontSize: "10.5px", fontWeight: 600, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Ver menu
            </span>
            {/* Sound icon - smaller */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            {/* Toggle - smaller */}
            <div style={{ width: "30px", height: "16px", background: "#ef4444", borderRadius: "8px", position: "relative", cursor: "pointer" }}>
              <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", right: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
            </div>
            {/* Avatar - smaller */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "2px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>B</div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.2 }}>Bruno</div>
                <div style={{ fontSize: "9px", color: "#999", lineHeight: 1.2 }}>Admin</div>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
          {/* Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
                <IconDashboard color="#2563eb" size={22} />
                <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#1a1a2e" }}>Dashboard</h1>
              </div>
              <p style={{ color: "#999", fontSize: "12px", margin: 0 }}>segunda-feira, 6 de abril de 2026</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Changelog/Sparkles button */}
              <button style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", marginLeft: 2, marginTop: -8 }} />
              </button>
              {/* SlidingTabs - fundo cinza subtil com pílula branca */}
              <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "#eff2f5", borderRadius: "12px", padding: "3px" }}>
                <button style={{ background: "none", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Hoje</button>
                <button style={{ background: "none", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Esta semana</button>
                <button style={{ background: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", color: "#111", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>Este mês</button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {KPI_DATA.map((kpi, i) => (
              <div key={i} style={{ ...s.card, borderTop: `3px solid ${kpi.borderColor}`, padding: "18px", minHeight: "90px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 500, color: "#888", letterSpacing: "0.4px", textTransform: "uppercase" }}>{kpi.label}</span>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: kpi.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <KpiIcon type={kpi.icon} color={kpi.iconColor} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "nowrap" }}>
                  {kpi.hasDot && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: kpi.dotColor, display: "inline-block", flexShrink: 0 }} />}
                  <span style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap" }}>
                    {kpi.value}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: kpi.positive ? "#22c55e" : "#999", whiteSpace: "nowrap" }}>{kpi.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Two column: Acumulado + Acessos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            {/* Acumulado do mês */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>Acumulado do mês</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>Faturamento dos últimos 6 meses</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "14px 0 18px" }}>
                <span style={{ fontSize: "24px", fontWeight: 700 }}>R$ 2.355,00</span>
                <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>↘ -88%</span>
                <span style={{ fontSize: "11px", color: "#999" }}>vs mês anterior</span>
              </div>
              {/* Bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", height: "110px", gap: "6px", paddingBottom: "22px", position: "relative" }}>
                {BAR_DATA.map((bar, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{
                      width: "70%",
                      height: `${bar.h}%`,
                      background: bar.h > 10 ? "linear-gradient(180deg, #6ee7b7, #34d399)" : "#e5e7eb",
                      borderRadius: "4px 4px 0 0",
                      minHeight: "3px",
                    }} />
                  </div>
                ))}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex" }}>
                  {BAR_DATA.map((bar, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "#999" }}>{bar.month}</div>
                  ))}
                </div>
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "calc(100% - 22px)", pointerEvents: "none" }} viewBox="0 0 600 100" preserveAspectRatio="none">
                  <path d="M50,95 L150,90 L250,85 L350,45 L450,25 L550,80" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="4,4" />
                </svg>
              </div>
            </div>

            {/* Acessos ao Cardápio */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Acessos ao Cardápio</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>Dias e horários com mais acessos ao seu cardápio</div>
                  </div>
                </div>
                <span style={{ color: "#ccc", fontSize: "16px", cursor: "pointer" }}>ⓘ</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "12px 0 14px" }}>
                <span style={{ fontSize: "24px", fontWeight: 700 }}>191</span>
                <span style={{ fontSize: "12px", color: "#999" }}>Este mês</span>
                <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600 }}>↘ -82%</span>
              </div>
              {/* Heatmap */}
              <div style={{ display: "flex", gap: "2px", position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginRight: "4px", paddingTop: "16px" }}>
                  {HEATMAP_DAYS.map(d => (
                    <div key={d} style={{ height: "13px", fontSize: "9px", color: "#888", display: "flex", alignItems: "center" }}>{d}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "1px", marginBottom: "3px" }}>
                    {HEATMAP_HOURS.map(h => (
                      <div key={h} style={{ flex: 1, fontSize: "6.5px", color: "#aaa", textAlign: "center" }}>{h}</div>
                    ))}
                  </div>
                  {HEATMAP_DATA.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", gap: "1px", marginBottom: "1.5px" }}>
                      {row.map((val, ci) => (
                        <div key={ci} style={{ flex: 1, height: "13px", borderRadius: "2px", background: getHeatColor(val), position: "relative", ...(ri === TOOLTIP_DAY && ci === TOOLTIP_HOUR ? { outline: "1.5px solid #3b82f6", outlineOffset: "-1px", zIndex: 2 } : {}) }} />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Tooltip */}
                <div style={{ position: "absolute", top: `${16 + TOOLTIP_DAY * 15 - 38}px`, left: `${30 + (TOOLTIP_HOUR * 4.16)}%`, transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "6px 10px", borderRadius: "8px", fontSize: "10px", zIndex: 10, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", pointerEvents: "none" }}>
                  <div style={{ fontWeight: 600, marginBottom: "2px" }}>Qui às 15h</div>
                  <div style={{ color: "#60a5fa" }}>34 acessos</div>
                  <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)", width: "8px", height: "8px", background: "#1e293b" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "9.5px", color: "#888" }}>
                  <span>Menos</span>
                  {[0, 1, 2, 4, 6, 8, 9].map((v, i) => (
                    <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: getHeatColor(v) }} />
                  ))}
                  <span>Mais</span>
                </div>
                <span style={{ fontSize: "11px", color: "#555", fontWeight: 600 }}>Total de acessos: 2.264</span>
              </div>
            </div>
          </div>

          {/* Three column: Top 10, Modalidade, Tempo Médio */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            {/* Top 10 */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>Top 10 | Mais vendidos</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>Produtos mais vendidos no período</div>
                </div>
              </div>
              {[
                { name: "Big salada", qty: "15x", value: "R$ 330,00", pct: "18%", w: "100%", color: "#22c55e" },
                { name: "Especial de bacon", qty: "12x", value: "R$ 315,00", pct: "17%", w: "88%", color: "#22c55e" },
                { name: "Dog Duplo", qty: "12x", value: "R$ 144,00", pct: "8%", w: "65%", color: "#f97316" },
              ].map((p, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#333" }}>{p.name} <span style={{ color: "#999" }}>({p.qty})</span></span>
                    <span><strong>{p.value}</strong> <span style={{ color: "#999" }}>{p.pct}</span></span>
                  </div>
                  <div style={{ height: "7px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: p.w, background: p.color, borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pedidos por Modalidade */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>Pedidos por Modalidade</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>Distribuição por tipo de entrega</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Delivery</div>
                  <div style={{ fontSize: "30px", fontWeight: 700 }}>94%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#888" }}>Retirada</div>
                  <div style={{ fontSize: "30px", fontWeight: 700 }}>6%</div>
                </div>
              </div>
              <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                <div style={{ width: "94%", background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: "5px 0 0 5px" }} />
                <div style={{ width: "6%", background: "#38bdf8", borderRadius: "0 5px 5px 0" }} />
              </div>
            </div>

            {/* Tempo Médio */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>Tempo Médio</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>Tempo médio de preparo (aceito → pronto)</div>
                </div>
              </div>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "30px", fontWeight: 700 }}>49</span>
                <span style={{ fontSize: "16px", color: "#888", marginLeft: "4px" }}>min</span>
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>25 pedidos no período</div>
              <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: 500 }}>↘ 53 min mais rápido que mês passado</div>
              <svg width="100%" height="45" viewBox="0 0 200 45" style={{ marginTop: "10px" }}>
                <path d="M0,35 C20,33 40,30 60,28 C80,26 100,22 120,18 C140,14 160,20 180,25 C190,28 200,30 200,30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
