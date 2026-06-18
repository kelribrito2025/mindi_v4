import { Eye, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Dias da semana (começando por Domingo como na imagem)
const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAYS_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Horas do dia (8h a 7h do dia seguinte - horário comercial de restaurantes)
const HOURS = Array.from({ length: 24 }, (_, i) => (i + 8) % 24);
// Todas as 24 horas para o gráfico de barras por hora (0h a 23h)
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

// Escala de cores azul (do mais claro ao mais escuro)
const COLOR_SCALE = [
  "bg-blue-50 dark:bg-blue-950/40",      // 0 - sem visualizações
  "bg-blue-100 dark:bg-blue-900/50",     // 1 - muito baixo
  "bg-blue-200 dark:bg-blue-800/60",     // 2 - baixo
  "bg-blue-300 dark:bg-blue-700/70",     // 3 - médio-baixo
  "bg-blue-400 dark:bg-blue-600/80",     // 4 - médio
  "bg-blue-500 dark:bg-blue-500",        // 5 - médio-alto
  "bg-blue-600 dark:bg-blue-400",        // 6 - alto
  "bg-blue-700 dark:bg-blue-300",        // 7 - muito alto
];

// Escala de verde para o dia atual (mesma tonalidade do gráfico Acumulado da semana)
const COLOR_SCALE_TODAY = [
  "bg-emerald-50 dark:bg-emerald-950/40",        // 0 - sem visualizações
  "bg-emerald-100 dark:bg-emerald-900/50",       // 1 - muito baixo
  "bg-emerald-200 dark:bg-emerald-800/60",       // 2 - baixo
  "bg-emerald-300 dark:bg-emerald-700/70",       // 3 - médio-baixo
  "bg-emerald-400 dark:bg-emerald-600/80",       // 4 - médio
  "bg-emerald-500 dark:bg-emerald-500",          // 5 - médio-alto
  "bg-emerald-600 dark:bg-emerald-400",          // 6 - alto
  "bg-emerald-700 dark:bg-emerald-300",          // 7 - muito alto
];

// Função para obter a cor baseada no valor
function getColorClass(value: number, maxValue: number, isToday: boolean = false): string {
  const scale = isToday ? COLOR_SCALE_TODAY : COLOR_SCALE;
  if (value === 0 || maxValue === 0) return scale[0];
  
  const ratio = value / maxValue;
  const index = Math.min(Math.floor(ratio * (scale.length - 1)) + 1, scale.length - 1);
  return scale[index];
}

// Hook para detectar se é dispositivo touch/mobile
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);
  
  return isTouch;
}

type ViewTab = 'day' | 'dayHour' | 'hour';

interface HeatmapCardProps {
  period?: 'today' | 'week' | 'month';
}

export function HeatmapCard({ period = 'today' }: HeatmapCardProps) {
  const heatmapInput = useMemo(() => ({ period }), [period]);
  const { data: heatmapData, isLoading } = trpc.menuViews.getHeatmap.useQuery(heatmapInput);
  const isTouch = useIsTouchDevice();
  
  // Estado para controlar tooltip ativo (apenas para mobile/touch)
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('dayHour');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dia da semana atual (0=Domingo, 1=Segunda, ..., 6=Sábado)
  const todayDayIndex = useMemo(() => new Date().getDay(), []);
  const currentHour = useMemo(() => new Date().getHours(), []);

  // Determinar quais dias da semana já passaram (incluindo hoje)
  const validDaysThisWeek = useMemo(() => {
    const today = todayDayIndex;
    const validSet = new Set<number>();
    const todayMondayBased = today === 0 ? 6 : today - 1;
    
    for (let i = 0; i <= todayMondayBased; i++) {
      const jsDay = i === 6 ? 0 : i + 1;
      validSet.add(jsDay);
    }
    
    return validSet;
  }, [todayDayIndex]);

  // Criar matriz de dados 7x24 — filtrando dias futuros da semana
  const matrix = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    
    if (heatmapData?.data) {
      heatmapData.data.forEach((item: { dayOfWeek: number; hour: number; count: number }) => {
        if (item.dayOfWeek >= 0 && item.dayOfWeek < 7 && item.hour >= 0 && item.hour < 24) {
          if (validDaysThisWeek.has(item.dayOfWeek)) {
            const isFutureHourToday = item.dayOfWeek === todayDayIndex && item.hour > currentHour;
            if (!isFutureHourToday) {
              grid[item.dayOfWeek][item.hour] = item.count;
            }
          }
        }
      });
    }
    
    return grid;
  }, [heatmapData?.data, validDaysThisWeek, todayDayIndex, currentHour]);

  // Dados agregados por dia (soma de todas as horas)
  const dayTotals = useMemo(() => {
    return matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
  }, [matrix]);

  // Dados agregados por hora (soma de todos os dias)
  const hourTotals = useMemo(() => {
    const totals = Array(24).fill(0);
    for (const row of matrix) {
      for (let h = 0; h < 24; h++) {
        totals[h] += row[h];
      }
    }
    return totals;
  }, [matrix]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const row of matrix) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  }, [matrix]);

  const periodViews = heatmapData?.periodViews ?? 0;
  const viewsChange = heatmapData?.viewsChange ?? 0;

  // Period label for the views counter
  const periodViewsLabel = useMemo(() => {
    if (period === 'today') return 'Hoje';
    if (period === 'week') return 'Esta semana';
    return 'Este mês';
  }, [period]);

  const comparisonLabel = useMemo(() => {
    if (period === 'today') return 'vs ontem';
    if (period === 'week') return 'vs semana anterior';
    return 'vs mês anterior';
  }, [period]);

  // Fechar tooltips ao clicar fora (apenas para mobile)
  useEffect(() => {
    if (!isTouch) return;
    
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveCell(null);
        setShowInfoTooltip(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTouch]);

  // Handler para toggle do tooltip da célula (mobile)
  const handleCellClick = (cellKey: string) => {
    if (!isTouch) return;
    setShowInfoTooltip(false);
    setActiveCell(prev => prev === cellKey ? null : cellKey);
  };

  // Handler para toggle do tooltip de info (mobile)
  const handleInfoClick = () => {
    if (!isTouch) return;
    setActiveCell(null);
    setShowInfoTooltip(prev => !prev);
  };

  // Obter label do dia — destaque verde para o dia atual
  const getDayLabel = (dayIndex: number) => {
    if (dayIndex === todayDayIndex) {
      return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{DAYS[dayIndex]}</span>;
    }
    return <span>{DAYS[dayIndex]}</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-4 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div>
            <div className="skeleton h-4 w-28 rounded-md mb-1" />
            <div className="skeleton h-3 w-40 rounded-md" />
          </div>
        </div>
        <div className="skeleton h-48 w-full rounded-lg" />
      </div>
    );
  }

  // ─── Gráfico: Barras horizontais por Dia ───
  const renderDayChart = () => {
    const maxDayTotal = Math.max(...dayTotals, 1);

    return (
      <div className="flex-1 px-1">
        <div className="space-y-1.5">
          {DAYS.map((day, dayIndex) => {
            const total = dayTotals[dayIndex];
            const pct = (total / maxDayTotal) * 100;
            const isToday = dayIndex === todayDayIndex;
            const isHovered = hoveredDay === dayIndex;

            return (
              <div
                key={dayIndex}
                className="flex items-center gap-2 group relative"
                onMouseEnter={() => setHoveredDay(dayIndex)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="w-4 flex-shrink-0 text-[12px] font-medium text-right">
                  {isToday ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{day}</span>
                  ) : (
                    <span className="text-muted-foreground">{day}</span>
                  )}
                </div>
                <div className="flex-1 h-5 bg-muted/30 rounded-sm overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-sm transition-colors duration-300",
                      isToday
                        ? "bg-emerald-500 dark:bg-emerald-500"
                        : "bg-blue-500 dark:bg-blue-500",
                      isHovered && "brightness-110"
                    )}
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
                {/* Tooltip flutuante ao hover */}
                {isHovered && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 bg-gray-900 dark:bg-gray-800 text-white rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap">
                    <div className="font-semibold text-sm">{DAYS_FULL[dayIndex]}</div>
                    <div className="text-xs text-blue-300 mt-0.5">
                      <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1.5" />
                      {total.toLocaleString('pt-BR')} {total === 1 ? 'acesso' : 'acessos'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Gráfico: Barras verticais por Hora ───
  const renderHourChart = () => {
    const displayedHours = period === 'today'
      ? ALL_HOURS.filter((hour) => hour <= currentHour)
      : ALL_HOURS;
    const maxHourTotal = Math.max(...displayedHours.map((hour) => hourTotals[hour]), 1);
    // Mostrar labels a cada 6 horas: 00, 06, 12, 18, 00
    const labelHours = new Set([0, 6, 12, 18]);

    return (
      <div className="flex-1 px-1">
        <div className="flex items-end gap-[2px] h-36">
          {displayedHours.map((hour) => {
            const total = hourTotals[hour];
            const pct = (total / maxHourTotal) * 100;
            const isHovered = hoveredHour === hour;

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center justify-end h-full relative"
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-colors duration-200 bg-blue-500 dark:bg-blue-500",
                    isHovered && "brightness-125 bg-blue-600 dark:bg-blue-400"
                  )}
                  style={{
                    height: `${Math.max(pct, 1)}%`,
                    minHeight: total > 0 ? '3px' : '1px',
                  }}
                />
                {/* Tooltip flutuante */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-20 bg-gray-900 dark:bg-gray-800 text-white rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap">
                    <div className="font-semibold text-sm">{String(hour).padStart(2, '0')}h</div>
                    <div className="text-xs text-blue-300 mt-0.5">
                      {total.toLocaleString('pt-BR')} {total === 1 ? 'acesso' : 'acessos'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Labels das horas */}
        <div className="flex gap-[2px] mt-1">
          {displayedHours.map((hour) => (
            <div key={hour} className="flex-1 text-center">
              {labelHours.has(hour) && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {String(hour).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Gráfico: Heatmap Dia e Hora (existente) ───
  const renderDayHourHeatmap = () => {
    return (
      <>
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header com horas */}
            <div className="flex mb-0.5">
              <div className="w-6 flex-shrink-0 sticky left-0 bg-card z-10" />
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Linhas do grid (dias) */}
            {DAYS.map((day, dayIndex) => {
              const isTodayRow = dayIndex === todayDayIndex;
              
              return (
                <div key={`${day}-${dayIndex}`} className="flex items-center mb-0.5">
                  <div className="w-6 flex-shrink-0 text-[12px] font-medium pr-1 text-right sticky left-0 bg-card z-10">
                    {getDayLabel(dayIndex)}
                  </div>
                  
                  {HOURS.map(hour => {
                    const isFutureHourToday = isTodayRow && hour > currentHour;
                    const count = isFutureHourToday ? 0 : matrix[dayIndex][hour];
                    const colorClass = getColorClass(count, maxCount, isTodayRow);
                    const cellKey = `${dayIndex}-${hour}`;
                    const isActive = activeCell === cellKey;
                    
                    if (isFutureHourToday) {
                      return (
                        <div
                          key={cellKey}
                          className="flex-1 aspect-square rounded-[3px] mx-[1px] bg-muted/20 dark:bg-muted/10 opacity-40 cursor-default"
                          aria-label={`Horário futuro: ${DAYS_FULL[dayIndex]} às ${hour}h`}
                        />
                      );
                    }
                    
                    return (
                      <Tooltip 
                        key={cellKey}
                        open={isTouch ? isActive : undefined}
                      >
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex-1 aspect-square rounded-[3px] mx-[1px] cursor-pointer transition-colors hover:ring-2 hover:ring-blue-600 hover:ring-offset-1 hover:ring-offset-card",
                              colorClass,
                              isActive && "ring-2 ring-blue-600 ring-offset-1",
                              isTodayRow && "today-cell-pulse"
                            )}
                            onClick={() => handleCellClick(cellKey)}
                            onTouchEnd={(e) => {
                              if (isTouch) {
                                e.preventDefault();
                                handleCellClick(cellKey);
                              }
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2"
                        >
                          <div className="text-center">
                            <div className="font-semibold">{isTodayRow ? "Hoje" : DAYS_FULL[dayIndex]} às {hour}h</div>
                            <div className="text-blue-300">{count} {count === 1 ? 'acesso' : 'acessos'}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Menos</span>
            <div className="flex gap-0.5">
              {COLOR_SCALE.map((color, index) => (
                <div
                  key={index}
                  className={cn("w-3.5 h-3.5 rounded-sm", color)}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">Mais</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{(heatmapData?.totalViews ?? 0).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <style>{`
        @keyframes softPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .today-cell-pulse {
          animation: softPulse 2.5s ease-in-out infinite;
        }
      `}</style>
      <div ref={containerRef} className="bg-card rounded-xl border border-border/50 p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Acessos ao Cardápio</h3>
              <p className="text-xs text-muted-foreground">Dias e horários com mais acessos ao seu cardápio</p>
            </div>
          </div>
          
          {/* Ícone de informação */}
          <Tooltip open={isTouch ? showInfoTooltip : undefined}>
            <TooltipTrigger asChild>
              <button 
                className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                onClick={handleInfoClick}
                onTouchEnd={(e) => {
                  if (isTouch) {
                    e.preventDefault();
                    handleInfoClick();
                  }
                }}
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              align="end"
              className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-4 py-3 max-w-[280px]"
            >
              <p className="text-sm leading-relaxed">
                Este gráfico mostra quando os clientes mais acessam seu cardápio. Use esses horários para divulgar ofertas ou reforçar o atendimento.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Period Views Counter with Trend */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-lg font-bold text-foreground">
            {periodViews.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-muted-foreground">{periodViewsLabel}</span>
          {viewsChange !== 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium cursor-default",
                    viewsChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}
                >
                  {viewsChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {viewsChange > 0 ? "+" : ""}{viewsChange}%
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2">
                <p className="text-xs">{viewsChange > 0 ? "+" : ""}{viewsChange}% {comparisonLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground cursor-default">
                  <Minus className="w-3 h-3" />
                  0%
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2">
                <p className="text-xs">Sem variação {comparisonLabel}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Tabs: Dia | Dia e hora | Hora */}
        <div className="flex items-center mb-3 border-b border-border/50">
          {([
            { key: 'day' as ViewTab, label: 'Dia' },
            { key: 'dayHour' as ViewTab, label: 'Dia e hora' },
            { key: 'hour' as ViewTab, label: 'Hora' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 pb-2 text-sm font-medium transition-colors relative text-center",
                activeTab === tab.key
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba ativa */}
        {activeTab === 'day' && renderDayChart()}
        {activeTab === 'dayHour' && renderDayHourHeatmap()}
        {activeTab === 'hour' && renderHourChart()}
      </div>
    </TooltipProvider>
  );
}

export default HeatmapCard;
