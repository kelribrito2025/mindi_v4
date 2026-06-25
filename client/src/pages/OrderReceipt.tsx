import { trpc } from "@/lib/trpc";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useParams } from "wouter";

const RECEIPT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* ============================================================ */
  /* RESET COMPLETO                                               */
  /* ============================================================ */
  .receipt-page,
  .receipt-page *::before,
  .receipt-page *::after,
  .receipt-page * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* ============================================================ */
  /* VARIÁVEIS DE DESIGN — IDENTIDADE MINDI                       */
  /* ============================================================ */
  .receipt-page {
    /* === Cores Primárias Mindi === */
    --mindi-red: #ef4444;
    --mindi-red-dark: #ef4444;
    --mindi-red-light: #fef2f2;
    --mindi-red-100: #fee2e2;
    --mindi-red-200: #fecaca;
    --mindi-red-500: #ef4444;

    /* === Neutros === */
    --white: #ffffff;
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;

    /* === Cores Semânticas === */
    --success: #16a34a;
    --success-bg: #dcfce7;
    --success-dark: #166534;
    --warning-bg: #fffbeb;
    --warning-border: #fde68a;
    --warning-text: #92400e;
    --info-bg: #eff6ff;
    --info-border: #bfdbfe;
    --info-text: #1e40af;

    /* === Dimensões do Card === */
    --card-max-width: 420px;
    --card-min-width: 320px;
    --card-border-left: 5px;

    /* === Tipografia === */
    --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-xs: 10px;
    --font-size-sm: 11px;
    --font-size-base: 12px;
    --font-size-md: 13px;
    --font-size-lg: 14px;
    --font-size-xl: 16px;
    --font-size-2xl: 18px;
    --font-size-3xl: 20px;

    /* === Espaçamento === */
    --space-2xs: 2px;
    --space-xs: 4px;
    --space-sm: 6px;
    --space-md: 8px;
    --space-lg: 10px;
    --space-xl: 12px;
    --space-2xl: 14px;
    --space-3xl: 16px;
    --space-4xl: 20px;
    --space-5xl: 24px;
    --space-6xl: 32px;

    /* === Border Radius === */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 10px;
    --radius-xl: 12px;
    --radius-2xl: 16px;
    --radius-full: 9999px;

    /* === Sombras === */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.08);
    --shadow-red: 0 2px 8px rgba(239, 68, 68, 0.18);

    font-family: var(--font-family);
    background-color: #fff7f7;
    color: var(--gray-800);
    line-height: 1.5;
    min-height: 100vh;
    padding: 0 var(--space-3xl) var(--space-4xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .receipt-page::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url('https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/chat-bg-option3-dXq5isMUuMCqTpaKJbbZwr.webp');
    background-size: 400px auto;
    background-repeat: repeat;
    opacity: 0.16;
    pointer-events: none;
    z-index: 0;
  }

  .receipt-page > * {
    position: relative;
    z-index: 1;
  }

  /* ============================================================ */
  /* TOP BAR — LOGO MINDI                                         */
  /* ============================================================ */
  .receipt-page .receipt-topbar {
    width: calc(100% + (var(--space-3xl) * 2));
    min-height: 55.1px;
    margin: 0 calc(var(--space-3xl) * -1) var(--space-xl);
    padding: 10.83px var(--space-3xl);
    background: var(--white);
    border-bottom: 1px solid rgba(239, 68, 68, 0.10);
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.05);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: sticky;
    top: 0;
    z-index: 50;
    box-sizing: border-box;
  }

  .receipt-page .receipt-topbar-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 33.25px;
    padding: 0 8px;
    border-radius: var(--radius-full);
    text-decoration: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .receipt-page .receipt-topbar-link:hover {
    opacity: 0.78;
    transform: translateY(-1px);
  }

  .receipt-page .receipt-topbar-link:focus-visible {
    outline: 2px solid var(--mindi-red);
    outline-offset: 4px;
  }

  .receipt-page .receipt-topbar-logo {
    display: block;
    height: 24.7px;
    width: auto;
    max-width: min(190px, calc(100vw - 3rem));
    object-fit: contain;
  }

  /* ============================================================ */
  /* BARRA SUPERIOR — BOTÃO IMPRIMIR + CARDÁPIO                   */
  /* ============================================================ */
  .receipt-page .print-bar {
    width: 100%;
    max-width: var(--card-max-width);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0;
    margin-bottom: var(--space-3xl);
    position: relative;
    z-index: 2;
  }

  .receipt-page .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-md);
    font-weight: 500;
    color: #000000;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    font-family: var(--font-family);
    cursor: pointer;
    line-height: 1.5;
  }
  .receipt-page .back-link:hover {
    color: #000000;
    background: rgba(0, 0, 0, 0.06);
  }

  .receipt-page .back-link .icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .receipt-page .print-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--mindi-red);
    color: var(--white);
    border: 1px solid var(--mindi-red);
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: var(--font-size-lg);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-red);
    line-height: 1;
  }
  .receipt-page .print-btn:hover {
    background: var(--mindi-red-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.28);
  }
  .receipt-page .print-btn:active {
    transform: translateY(0);
    box-shadow: var(--shadow-red);
  }

  .receipt-page .print-btn .icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ============================================================ */
  /* CARD PRINCIPAL DO PEDIDO                                      */
  /* Largura: 320px - 420px | Altura: auto (cresce com conteúdo)  */
  /* ============================================================ */
  .receipt-page .order-card {
    width: 100%;
    max-width: var(--card-max-width);
    min-width: var(--card-min-width);
    background: var(--white);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border-left: var(--card-border-left) solid var(--mindi-red);
    position: relative;
  }

  /* ============================================================ */
  /* HEADER DO CARD                                                */
  /* Altura: ~72px                                                */
  /* ============================================================ */
  .receipt-page .card-header {
    padding: var(--space-4xl) var(--space-4xl) var(--space-3xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--gray-100);
    min-height: 72px;
  }

  .receipt-page .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-xl);
    flex: 1;
    min-width: 0;
  }

  /* Avatar/Logo — mesmo padrão do perfil: foto com borda branca sutil, sem brilho vermelho */
  .receipt-page .avatar {
    width: 42px;
    height: 42px;
    min-width: 42px;
    min-height: 42px;
    background: linear-gradient(135deg, var(--mindi-red), var(--mindi-red-dark));
    border: 2px solid var(--white);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-weight: 800;
    font-size: 17px;
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
    overflow: hidden;
  }

  /* Se tiver logo do restaurante, usar img dentro do avatar */
  .receipt-page .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-full);
  }

  .receipt-page .header-info {
    min-width: 0;
    flex: 1;
  }

  .receipt-page .restaurant-name {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--gray-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .receipt-page .order-meta {
    font-size: var(--font-size-base);
    color: var(--gray-500);
    margin-top: 2px;
    line-height: 1.3;
  }

  /* Badge de Status — Novo/Confirmado/Pronto */
  .receipt-page .status-badge {
    background: var(--success-bg);
    color: var(--success-dark);
    padding: 5px 12px;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* Variantes do badge */
  .receipt-page .status-badge.pending {
    background: var(--warning-bg);
    color: var(--warning-text);
  }
  .receipt-page .status-badge.confirmed {
    background: var(--info-bg);
    color: var(--info-text);
  }
  .receipt-page .status-badge.ready {
    background: var(--success-bg);
    color: var(--success-dark);
  }

  /* ============================================================ */
  /* CORPO DO CARD                                                 */
  /* ============================================================ */
  .receipt-page .card-body {
    padding: var(--space-4xl);
  }

  /* ============================================================ */
  /* INFO STRIP — Faixa de informações (Cliente/Pagamento/Tipo)   */
  /* Altura: ~60px                                                */
  /* ============================================================ */
  .receipt-page .info-strip {
    display: flex;
    gap: 0;
    margin-bottom: var(--space-4xl);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--gray-200);
  }

  .receipt-page .info-strip-item {
    flex: 1;
    padding: 12px 10px;
    text-align: center;
    border-right: 1px solid var(--gray-200);
    background: var(--gray-50);
    transition: background 0.15s ease;
    min-width: 0;
  }
  .receipt-page .info-strip-item:last-child {
    border-right: none;
  }

  .receipt-page .info-strip-item .label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--gray-400);
    margin-bottom: 3px;
    line-height: 1;
  }

  .receipt-page .info-strip-item .value {
    font-size: var(--font-size-md);
    font-weight: 700;
    color: var(--gray-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  /* ============================================================ */
  /* BARRA DE ENDEREÇO (apenas para delivery)                     */
  /* Altura: ~50px                                                */
  /* ============================================================ */
  .receipt-page .address-bar {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    padding: var(--space-xl) var(--space-2xl);
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4xl);
  }

  .receipt-page .address-bar .pin-icon {
    width: 18px;
    height: 18px;
    min-width: 18px;
    color: var(--mindi-red);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .receipt-page .address-content {
    flex: 1;
    min-width: 0;
  }

  .receipt-page .address-text {
    font-size: var(--font-size-md);
    color: var(--gray-700);
    font-weight: 500;
    line-height: 1.4;
    word-break: break-word;
  }

  .receipt-page .address-ref {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
    margin-top: 2px;
    font-style: italic;
  }

  /* ============================================================ */
  /* LISTA DE ITENS                                                */
  /* ============================================================ */
  .receipt-page .items-list {
    margin-bottom: var(--space-3xl);
  }

  .receipt-page .item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid var(--gray-100);
    gap: var(--space-md);
  }
  .receipt-page .item:first-child {
    padding-top: 0;
  }
  .receipt-page .item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .receipt-page .item-left {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xl);
    flex: 1;
    min-width: 0;
  }

  /* Badge de Quantidade — 26x26px */
  .receipt-page .item-qty {
    background: var(--mindi-red-light);
    color: var(--mindi-red);
    width: 26px;
    height: 26px;
    min-width: 26px;
    min-height: 26px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: 700;
    flex-shrink: 0;
    border: 1px solid var(--mindi-red-200);
    line-height: 1;
  }

  .receipt-page .item-info {
    min-width: 0;
    flex: 1;
  }

  .receipt-page .item-name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-800);
    line-height: 1.3;
  }

  .receipt-page .item-complements {
    font-size: var(--font-size-base);
    color: var(--gray-500);
    margin-top: 2px;
    line-height: 1.4;
  }

  .receipt-page .item-observation {
    font-size: var(--font-size-sm);
    color: var(--gray-400);
    font-style: italic;
    margin-top: 4px;
    padding-left: 8px;
    border-left: 2px solid var(--gray-200);
    line-height: 1.4;
  }

  .receipt-page .item-price {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-800);
    white-space: nowrap;
    flex-shrink: 0;
    line-height: 1.3;
    margin-top: 1px;
  }

  /* ============================================================ */
  /* TOTAIS / RESUMO FINANCEIRO                                    */
  /* ============================================================ */
  .receipt-page .totals {
    background: var(--gray-50);
    border-radius: var(--radius-xl);
    padding: var(--space-3xl);
    border: 1px solid var(--gray-100);
  }

  .receipt-page .totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-md);
    padding: 4px 0;
    color: var(--gray-600);
    line-height: 1.4;
  }

  .receipt-page .totals-row .label {
    font-weight: 400;
  }

  .receipt-page .totals-row .value {
    font-weight: 500;
  }

  .receipt-page .totals-row .discount {
    color: var(--success);
    font-weight: 600;
  }

  /* Linha do TOTAL FINAL */
  .receipt-page .totals-row.final {
    font-size: var(--font-size-2xl);
    font-weight: 800;
    color: var(--gray-900);
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid var(--mindi-red);
  }
  .receipt-page .totals-row.final .label {
    font-weight: 800;
  }
  .receipt-page .totals-row.final .value {
    font-weight: 800;
    color: var(--gray-900);
  }

  /* ============================================================ */
  /* TROCO (apenas para pagamento em dinheiro)                     */
  /* ============================================================ */
  .receipt-page .change-info {
    margin-top: var(--space-3xl);
    padding: 10px 14px;
    background: var(--mindi-red-light);
    border: 1px solid var(--mindi-red-200);
    border-radius: var(--radius-md);
    font-size: var(--font-size-md);
    color: var(--mindi-red-dark);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.4;
  }

  .receipt-page .change-info .icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* ============================================================ */
  /* OBSERVAÇÃO GERAL DO PEDIDO                                    */
  /* ============================================================ */
  .receipt-page .order-observation {
    margin-top: var(--space-3xl);
    padding: 12px 14px;
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-md);
    color: var(--warning-text);
  }

  .receipt-page .obs-label {
    font-weight: 700;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.3;
  }

  .receipt-page .obs-label .icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .receipt-page .obs-text {
    line-height: 1.4;
    font-weight: 400;
  }

  /* ============================================================ */
  /* FOOTER DO CARD                                                */
  /* Altura: ~50px                                                */
  /* ============================================================ */
  .receipt-page .card-footer {
    text-align: center;
    padding: var(--space-3xl) var(--space-4xl) var(--space-4xl);
    border-top: 1px solid var(--gray-100);
  }

  .receipt-page .footer-link {
    font-size: var(--font-size-base);
    color: var(--gray-400);
    font-weight: 500;
    line-height: 1.3;
  }

  .receipt-page .footer-powered {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    color: var(--gray-400);
    margin-top: 4px;
    line-height: 1.3;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .receipt-page .footer-powered:hover {
    color: var(--gray-600);
  }
  .receipt-page .footer-powered strong {
    color: var(--mindi-red);
    font-weight: 700;
  }

  /* ============================================================ */
  /* RESPONSIVO                                                    */
  /* ============================================================ */

  /* Tablets e telas médias */
  @media (max-width: 480px) {
    .receipt-page {
      padding: 0 var(--space-md) var(--space-xl);
    }

    .receipt-page .receipt-topbar {
      width: calc(100% + (var(--space-md) * 2));
      margin: 0 calc(var(--space-md) * -1) var(--space-lg);
      padding: 11.4px var(--space-md);
    }

    .receipt-page .order-card {
      border-radius: var(--radius-xl);
      min-width: auto;
    }

    .receipt-page .card-header {
      padding: var(--space-3xl) var(--space-3xl) var(--space-xl);
    }

    .receipt-page .card-body {
      padding: var(--space-3xl);
    }

    .receipt-page .restaurant-name {
      font-size: 15px;
    }

    .receipt-page .avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      min-height: 38px;
      font-size: 15px;
    }

    .receipt-page .info-strip-item {
      padding: 10px 8px;
    }
    .receipt-page .info-strip-item .value {
      font-size: var(--font-size-base);
    }
  }

  /* Telas muito pequenas (< 360px) */
  @media (max-width: 360px) {
    .receipt-page .info-strip {
      flex-wrap: wrap;
    }
    .receipt-page .info-strip-item {
      flex: 1 1 calc(50% - 1px);
      border-bottom: 1px solid var(--gray-200);
    }
    .receipt-page .info-strip-item:nth-child(2) {
      border-right: none;
    }
    .receipt-page .info-strip-item:last-child {
      border-bottom: none;
    }

    .receipt-page .card-header {
      flex-wrap: wrap;
      gap: var(--space-md);
    }

    .receipt-page .status-badge {
      margin-left: 54px;
    }
  }

  /* ============================================================ */
  /* ESTILOS DE IMPRESSÃO                                          */
  /* ============================================================ */
  @media print {
    /* Esconder elementos não-imprimíveis */
    .receipt-page .no-print {
      display: none !important;
    }

    .receipt-page {
      background: var(--white);
      padding: 0;
      min-height: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page::before {
      display: none;
    }

    .receipt-page .order-card {
      box-shadow: none;
      border-radius: 0;
      max-width: 100%;
      min-width: auto;
      border-left: 4px solid var(--mindi-red);
    }

    .receipt-page .card-header {
      padding: 12px 16px 10px;
    }

    .receipt-page .card-body {
      padding: 12px 16px;
    }

    .receipt-page .card-footer {
      padding: 10px 16px 12px;
    }

    .receipt-page .info-strip-item {
      background: var(--white) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page .item-qty {
      border: 1px solid var(--mindi-red) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page .totals {
      border: 1px solid var(--gray-300) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page .status-badge {
      border: 1px solid currentColor !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page .address-bar {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Configuração da página */
    @page {
      size: auto;
      margin: 6mm;
    }
  }

  /* Otimização para impressora térmica 80mm */
  @media print and (max-width: 80mm) {
    .receipt-page .order-card {
      border-left-width: 3px;
    }

    .receipt-page .card-header {
      padding: 8px 10px;
    }

    .receipt-page .card-body {
      padding: 8px 10px;
    }

    .receipt-page .restaurant-name {
      font-size: 14px;
    }

    .receipt-page .item-name {
      font-size: 12px;
    }

    .receipt-page .totals-row.final {
      font-size: 16px;
    }
  }

  .receipt-error-page,
  .receipt-loading-page {
    min-height: 100vh;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
`;

type ReceiptComplement = {
  name: string;
  price?: string | number;
  quantity?: number;
  isIncluded?: boolean;
  groupType?: string;
};

type ReceiptItem = {
  id?: number;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  complements?: ReceiptComplement[] | string | null;
  notes?: string | null;
};

function money(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function paymentLabel(method?: string | null) {
  switch (method) {
    case "cash": return "Dinheiro";
    case "card": return "Cartão";
    case "pix": return "PIX";
    case "boleto": return "Boleto";
    case "card_online": return "Cartão online";
    case "pix_online": return "PIX QR Code";
    default: return "Não informado";
  }
}

function deliveryLabel(type?: string | null) {
  switch (type) {
    case "delivery": return "Entrega";
    case "pickup": return "Retirada";
    case "dine_in": return "Mesa";
    default: return "Pedido";
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "pending_confirmation": return "Pendente";
    case "new": return "Novo";
    case "preparing": return "Preparo";
    case "ready": return "Pronto";
    case "out_for_delivery": return "Entrega";
    case "completed": return "Concluído";
    case "cancelled": return "Cancelado";
    case "scheduled": return "Agendado";
    default: return "Novo";
  }
}

function statusClassName(status?: string | null) {
  switch (status) {
    case "pending_confirmation":
    case "scheduled":
      return "status-badge pending";
    case "preparing":
    case "out_for_delivery":
      return "status-badge confirmed";
    case "ready":
    case "completed":
    case "new":
    default:
      return "status-badge ready";
  }
}

function firstInitial(name?: string | null) {
  const trimmed = String(name || "M").trim();
  return (trimmed[0] || "M").toUpperCase();
}

function numericValue(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeComplements(complements: ReceiptItem["complements"]): ReceiptComplement[] {
  if (!complements) return [];
  if (Array.isArray(complements)) return complements;
  try {
    const parsed = JSON.parse(complements);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function complementText(complements: ReceiptComplement[]) {
  return complements
    .map((complement) => {
      const quantity = complement.quantity || 1;
      return `+ ${quantity > 1 ? `${quantity}x ` : ""}${complement.name}`;
    })
    .join(", ");
}

function formatDisplayOrderNumber(orderNumber: string | number | null | undefined) {
  const normalized = String(orderNumber ?? "").trim();
  if (!normalized) return "#";
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function getEstablishmentLogo(establishment: unknown) {
  const data = establishment as Record<string, unknown> | null | undefined;
  const candidates = [data?.logoUrl, data?.logo, data?.imageUrl, data?.profileImageUrl, data?.avatarUrl];
  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0) || "";
}

function getEstablishmentMenuSlug(establishment: unknown) {
  const data = establishment as Record<string, unknown> | null | undefined;
  const candidates = [data?.menuSlug, data?.slug];
  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

function isMobilePrintContext() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isIpadOS = navigator.platform === "MacIntel" && maxTouchPoints > 1;

  return isIpadOS || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
}

function printMobileOrderWithThermalTemplate(receiptUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.id = "thermal-receipt-print-frame";
  iframe.title = "Impressão térmica do pedido";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  let didPrint = false;
  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 8000);
  };

  iframe.onload = () => {
    if (didPrint) return;
    didPrint = true;

    window.setTimeout(() => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        cleanup();
        return;
      }

      printWindow.focus();
      printWindow.onafterprint = cleanup;
      printWindow.print();
      window.setTimeout(cleanup, 15000);
    }, 800);
  };

  iframe.onerror = cleanup;
  iframe.src = receiptUrl;
  document.body.appendChild(iframe);
}

function printOrderWithThermalTemplate(orderId: number) {
  if (!Number.isFinite(orderId) || orderId <= 0) return;

  const receiptUrl = `/api/print/receipt/${encodeURIComponent(String(orderId))}`;
  const existingFrame = document.getElementById("thermal-receipt-print-frame");
  existingFrame?.remove();

  if (isMobilePrintContext()) {
    printMobileOrderWithThermalTemplate(receiptUrl);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = "thermal-receipt-print-frame";
  iframe.title = "Impressão térmica do pedido";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  let didPrint = false;
  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1200);
  };

  iframe.onload = () => {
    if (didPrint) return;
    didPrint = true;

    window.setTimeout(() => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        cleanup();
        return;
      }

      printWindow.focus();
      printWindow.onafterprint = cleanup;
      printWindow.print();
      window.setTimeout(cleanup, 5000);
    }, 350);
  };

  iframe.onerror = cleanup;
  iframe.src = receiptUrl;
  document.body.appendChild(iframe);
}

export default function OrderReceipt() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const hasToken = token.length > 0;

  const accessQuery = trpc.publicMenu.getOrderReceiptAccess.useQuery(
    { orderId },
    { enabled: Number.isFinite(orderId) && orderId > 0 && !hasToken, retry: false }
  );

  useEffect(() => {
    if (!hasToken && accessQuery.data?.receiptUrl) {
      window.location.replace(accessQuery.data.receiptUrl);
    }
  }, [hasToken, accessQuery.data?.receiptUrl]);

  const query = trpc.publicMenu.getOrderReceipt.useQuery(
    { orderId, token },
    { enabled: Number.isFinite(orderId) && orderId > 0 && hasToken, retry: false }
  );

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return <ReceiptError title="Link inválido" message="Não foi possível identificar o pedido deste recibo." />;
  }

  if (!hasToken) {
    if (accessQuery.error) {
      return <ReceiptError title="Recibo indisponível" message={accessQuery.error.message || "Não foi possível preparar este recibo."} />;
    }

    return (
      <main className="receipt-loading-page">
        <style>{RECEIPT_STYLES}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#374151", fontSize: 14, fontWeight: 600 }}>
          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
          Preparando recibo do pedido...
        </div>
      </main>
    );
  }

  if (query.isLoading) {
    return (
      <main className="receipt-loading-page">
        <style>{RECEIPT_STYLES}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#374151", fontSize: 14, fontWeight: 600 }}>
          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
          Carregando recibo do pedido...
        </div>
      </main>
    );
  }

  if (query.error || !query.data) {
    return <ReceiptError title="Recibo indisponível" message={query.error?.message || "Não foi possível carregar este recibo."} />;
  }

  const { order, items, establishment } = query.data;
  const receiptItems = items as ReceiptItem[];
  const orderNumber = order.orderNumber || order.id;
  const deliveryFee = numericValue(order.deliveryFee);
  const discount = numericValue(order.discount);
  const changeAmount = numericValue(order.changeAmount);
  const isDelivery = order.deliveryType === "delivery";
  const hasAddress = isDelivery && Boolean(order.customerAddress);
  const logoUrl = getEstablishmentLogo(establishment);
  const menuSlug = getEstablishmentMenuSlug(establishment);
  const openEstablishmentMenu = () => {
    if (menuSlug) {
      window.location.href = `/menu/${encodeURIComponent(menuSlug)}`;
      return;
    }

    window.history.back();
  };

  return (
    <main className="receipt-page">
      <style>{RECEIPT_STYLES}</style>

      {/* ========================================================== */}
      {/* TOP BAR — Logo Mindi alinhado à esquerda                     */}
      {/* ========================================================== */}
      <div className="receipt-topbar no-print" role="banner">
        <a
          className="receipt-topbar-link"
          href="https://www.mindi.com.br"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir a landing page da Mindi em uma nova janela"
        >
          <img
            className="receipt-topbar-logo"
            src="/assets/mindi-login-logo-light.png"
            alt="Mindi"
          />
        </a>
      </div>

      {/* ========================================================== */}
      {/* BARRA SUPERIOR — Cardápio + Imprimir (esconde na impressão) */}
      {/* ========================================================== */}
      <div className="print-bar no-print">
        <button type="button" className="back-link" onClick={openEstablishmentMenu}>
          <span className="icon">
            <ArrowLeftIcon />
          </span>
          Cardápio
        </button>

        <button type="button" className="print-btn" onClick={() => printOrderWithThermalTemplate(orderId)}>
          <span className="icon">
            <PrinterIcon />
          </span>
          Imprimir Pedido
        </button>
      </div>

      {/* ========================================================== */}
      {/* CARD PRINCIPAL DO PEDIDO                                    */}
      {/* ========================================================== */}
      <div className="order-card">
        {/* ======================================================== */}
        {/* HEADER — Logo + Nome + Código + Badge Status              */}
        {/* ======================================================== */}
        <div className="card-header">
          <div className="header-left">
            <div className="avatar">
              {logoUrl ? <img loading="lazy" src={logoUrl} alt="Logo" /> : firstInitial(establishment?.name)}
            </div>
            <div className="header-info">
              <div className="restaurant-name">{establishment?.name || "Restaurante"}</div>
              <div className="order-meta">{formatDisplayOrderNumber(orderNumber)} • {formatDate(order.createdAt)}</div>
            </div>
          </div>

          <div className={statusClassName(order.status)}>{statusLabel(order.status)}</div>
        </div>

        {/* ======================================================== */}
        {/* CORPO DO CARD                                             */}
        {/* ======================================================== */}
        <div className="card-body">
          {/* ====================================================== */}
          {/* INFO STRIP — Informações rápidas em 3 colunas           */}
          {/* ====================================================== */}
          <div className="info-strip">
            <InfoStripItem label="☆" value={order.customerName || "—"} />
            <InfoStripItem label="Pagamento" value={paymentLabel(order.paymentMethod)} />
            <InfoStripItem label="Tipo" value={deliveryLabel(order.deliveryType)} />
          </div>

          {/* ====================================================== */}
          {/* ENDEREÇO (mostrar APENAS quando tipo = Entrega)         */}
          {/* ====================================================== */}
          {hasAddress && (
            <div className="address-bar">
              <MapPinIcon />
              <div className="address-content">
                <div className="address-text">{order.customerAddress}</div>
                {order.customerPhone && <div className="address-ref">Tel: {order.customerPhone}</div>}
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* LISTA DE ITENS DO PEDIDO                                */}
          {/* ====================================================== */}
          <div className="items-list">
            {receiptItems.map((item) => {
              const complements = normalizeComplements(item.complements);
              const complementsLabel = complementText(complements);
              return (
                <div key={item.id || `${item.productName}-${item.quantity}`} className="item">
                  <div className="item-left">
                    <div className="item-qty">{item.quantity}</div>
                    <div className="item-info">
                      <div className="item-name">{item.productName}</div>
                      {complementsLabel && <div className="item-complements">{complementsLabel}</div>}
                      {item.notes && <div className="item-observation">{item.notes}</div>}
                    </div>
                  </div>
                  <div className="item-price">{money(item.totalPrice)}</div>
                </div>
              );
            })}
          </div>

          {/* ====================================================== */}
          {/* TOTAIS / RESUMO FINANCEIRO                              */}
          {/* ====================================================== */}
          <div className="totals">
            <TotalRow label="Subtotal" value={money(order.subtotal)} />
            {deliveryFee > 0 && <TotalRow label="Taxa de entrega" value={money(order.deliveryFee)} />}
            {discount > 0 && (
              <div className="totals-row">
                <span className="label">Desconto{order.couponCode ? ` (cupom ${order.couponCode})` : ""}</span>
                <span className="value discount">-{money(order.discount)}</span>
              </div>
            )}
            <div className="totals-row final">
              <span className="label">Total</span>
              <span className="value">{money(order.total)}</span>
            </div>
          </div>

          {/* ====================================================== */}
          {/* TROCO (mostrar APENAS quando pagamento = Dinheiro)      */}
          {/* ====================================================== */}
          {order.paymentMethod === "cash" && changeAmount > 0 && (
            <div className="change-info">
              <span className="icon">
                <MoneyIcon />
              </span>
              Troco para: {money(order.changeAmount)}
            </div>
          )}

          {/* ====================================================== */}
          {/* OBSERVAÇÃO GERAL (mostrar APENAS se cliente informou)   */}
          {/* ====================================================== */}
          {order.notes && (
            <div className="order-observation">
              <div className="obs-label">
                <span className="icon">
                  <EditIcon />
                </span>
                Observação:
              </div>
              <div className="obs-text">{order.notes}</div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FOOTER — Powered by www.mindi.com.br                       */}
        {/* ======================================================== */}
        <div className="card-footer">
          <a className="footer-powered" href="https://www.mindi.com.br" target="_blank" rel="noopener noreferrer">
            <span>Powered by</span>
            <strong>www.mindi.com.br</strong>
          </a>
        </div>
      </div>
    </main>
  );
}

function InfoStripItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="info-strip-item">
      <div className="label">{label}</div>
      <div className="value">{value || "—"}</div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="totals-row">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
      <circle cx="18" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="pin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2 10h2M20 10h2M2 14h2M20 14h2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ReceiptError({ title, message }: { title: string; message: string }) {
  return (
    <main className="receipt-error-page">
      <style>{RECEIPT_STYLES}</style>
      <div style={{ maxWidth: 420, borderRadius: 16, border: "1px solid #fecaca", background: "white", padding: 24, textAlign: "center", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.07)" }}>
        <div style={{ margin: "0 auto", display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 9999, background: "#fef2f2", color: "#ef4444" }}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 style={{ marginTop: 16, fontSize: 20, fontWeight: 800, color: "#111827" }}>{title}</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>{message}</p>
      </div>
    </main>
  );
}
