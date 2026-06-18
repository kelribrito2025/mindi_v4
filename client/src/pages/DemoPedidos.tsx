import React, { useEffect } from "react";

// ─── SVG Icon Components (same as DemoDashboard1) ──────────────────

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IconMapaMesas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function IconPedidos({ color = "#ef4444" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function IconPedidosOutline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  );
}

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

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconEstoque() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}

function IconFinancas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function IconRelatorios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  );
}

function IconStories() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
      <path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 4" />
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function IconCupons() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  );
}

function IconCampanhas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

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

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366" stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function IconClock({ color = "#999", size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPrinter({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconCheckCircle({ size = 14, color = "#10b981" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconCancel({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
  );
}

// ─── Sidebar config (same as DemoDashboard1 but Pedidos is active) ───

const SIDEBAR_ICONS: Record<string, () => React.ReactElement> = {
  "Dashboard": IconDashboard,
  "Frente de Caixa": IconMonitor,
  "Mapa de mesas": IconMapaMesas,
  "Pedidos": () => <IconPedidos color="#ef4444" />,
  "Entregadores": IconEntregadores,
  "Menu": IconMenu,
  "Estoque": IconEstoque,
  "Finanças": IconFinancas,
  "Relatórios": IconRelatorios,
  "Stories": IconStories,
  "Cupons": IconCupons,
  "Campanhas": IconCampanhas,
  "Fidelização": IconFidelizacao,
  "Integrações": () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /><path d="M9 1v3" /><path d="M15 1v3" /><path d="M9 20v3" /><path d="M15 20v3" /><path d="M20 9h3" /><path d="M20 14h3" /><path d="M1 9h3" /><path d="M1 14h3" /></svg>,
  "Equipe": () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  "Configurações": () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

const SIDEBAR_SECTIONS = [
  { title: "OPERAÇÕES", items: [
    { label: "Dashboard" },
    { label: "Frente de Caixa" },
    { label: "Mapa de mesas" },
  ]},
  { title: "GESTÃO", items: [
    { label: "Pedidos", active: true },
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
  { title: "SISTEMA", items: [
    { label: "Integrações" },
    { label: "Equipe" },
    { label: "Configurações" },
  ]},
];

const s = {
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

// ─── Order Card ───────────────────────────────────────────────────
interface OrderCardProps {
  id: string;
  status: string;
  statusColor: string;
  statusBg: string;
  cardBg: string;
  statusIcon: React.ReactNode;
  time: string;
  name: string;
  payment: string;
  value: string;
  valueColor: string;
  actionLabel?: string;
  actionColor?: string;
  showCancel?: boolean;
  isCompleted?: boolean;
}

function OrderCard({ id, status, statusColor, statusBg, cardBg, statusIcon, time, name, payment, value, valueColor, actionLabel, actionColor, showCancel = false, isCompleted = false }: OrderCardProps) {
  return (
    <div style={{ background: cardBg, borderRadius: "14px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Header row: icon + id + time */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: statusBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {statusIcon}
          </div>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>#{id}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
          <IconClock color="#999" size={12} />
          <span style={{ fontSize: "11px", color: "#999" }}>{time}</span>
        </div>
      </div>
      {/* Status badge */}
      <div style={{ marginBottom: "10px", paddingLeft: "38px" }}>
        <span style={{ background: statusColor, color: "#fff", fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{status}</span>
      </div>
      {/* Customer + payment + value */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <span style={{ fontSize: "10px", color: "#ccc" }}>•</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            <span style={{ fontSize: "11px", color: "#777" }}>{payment}</span>
          </span>
        </div>
        <span style={{ fontSize: "15px", fontWeight: 700, color: valueColor }}>{value}</span>
      </div>
      {/* Actions row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <IconPrinter size={14} />
        </div>
        <button style={{ flex: actionLabel ? 0 : 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "7px 16px", fontSize: "11px", fontWeight: 500, color: "#555", cursor: "pointer", whiteSpace: "nowrap" as const }}>Ver detalhes</button>
        {actionLabel && (
          <button style={{ flex: 1, background: actionColor, color: "#fff", border: "none", borderRadius: "20px", padding: "7px 16px", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>{actionLabel}</button>
        )}
        {showCancel && (
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <IconCancel size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function DemoPedidos({ embedded = false }: { embedded?: boolean }) {
  useEffect(() => {
    if (embedded) return;
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.body.style.overflow = ""; document.body.style.margin = ""; document.body.style.padding = ""; };
  }, [embedded]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "12px", color: "#1a1a2e", background: "#f7f8fa", display: "flex", height: "100%", overflow: "hidden", lineHeight: 1.4 }}>
      {/* ─── Sidebar (minimized - icons only) ─── */}
      <aside style={{ width: "56px", minWidth: "56px", background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden", alignItems: "center" }}>
        {/* Hamburger icon */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f0f0f0", minHeight: "46px", width: "100%" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </div>
        {/* Menu icons */}
        <div style={{ flex: 1, overflow: "hidden", paddingTop: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "100%" }}>
          {SIDEBAR_SECTIONS.map((section, sIdx) => (
            <React.Fragment key={section.title}>
              {section.title === "SISTEMA" && (
                <div style={{ width: "32px", height: "1px", background: "#e5e5e5", margin: "6px 0" }} />
              )}
              {section.items.map((item) => {
                const IconComp = SIDEBAR_ICONS[item.label];
                return (
                  <div key={item.label} style={{ width: "40px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: item.active ? "#fef2f2" : "transparent", cursor: "pointer" }}>
                    {IconComp ? <IconComp /> : <span style={{ color: "#777" }}>•</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar (same as DemoDashboard1) */}
        <header style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 20px", display: "flex", alignItems: "center", gap: "12px", minHeight: "46px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #e5e5e8", borderRadius: "10px", padding: "6px 14px", width: "240px" }}>
            <IconSearch />
            <span style={{ color: "#aaa", fontSize: "12px" }}>Buscar produtos, pedidos...</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "14px", fontSize: "10.5px", fontWeight: 600, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "4px" }}>
              <IconClock color="#16a34a" size={11} />
              1min
            </span>
            <span style={{ background: "#fef2f2", color: "#ef4444", padding: "3px 10px", borderRadius: "14px", fontSize: "10.5px", fontWeight: 600, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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

        {/* ─── Pedidos Content ─── */}
        <div style={{ flex: 1, overflow: "hidden", padding: "18px 22px 0 22px", display: "flex", flexDirection: "column" }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
                <IconPedidos color="#2563eb" />
                <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#1a1a2e" }}>Pedidos</h1>
              </div>
              <p style={{ color: "#999", fontSize: "12px", margin: 0 }}>Gerencie os pedidos do seu estabelecimento</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <IconSettings />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "#eff2f5", borderRadius: "12px", padding: "3px" }}>
                <button style={{ background: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", color: "#111", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  Kanban
                </button>
                <button style={{ background: "none", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", color: "#9ca3af", fontWeight: 500, display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  Lista
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "5px 14px 5px 10px" }}>
                <IconWhatsApp />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#333" }}>Conectado</span>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><path d="m2 2 20 20" /><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10 10 0 0 1 22 12c0 1.3-.2 2.5-.6 3.6" /><path d="M2 12a10 10 0 0 0 8.27 9.85" /></svg>
            </div>
          </div>

          {/* ─── Kanban Board ─── */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px 12px", overflow: "hidden" }}>

            {/* NOVOS */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ borderTop: "3px solid #3b82f6", background: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#555", letterSpacing: "0.5px" }}>NOVOS</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconClock color="#3b82f6" size={13} />
                </div>
              </div>
              <div style={{ background: "#fff", padding: "0 16px 12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e" }}>3</span>
                <span style={{ fontSize: "11px", color: "#999" }}>ativos</span>
              </div>
              <div style={{ flex: 1, background: "#fff", borderRadius: "0", padding: "0 12px 12px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <OrderCard id="P7" status="ENTREGA" statusColor="#3b82f6" statusBg="#dbeafe" cardBg="#f8faff" statusIcon={<IconClock color="#3b82f6" size={14} />} time="24h" name="Alex" payment="Dinheiro" value="R$ 20,00" valueColor="#ef4444" actionLabel="Aceitar" actionColor="#3b82f6" showCancel />
                <OrderCard id="P5" status="ENTREGA" statusColor="#3b82f6" statusBg="#dbeafe" cardBg="#f8faff" statusIcon={<IconClock color="#3b82f6" size={14} />} time="26h" name="Rebeca Linhar..." payment="Cartão" value="R$ 30,00" valueColor="#ef4444" actionLabel="Aceitar" actionColor="#3b82f6" showCancel />
                <OrderCard id="P3" status="ENTREGA" statusColor="#3b82f6" statusBg="#dbeafe" cardBg="#f8faff" statusIcon={<IconClock color="#3b82f6" size={14} />} time="26h" name="Roberta" payment="Pix" value="R$ 17,00" valueColor="#ef4444" actionLabel="Aceitar" actionColor="#3b82f6" showCancel />
              </div>
            </div>

            {/* PREPARO */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ borderTop: "3px solid #ef4444", background: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#555", letterSpacing: "0.5px" }}>PREPARO</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                    <line x1="6" y1="17" x2="18" y2="17" />
                  </svg>
                </div>
              </div>
              <div style={{ background: "#fff", padding: "0 16px 12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e" }}>1</span>
                <span style={{ fontSize: "11px", color: "#999" }}>ativos</span>
              </div>
              <div style={{ flex: 1, background: "#fff", borderRadius: "0", padding: "0 12px 12px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <OrderCard id="P6" status="ENTREGA" statusColor="#ef4444" statusBg="#fee2e2" cardBg="#fff5f5" statusIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></svg>} time="26h" name="Alex" payment="Cartão" value="R$ 32,00" valueColor="#ef4444" actionLabel="Pronto" actionColor="#10b981" showCancel />
              </div>
            </div>

            {/* PRONTOS */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ borderTop: "3px solid #10b981", background: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#555", letterSpacing: "0.5px" }}>PRONTOS</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
                  </svg>
                </div>
              </div>
              <div style={{ background: "#fff", padding: "0 16px 12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e" }}>2</span>
                <span style={{ fontSize: "11px", color: "#999" }}>ativos</span>
              </div>
              <div style={{ flex: 1, background: "#fff", borderRadius: "0", padding: "0 12px 12px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <OrderCard id="P4" status="ENTREGA" statusColor="#10b981" statusBg="#d1fae5" cardBg="#f0fdf4" statusIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>} time="26h" name="Grazi" payment="Cartão" value="R$ 30,00" valueColor="#ef4444" actionLabel="Entregador" actionColor="#10b981" showCancel />
                <OrderCard id="P2" status="ENTREGA" statusColor="#10b981" statusBg="#d1fae5" cardBg="#f0fdf4" statusIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>} time="26h" name="Ana" payment="Dinheiro" value="R$ 62,00" valueColor="#ef4444" actionLabel="Entregador" actionColor="#10b981" showCancel />
              </div>
            </div>

            {/* COMPLETOS */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ borderTop: "3px solid #9ca3af", background: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#555", letterSpacing: "0.5px" }}>COMPLETOS</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconCheckCircle color="#6b7280" size={13} />
                </div>
              </div>
              <div style={{ background: "#fff", padding: "0 16px 12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e" }}>1</span>
                <span style={{ fontSize: "11px", color: "#999" }}>ativos</span>
              </div>
              <div style={{ flex: 1, background: "#fff", borderRadius: "0", padding: "0 12px 12px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                <OrderCard id="P1" status="ENTREGUE" statusColor="#9ca3af" statusBg="#f3f4f6" cardBg="#fafafa" statusIcon={<IconCheckCircle color="#6b7280" size={14} />} time="26h" name="Lucas Almeida" payment="Dinheiro" value="R$ 20,00" valueColor="#6b7280" isCompleted showCancel={false} />
              </div>
            </div>

          </div>
        </div>
      </main>


    </div>
  );
}
