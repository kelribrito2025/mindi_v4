/**
 * Card Indicadores de Margem — KPIs em Cards Coloridos
 *
 * Design: Dashboard Analítico Moderno
 * Fonte: DM Sans (Google Fonts)
 * Dependências: framer-motion, lucide-react, Tailwind CSS 4
 */

import { motion } from "framer-motion";
import { PieChart, Percent, CheckCircle, AlertTriangle } from "lucide-react";

// ── Tipagem ──────────────────────────────────────────────────
interface IndicadorMargem {
  label: string;
  desc: string;
  valor: number;       // ex: 59.0 (percentual)
  meta: number;        // ex: 65 (percentual)
  maxScale: number;    // escala máxima da barra (100 ou 50)
  /** true = valor >= meta (ou valor <= meta para CMV) */
  atingiu: boolean;
}

interface IndicadoresMargemProps {
  titulo?: string;
  subtitulo?: string;
  indicadores: IndicadorMargem[];
}

// ── Configuração visual por índice ──────────────────────────
const visualConfig = [
  {
    bgFrom: "from-amber-50",
    bgTo: "to-orange-50/30",
    borderColor: "border-amber-100/50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    barOk: "from-amber-400 to-amber-500",
  },
  {
    bgFrom: "from-emerald-50",
    bgTo: "to-green-50/30",
    borderColor: "border-emerald-100/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    barOk: "from-emerald-400 to-emerald-500",
  },
  {
    bgFrom: "from-blue-50",
    bgTo: "to-indigo-50/30",
    borderColor: "border-blue-100/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    barOk: "from-blue-400 to-blue-500",
  },
];

// ── Componente ──────────────────────────────────────────────
export default function CardIndicadoresMargem({
  titulo = "Indicadores de Margem",
  subtitulo = "Metas do setor de alimentação",
  indicadores,
}: IndicadoresMargemProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">{titulo}</h3>
            <p className="text-xs text-gray-400">{subtitulo}</p>
          </div>
        </div>
      </div>

      {/* KPIs em cards coloridos */}
      <div className="px-6 pb-5 space-y-3">
        {indicadores.map((ind, i) => {
          const vis = visualConfig[i % visualConfig.length];
          return (
            <motion.div
              key={i}
              className={`bg-gradient-to-br ${vis.bgFrom} ${vis.bgTo} rounded-xl p-4 border ${vis.borderColor}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              {/* Label + Valor */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${vis.iconBg} flex items-center justify-center`}>
                    <Percent className={`w-4 h-4 ${vis.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ind.label}</p>
                    <p className="text-[10px] text-gray-500">{ind.desc}</p>
                  </div>
                </div>
                <span
                  className={`text-xl font-bold ${
                    ind.atingiu ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {ind.valor.toFixed(1)}%
                </span>
              </div>

              {/* Barra de progresso com marcador de meta */}
              <div className="relative mb-1">
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      ind.atingiu ? vis.barOk : "from-amber-400 to-amber-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(ind.valor / ind.maxScale) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                  />
                </div>
                {/* Marcador vertical da meta */}
                <div
                  className="absolute top-[-2px] w-0.5 h-[12px] bg-gray-600 rounded-full"
                  style={{ left: `${(ind.meta / ind.maxScale) * 100}%` }}
                />
              </div>

              {/* Status + Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {ind.atingiu ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-medium text-emerald-600">
                        Dentro da meta
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-medium text-amber-600">
                        Abaixo da meta
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">Meta: {ind.meta}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Exemplo de uso ──────────────────────────────────────────
/*
import CardIndicadoresMargem from "./CardIndicadoresMargem";

<CardIndicadoresMargem
  titulo="Indicadores de Margem"
  subtitulo="Metas do setor de alimentação"
  indicadores={[
    {
      label: "Margem Bruta",
      desc: "Receita após CMV",
      valor: 59.0,
      meta: 65,
      maxScale: 100,
      atingiu: false,   // 59% < 65%
    },
    {
      label: "Margem Líquida",
      desc: "Lucro final sobre receita",
      valor: 20.7,
      meta: 15,
      maxScale: 100,
      atingiu: true,    // 20.7% > 15%
    },
    {
      label: "CMV / Receita",
      desc: "Custo de mercadoria vendida",
      valor: 30.0,
      meta: 35,
      maxScale: 50,
      atingiu: true,    // 30% < 35% (quanto menor, melhor)
    },
  ]}
/>
*/
