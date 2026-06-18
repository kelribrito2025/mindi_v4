import React, { useEffect } from "react";

// Static demo dashboard page 2 - scrolled view with detailed analytics
// Pixel perfect replica for landing page iframe carousel

// ─── SVG Icon Components (same as DemoDashboard1 for consistency) ──────
function IconGrid({ color = "#ef4444", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function IconMonitor() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
}
function IconMapaMesas() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>;
}
function IconPedidos() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>;
}
function IconEntregadores() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>;
}
function IconMenu() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function IconEstoque() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
}
function IconFinancas() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>;
}
function IconRelatorios() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>;
}
function IconStories() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" /><path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 4" /><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>;
}
function IconCupons() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>;
}
function IconCampanhas() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
}
function IconFidelizacao() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}

const SIDEBAR_ICONS: Record<string, () => React.ReactElement> = {
  "Dashboard": () => <IconGrid color="#ef4444" size={18} />,
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
    { label: "Mapa de mesas", hasArrow: true },
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

const TOP_PRODUCTS = [
  { name: "Big salada", qty: "15x", value: "R$ 330,00", pct: "18%", w: "100%", color: "#22c55e" },
  { name: "Especial de bacon", qty: "12x", value: "R$ 315,00", pct: "17%", w: "88%", color: "#22c55e" },
  { name: "Dog Duplo", qty: "12x", value: "R$ 144,00", pct: "8%", w: "65%", color: "#f97316" },
  { name: "LANCHE DO DIA", qty: "11x", value: "R$ 220,00", pct: "12%", w: "55%", color: "#f97316" },
  { name: "Dog bacon", qty: "8x", value: "R$ 170,20", pct: "9%", w: "45%", color: "#f97316" },
  { name: "Big tudo", qty: "8x", value: "R$ 274,20", pct: "15%", w: "40%", color: "#f97316" },
  { name: "Big frango", qty: "6x", value: "R$ 149,40", pct: "8%", w: "35%", color: "#f97316" },
];

const RECENT_ORDERS = [
  { id: "#P16", item: "Especial de bacon", time: "11h 9min", value: "R$ 26,00" },
  { id: "#P15", item: "Moda da casa +1", time: "11h 48min", value: "R$ 37,00" },
  { id: "#P14", item: "Big EGG +1", time: "11h 58min", value: "R$ 34,40" },
  { id: "#P13", item: "Especial de bacon", time: "12h 4min", value: "R$ 59,00" },
  { id: "#P12", item: "Dog Duplo", time: "12h 27min", value: "R$ 12,00" },
];

const s = {
  card: { background: "#fff", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" } as React.CSSProperties,
  sectionTitle: { fontSize: "10px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.5px", textTransform: "uppercase" as const, padding: "14px 16px 6px" } as React.CSSProperties,
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

export default function DemoDashboard2({ embedded = false }: { embedded?: boolean }) {
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
      {/* ─── Sidebar (same as DemoDashboard1) ─── */}
      <aside style={{ width: "210px", minWidth: "210px", background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Logo / Brand - aligned with topbar height */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", borderBottom: "1px solid #f0f0f0", minHeight: "48px" }}>
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
        <header style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 24px", display: "flex", alignItems: "center", gap: "12px", minHeight: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #e5e5e8", borderRadius: "10px", padding: "7px 14px", width: "260px" }}>
            <IconSearch />
            <span style={{ color: "#aaa", fontSize: "12px" }}>Buscar produtos, pedidos...</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 600, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              49min
            </span>
            <span style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 600, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Ver menu
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            <div style={{ width: "30px", height: "16px", background: "#ef4444", borderRadius: "8px", position: "relative", cursor: "pointer" }}>
              <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", right: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
            </div>
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

        {/* Dashboard Content - Scrolled View */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {/* Three column: Top 10, Modalidade+Perfil, Tempo+Faturamento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>
            {/* Top 10 Mais vendidos */}
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
              {TOP_PRODUCTS.map((p, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#333" }}>{p.name} <span style={{ color: "#999" }}>({p.qty})</span></span>
                    <span><strong>{p.value}</strong> <span style={{ color: "#999" }}>{p.pct}</span></span>
                  </div>
                  <div style={{ height: "7px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: p.w, background: p.color, borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: "10px", color: "#999", marginTop: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>ⓘ</span> Seus 10 produtos líderes representam 60% do faturamento do período
              </div>
            </div>

            {/* Pedidos por Modalidade + Perfil de Clientes */}
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

              {/* Perfil de Clientes */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Perfil de Clientes</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>Últimos 30 dias</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "30px", fontWeight: 700 }}>16%</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>Clientes Recorrentes</div>
                    <div style={{ fontSize: "10px", color: "#999" }}>2+ pedidos nos últimos 30 dias</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "30px", fontWeight: 700 }}>84%</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>Clientes Novos</div>
                    <div style={{ fontSize: "10px", color: "#999" }}>Primeiro pedido no período</div>
                  </div>
                </div>
                {/* Mini bar chart */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "32px", marginBottom: "6px" }}>
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} style={{ flex: 1, height: `${i < 5 ? 75 + (i * 5) : 15 + (i % 3) * 8}%`, background: i < 5 ? "#22c55e" : "#e5e7eb", borderRadius: "1px" }} />
                  ))}
                </div>
                <div style={{ fontSize: "11px", color: "#888" }}>269 clientes únicos no período</div>
              </div>
            </div>

            {/* Tempo Médio + Faturamento por Hora */}
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
              <svg width="100%" height="45" viewBox="0 0 200 45" style={{ marginTop: "8px" }}>
                <path d="M0,35 C20,33 40,30 60,28 C80,26 100,22 120,18 C140,14 160,20 180,25 C190,28 200,30 200,30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              </svg>

              {/* Faturamento por Hora */}
              <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Faturamento por Hora</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>Distribuição de vendas ao longo do dia</div>
                  </div>
                </div>
                {/* Y axis + Area chart */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "80px", paddingRight: "4px" }}>
                    <span style={{ fontSize: "8px", color: "#999" }}>800</span>
                    <span style={{ fontSize: "8px", color: "#999" }}>600</span>
                    <span style={{ fontSize: "8px", color: "#999" }}>400</span>
                    <span style={{ fontSize: "8px", color: "#999" }}>200</span>
                    <span style={{ fontSize: "8px", color: "#999" }}>0</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path d="M0,75 L25,70 L50,65 L75,50 L100,20 L115,8 L130,5 L150,15 L170,30 L185,55 L200,70 L200,80 L0,80 Z" fill="url(#areaGrad2)" />
                      <path d="M0,75 L25,70 L50,65 L75,50 L100,20 L115,8 L130,5 L150,15 L170,30 L185,55 L200,70" fill="none" stroke="#f97316" strokeWidth="2" />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                      {["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map(t => (
                        <span key={t} style={{ fontSize: "8px", color: "#999" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two column: Pedidos 7 dias + Pedidos Recentes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Pedidos Últimos 7 dias */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14h6" /><path d="M9 18h6" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Pedidos | Últimos 7 dias</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>Análise de pedidos finalizados</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["7d", "14d", "30d"].map((p, i) => (
                    <button key={p} style={{ padding: "4px 12px", borderRadius: "8px", border: "1px solid #e5e5e5", background: i === 0 ? "#eff2f5" : "#fff", color: i === 0 ? "#333" : "#999", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px", textTransform: "uppercase" }}>TOTAL DO PERÍODO</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "26px", fontWeight: 700 }}>86</span>
                    <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>↗ +10%</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#888" }}>pedidos finalizados</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>anterior: 78</div>
                </div>
                <div>
                  <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px", textTransform: "uppercase" }}>MÉDIA DIÁRIA</div>
                  <div style={{ fontSize: "26px", fontWeight: 700 }}>12</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>pedidos/dia</div>
                </div>
                <div>
                  <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px", textTransform: "uppercase" }}>MELHOR DIA</div>
                  <div style={{ fontSize: "26px", fontWeight: 700 }}>16</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>sexta-feira</div>
                </div>
              </div>
              {/* Line chart with area */}
              <svg width="100%" height="85" viewBox="0 0 250 85">
                <defs>
                  <linearGradient id="lineGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="40" x2="250" y2="40" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                <path d="M0,50 L35,45 L70,35 L105,30 L140,38 L175,25 L210,30 L250,28 L250,80 L0,80 Z" fill="url(#lineGrad2)" />
                <path d="M0,50 L35,45 L70,35 L105,30 L140,38 L175,25 L210,30 L250,28" fill="none" stroke="#ef4444" strokeWidth="2" />
                <circle cx="35" cy="45" r="3" fill="#ef4444" />
                <circle cx="70" cy="35" r="3" fill="#ef4444" />
                <circle cx="105" cy="30" r="3" fill="#ef4444" />
                <circle cx="175" cy="25" r="3" fill="#ef4444" />
                <circle cx="250" cy="28" r="3" fill="#ef4444" />
              </svg>
            </div>

            {/* Pedidos Recentes */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Pedidos Recentes</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>Últimos pedidos do estabelecimento</div>
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>Ver todos →</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px" }}>PEDIDO</th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px" }}>ITEM</th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px" }}>TEMPO</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "9.5px", fontWeight: 600, color: "#888", letterSpacing: "0.4px" }}>VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map((order, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8f8f8" }}>
                      <td style={{ padding: "10px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: i < 3 ? "#1a1a2e" : "#ccc" }} />
                          <span style={{ fontWeight: 600 }}>{order.id}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 0", color: "#555" }}>{order.item}</td>
                      <td style={{ padding: "10px 0", color: "#888" }}>{order.time}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>{order.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Floating chat button */}
      <div style={{ position: "fixed", bottom: "16px", right: "16px", width: "48px", height: "48px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.4)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
    </div>
  );
}
