import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface WeeklyRevenueCardProps {
  thisWeek: number[];
  lastWeek: number[];
  thisWeekTotal: number;
  lastWeekTotal: number;
  loading?: boolean;
  periodLabel?: string;
  comparisonLabel?: string;
  mode?: 'daily' | 'monthly';
  currentIndex?: number;
  monthLabels?: string[];
}

const DAYS_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function WeeklyRevenueCard({
  thisWeek,
  lastWeek,
  thisWeekTotal,
  lastWeekTotal,
  loading = false,
  periodLabel = "Esta semana",
  comparisonLabel = "Semana passada",
  mode = "daily",
  currentIndex,
  monthLabels,
}: WeeklyRevenueCardProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [useShortLabels, setUseShortLabels] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Responsive: detect container width to switch between full/short day names
  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setUseShortLabels(entry.contentRect.width < 420);
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine labels based on mode and container width
  const labels = useMemo(() => {
    if (mode === 'monthly' && monthLabels) return monthLabels;
    return useShortLabels ? DAYS_SHORT : DAYS_FULL;
  }, [mode, monthLabels, useShortLabels]);

  // Calculate percentage change
  const percentChange = useMemo(() => {
    if (lastWeekTotal === 0) return thisWeekTotal > 0 ? 100 : 0;
    return ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  }, [thisWeekTotal, lastWeekTotal]);

  // Get max value for scaling bars
  const maxValue = useMemo(() => {
    const allValues = [...thisWeek, ...(mode === 'daily' ? lastWeek : [])];
    return Math.max(...allValues, 1);
  }, [thisWeek, lastWeek, mode]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Get current index
  const todayIndex = useMemo(() => {
    if (currentIndex !== undefined) return currentIndex;
    if (mode === 'daily') {
      const day = new Date().getDay();
      return day === 0 ? 6 : day - 1;
    }
    return -1;
  }, [mode, currentIndex]);

  // Dynamic title based on mode
  const title = useMemo(() => {
    if (mode === 'monthly') return 'Acumulado do mês';
    return 'Acumulado da semana';
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === 'monthly') return 'Faturamento dos últimos 6 meses';
    return 'Faturamento por dia';
  }, [mode]);

  // For monthly mode, hide comparison toggle (no per-bar comparison)
  const showToggle = mode === 'daily';

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="skeleton h-6 w-28 rounded-md" />
        </div>
        <div className="flex items-center gap-2 mb-5">
          <div className="skeleton h-8 w-28 rounded-md" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="skeleton w-full rounded-md" style={{ height: `${30 + Math.random() * 70}%` }} />
              <div className="skeleton h-3 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        {/* Toggle - only for daily mode */}
        {showToggle && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowComparison(false)}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                !showComparison ? "text-emerald-600 font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "w-2.5 h-2.5 rounded-full",
                !showComparison ? "bg-emerald-500" : "bg-muted-foreground/30 dark:bg-muted-foreground/70"
              )} />
              {periodLabel}
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                showComparison ? "text-muted-foreground dark:text-muted-foreground/60 font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "w-2.5 h-2.5 rounded-full",
                showComparison ? "bg-muted-foreground/50" : "bg-muted-foreground/30 dark:bg-muted-foreground/70"
              )} />
              {comparisonLabel}
            </button>
          </div>
        )}
      </div>

      {/* Total and Delta */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(showComparison ? lastWeekTotal : thisWeekTotal)}
        </span>
        {!showComparison && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium",
              percentChange >= 0
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-400"
            )}
          >
            {percentChange >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {percentChange >= 0 ? "+" : ""}
            {percentChange.toFixed(0)}%
          </span>
        )}
        {mode === 'monthly' && (
          <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
        )}
      </div>

      {/* Bar Chart */}
      <div ref={chartRef} className="relative flex-1 flex flex-col justify-end">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32">
          {labels.map((label, index) => {
            const value = thisWeek[index] || 0;
            const compValue = lastWeek[index] || 0;
            const currentValue = showComparison ? compValue : value;
            const comparisonValue = showComparison ? value : compValue;
            
            const currentHeight = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
            const comparisonHeight = maxValue > 0 ? (comparisonValue / maxValue) * 100 : 0;
            
            const isCurrentItem = index === todayIndex && !showComparison;
            const isFutureItem = mode === 'daily' && index > todayIndex && todayIndex >= 0 && !showComparison;

            return (
              <div
                key={label}
                className="flex-1 flex flex-col items-center gap-1.5 relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bars container */}
                <div className="relative w-full h-24 flex items-end justify-center">
                  {/* Ghost bar (comparison) - only for daily mode */}
                  {mode === 'daily' && (
                    <div
                      className={cn(
                        "absolute bottom-0 w-full rounded-lg transition-colors duration-300",
                        showComparison ? "bg-emerald-200/50 dark:bg-emerald-500/20" : "bg-muted-foreground/20 dark:bg-muted-foreground/80"
                      )}
                      style={{ height: `${Math.max(comparisonHeight, 4)}%` }}
                    />
                  )}
                  
                  {/* Main bar */}
                  <div
                    className={cn(
                      "relative w-full rounded-lg transition-colors duration-300 cursor-pointer",
                      mode === 'monthly'
                        ? isCurrentItem
                          ? "bg-emerald-500"
                          : "bg-emerald-300 dark:bg-emerald-600"
                        : showComparison
                          ? "bg-muted-foreground/50 dark:bg-muted/500"
                          : isFutureItem
                            ? "bg-muted-foreground/20 dark:bg-muted-foreground/80"
                            : "bg-emerald-500",
                      isCurrentItem && mode === 'daily' && "ring-2 ring-emerald-300 dark:ring-emerald-600 ring-offset-2 ring-offset-card"
                    )}
                    style={{ height: `${Math.max(currentHeight, 4)}%` }}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrentItem ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>

                {/* Tooltip */}
                {hoveredIndex === index && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-800 text-white px-2 py-1.5 rounded-md shadow-lg text-xs whitespace-nowrap">
                    {mode === 'monthly' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{label}:</span>
                        <span className="font-semibold">{formatCurrency(value)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{showComparison ? comparisonLabel : periodLabel}:</span>
                          <span className="font-semibold">{formatCurrency(currentValue)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                          <span>{showComparison ? periodLabel : comparisonLabel}:</span>
                          <span className="font-semibold">{formatCurrency(comparisonValue)}</span>
                        </div>
                      </>
                    )}
                    {/* Arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-800 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
