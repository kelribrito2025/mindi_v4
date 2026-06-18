/**
 * Card de Performance Semanal — Identidade Visual Mindi
 *
 * Segue a linguagem visual do sistema:
 *   - Cor primária vermelha (--primary)
 *   - Fonte Inter (global)
 *   - border-t-4 no topo (padrão StatCard)
 *   - bg-card rounded-xl border border-border/50
 *   - Emerald para variações positivas, red para negativas
 *   - Dot colorido ao lado dos valores
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, ShoppingBag, Receipt, Target, Lock } from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────
interface DiaData {
  dia: string;
  valor: number;
  pedidos: number;
  fechado?: boolean;
}

interface PerformanceSemanalProps {
  periodo: string;
  faturamento: number;
  pedidos: number;
  ticketMedio: number;
  meta: number | null;
  metaAtingida: number;
  varFaturamento: number;
  varPedidos: number;
  varTicket: number;
  melhorDia: string;
  melhorDiaValor: number;
  diasSemana: DiaData[];
  isProPlan?: boolean;
  onDefineGoal?: () => void;
  onUpgradePlan?: () => void;
  onClose?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────
function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value >= 0;
  const isNeutral = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isNeutral
          ? "text-muted-foreground"
          : isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      <span className="text-[11px]">{isNeutral ? "—" : isPositive ? "↑" : "↓"}</span>
      <span>{isNeutral ? "0%" : `${Math.abs(value)}%`}</span>
      {label && <span className="text-muted-foreground font-normal ml-0.5">{label}</span>}
    </span>
  );
}

// ── Componente ───────────────────────────────────────────────
export default function CardPerformanceSemanalV2(props: PerformanceSemanalProps) {
  const {
    periodo,
    faturamento,
    pedidos,
    ticketMedio,
    meta,
    metaAtingida,
    varFaturamento,
    varPedidos,
    varTicket,
    melhorDia,
    melhorDiaValor,
    diasSemana,
    isProPlan = false,
    onDefineGoal,
    onUpgradePlan,
    onClose,
  } = props;

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const maxVal = diasSemana.length > 0 ? Math.max(...diasSemana.map((d) => d.valor)) : 1;

  const handleDefineGoal = () => {
    if (isProPlan) {
      onDefineGoal?.();
      return;
    }

    setShowUpgradePrompt(true);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 border-t-4 border-t-primary overflow-hidden shadow-elevated">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {periodo}
            </p>
            <h3 className="text-lg font-semibold text-foreground mt-0.5">Performance Semanal</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Faturamento total */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(faturamento)}
            </span>
          </div>
          <div className="mt-1.5 ml-[18px]">
            <TrendBadge value={varFaturamento} label="vs semana anterior" />
          </div>
        </div>
      </div>

      {/* ── Separador ─────────────────────────────────────── */}
      <div className="border-t border-border/50" />

      {/* ── Gráfico de Barras Horizontal ───────────────────── */}
      <div className="px-6 py-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Faturamento por dia
        </p>
        <div className="space-y-2">
          {diasSemana.map((d, i) => {
            const width = maxVal > 0 ? (d.valor / maxVal) * 100 : 0;
            const isMax = d.valor === maxVal && d.valor > 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 font-medium">
                  {d.dia}
                </span>
                <div className={`flex-1 h-5 rounded-md overflow-hidden ${
                  d.fechado
                    ? "bg-muted/25 border border-dashed border-muted-foreground/30"
                    : "bg-muted/50"
                }`}>
                  {d.fechado ? (
                    <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(148,163,184,0.18)_5px,rgba(148,163,184,0.18)_10px)]" />
                  ) : (
                    <motion.div
                      className={`h-full rounded-md ${
                        isMax
                          ? "bg-primary"
                          : "bg-primary/20"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.fechado ? (
                    <span className="text-xs font-semibold text-muted-foreground italic text-right min-w-[72px]">
                      Fechado
                    </span>
                  ) : (
                    <>
                      <span
                        className={`text-xs font-semibold text-right ${
                          isMax ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {formatCurrency(d.valor)}
                      </span>
                      <span className="text-[10px] text-muted-foreground w-16">
                        {d.pedidos} {d.pedidos === 1 ? "Pedido" : "Pedidos"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Separador ─────────────────────────────────────── */}
      <div className="border-t border-border/50" />

      {/* ── Métricas ───────────────────────────────────────── */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Pedidos
            </p>
          </div>
          <p className="text-lg font-bold text-foreground">{pedidos}</p>
          <TrendBadge value={varPedidos} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Receipt className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Ticket Médio
            </p>
          </div>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(ticketMedio)}
          </p>
          <TrendBadge value={varTicket} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Melhor Dia
            </p>
          </div>
          <p className="text-lg font-bold text-foreground">{melhorDia}</p>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(melhorDiaValor)}
          </span>
        </div>
      </div>

      {/* ── Separador ─────────────────────────────────────── */}
      <div className="border-t border-border/50" />

      {/* ── Barra de Meta ──────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Meta Semanal
            </span>
          </div>
          {meta !== null ? (
            <span className="text-xs font-semibold text-foreground">
              {metaAtingida.toFixed(0)}%
            </span>
          ) : (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 whitespace-nowrap">
              <span className="text-xs text-muted-foreground italic">
                <span className="sm:hidden">Sem meta</span>
                <span className="hidden sm:inline">Sem meta definida</span>
              </span>
              <button
                type="button"
                onClick={handleDefineGoal}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                Definir meta
              </button>
            </div>
          )}
        </div>
        {meta !== null ? (
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metaAtingida, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        ) : (
          <>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/10 rounded-full w-0" />
            </div>
            {showUpgradePrompt && !isProPlan && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                  <div>
                    <p className="font-semibold">Definição de meta exclusiva do Plano Pro</p>
                    <p className="mt-1 text-xs leading-relaxed text-blue-800 dark:text-blue-200/80">
                      Faça upgrade para criar metas e acompanhar o progresso financeiro semanal com mais precisão.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgradePlan}
                      className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 underline underline-offset-2"
                    >
                      Fazer upgrade
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Botão Fechar ──────────────────────────────────── */}
      {onClose && (
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border-2 border-primary text-primary hover:bg-primary/5 bg-transparent text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar resumo
          </button>
        </div>
      )}
    </div>
  );
}
