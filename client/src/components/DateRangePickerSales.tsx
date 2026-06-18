import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DateRangePickerSalesProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
  triggerClassName?: string;
  showPresetLabel?: boolean;
  triggerLabel?: string;
  triggerIcon?: "calendar" | "sliders";
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function toYMD(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayYMD() {
  const now = new Date();
  return toYMD(now.getFullYear(), now.getMonth(), now.getDate());
}

function subtractDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - days);
  return toYMD(d.getFullYear(), d.getMonth(), d.getDate());
}

type PresetKey = "today" | "yesterday" | "7days" | "30days" | "thisYear" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7days", label: "Últimos 7 dias" },
  { key: "30days", label: "30 dias" },
  { key: "thisYear", label: "Este ano" },
  { key: "custom", label: "Personalizado" },
];

function getPresetRange(key: PresetKey): { start: string; end: string } | null {
  const today = todayYMD();
  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const yesterday = subtractDays(today, 1);
      return { start: yesterday, end: yesterday };
    }
    case "7days":
      return { start: subtractDays(today, 6), end: today };
    case "30days":
      return { start: subtractDays(today, 29), end: today };
    case "thisYear": {
      const now = new Date();
      const yearStart = `${now.getFullYear()}-01-01`;
      return { start: yearStart, end: today };
    }
    case "custom":
      return null;
  }
}

function detectPreset(start: string, end: string): PresetKey {
  for (const p of PRESETS) {
    if (p.key === "custom") continue;
    const range = getPresetRange(p.key);
    if (range && range.start === start && range.end === end) return p.key;
  }
  return "custom";
}

export function DateRangePickerSales({ startDate, endDate, onApply, triggerClassName, showPresetLabel, triggerLabel, triggerIcon = "calendar" }: DateRangePickerSalesProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>(() => detectPreset(startDate, endDate));
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selStart, setSelStart] = useState(startDate);
  const [selEnd, setSelEnd] = useState(endDate);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close on click outside (desktop only)
  useEffect(() => {
    if (!open || isMobile) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, isMobile]);

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open, isMobile]);

  // Sync when props change
  useEffect(() => {
    setSelStart(startDate);
    setSelEnd(endDate);
    setActivePreset(detectPreset(startDate, endDate));
  }, [startDate, endDate]);

  // When opening, navigate calendar to start date month
  useEffect(() => {
    if (open && selStart) {
      const [y, m] = selStart.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [open]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  const paddingDays = Array.from({ length: firstDay }, (_, i) => prevMonthDays - firstDay + 1 + i);
  const totalCells = firstDay + daysInMonth;
  const nextPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  function prevMonthNav() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonthNav() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function handlePreset(key: PresetKey) {
    setActivePreset(key);
    if (key !== "custom") {
      const range = getPresetRange(key);
      if (range) {
        setSelStart(range.start);
        setSelEnd(range.end);
      }
    } else {
      setSelectingEnd(false);
    }
  }

  function handleDayClick(day: number) {
    const dateStr = toYMD(viewYear, viewMonth, day);
    setActivePreset("custom");
    if (!selectingEnd || !selStart) {
      setSelStart(dateStr);
      setSelEnd("");
      setSelectingEnd(true);
    } else {
      if (dateStr < selStart) {
        setSelStart(dateStr);
        setSelEnd(selStart);
      } else {
        setSelEnd(dateStr);
      }
      setSelectingEnd(false);
    }
  }

  function handleApply() {
    if (selStart && selEnd) {
      onApply(selStart, selEnd);
      setOpen(false);
    }
  }

  function handleClear() {
    const today = todayYMD();
    setSelStart(today);
    setSelEnd(today);
    setActivePreset("today");
    setSelectingEnd(false);
  }

  function isInRange(day: number) {
    if (!selStart || !selEnd) return false;
    const d = toYMD(viewYear, viewMonth, day);
    return d >= selStart && d <= selEnd;
  }

  function isRangeStart(day: number) {
    return toYMD(viewYear, viewMonth, day) === selStart;
  }

  function isRangeEnd(day: number) {
    return toYMD(viewYear, viewMonth, day) === selEnd;
  }

  function isTodayDay(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }

  const canApply = selStart && selEnd;

  // Calendar content (shared between mobile and desktop)
  const calendarContent = (
    <>
      {/* Date range display */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <div className={cn(
          "flex-1 px-2.5 py-1.5 rounded-lg border text-center",
          selStart ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium" : "border-gray-200 dark:border-gray-700 text-gray-400"
        )}>
          {selStart ? formatDateBR(selStart) : "Início"}
        </div>
        <span className="text-gray-400">-</span>
        <div className={cn(
          "flex-1 px-2.5 py-1.5 rounded-lg border text-center",
          selEnd ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium" : "border-gray-200 dark:border-gray-700 text-gray-400"
        )}>
          {selEnd ? formatDateBR(selEnd) : "Fim"}
        </div>
        {(selStart || selEnd) && (
          <button type="button" onClick={handleClear} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonthNav} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonthNav} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[10px] font-medium text-gray-400 dark:text-gray-500 text-center py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Previous month padding */}
        {paddingDays.map((d, i) => (
          <div key={`prev-${i}`} className="text-center py-1">
            <span className="text-xs text-gray-300 dark:text-gray-600">{d}</span>
          </div>
        ))}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const inRange = isInRange(day);
          const rangeStart = isRangeStart(day);
          const rangeEnd = isRangeEnd(day);
          const todayD = isTodayDay(day);

          return (
            <div
              key={day}
              className={cn(
                "text-center py-0.5",
                inRange && !rangeStart && !rangeEnd && "bg-red-50 dark:bg-red-950/20",
                rangeStart && selEnd && "bg-gradient-to-r from-transparent to-red-50 dark:to-red-950/20 rounded-l-full",
                rangeEnd && selStart && "bg-gradient-to-l from-transparent to-red-50 dark:to-red-950/20 rounded-r-full",
                rangeStart && rangeEnd && "bg-transparent"
              )}
            >
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                  "w-8 h-8 sm:w-7 sm:h-7 rounded-full text-xs font-medium transition-colors",
                  (rangeStart || rangeEnd)
                    ? "bg-red-500 text-white shadow-sm"
                    : inRange
                    ? "text-red-500 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/30"
                    : todayD
                    ? "bg-gray-100 dark:bg-gray-800 text-red-500 dark:text-red-400 font-bold ring-1 ring-red-300 dark:ring-red-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {day}
              </button>
            </div>
          );
        })}

        {/* Next month padding */}
        {Array.from({ length: nextPadding }, (_, i) => i + 1).map(d => (
          <div key={`next-${d}`} className="text-center py-1">
            <span className="text-xs text-gray-300 dark:text-gray-600">{d}</span>
          </div>
        ))}
      </div>

      {/* Footer: Clear + Apply */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "text-sm px-3 py-1.5 rounded-lg transition-colors",
            "text-gray-400 dark:text-gray-500",
            canApply && "hover:text-gray-600 dark:hover:text-gray-300"
          )}
          disabled={!canApply}
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply}
          className={cn(
            "text-sm font-semibold px-5 py-2 rounded-lg transition-colors",
            canApply
              ? "bg-red-500 text-white hover:bg-red-500"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          )}
        >
          Filtrar
        </button>
      </div>
    </>
  );

  // Mobile bottom sheet (portal to body)
  const mobileSheet = open && isMobile ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-end" style={{ touchAction: 'none', overscrollBehavior: 'contain' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={() => setOpen(false)}
        onTouchMove={(e) => e.preventDefault()}
      />
      
      {/* Bottom Sheet */}
      <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 overscroll-contain" style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        {/* Header - estilo vermelho igual ao checkout */}
        <div className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 rounded-t-2xl flex items-center" style={{height: '56px', paddingTop: '10px', paddingBottom: '10px'}}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Filtrar período</h2>
                <p className="text-xs text-white/80">Selecione o intervalo de datas</p>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Presets as horizontal chips */}
        <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700 px-4 py-3 gap-2 flex-shrink-0" style={{backgroundColor: '#f9fafb'}}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm rounded-lg transition-colors flex-shrink-0 font-medium",
                activePreset === p.key
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-500"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {calendarContent}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // Desktop popover
  const desktopPopover = open && !isMobile ? (
    <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200 flex flex-row overflow-hidden">
      {/* Presets sidebar */}
      <div className="w-[130px] border-r border-gray-200 dark:border-gray-700 py-3 flex flex-col gap-0.5">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => handlePreset(p.key)}
            className={cn(
              "text-left px-4 py-2 text-sm transition-colors",
              activePreset === p.key
                ? "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="p-4 w-[290px]">
        {calendarContent}
      </div>
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={triggerClassName || "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 hover:bg-muted/70 px-2.5 py-1.5 rounded-lg border border-border/40"}
      >
        {triggerIcon === "sliders" ? <SlidersHorizontal className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
        {triggerLabel ? (
          <span>{triggerLabel}</span>
        ) : showPresetLabel && (activePreset === "today" || activePreset === "yesterday" || activePreset === "7days") ? (
          <span>{PRESETS.find(p => p.key === activePreset)?.label}</span>
        ) : (
          <>
            <span>{formatDateBR(startDate)}</span>
            <span className="text-muted-foreground/60">-</span>
            <span>{formatDateBR(endDate)}</span>
          </>
        )}
      </button>

      {/* Desktop popover (inline) */}
      {desktopPopover}

      {/* Mobile bottom sheet (portal) */}
      {mobileSheet}
    </div>
  );
}
