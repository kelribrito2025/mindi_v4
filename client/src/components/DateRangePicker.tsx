import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function DateRangePicker({ startDate, endDate, onApply, onCancel, open, onOpenChange }: DateRangePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setSelecting("start");
      if (startDate) {
        const [y, m] = startDate.split("-").map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [open, startDate, endDate]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange]);

  if (!open) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Previous month days for padding
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  const paddingDays = Array.from({ length: firstDay }, (_, i) => prevMonthDays - firstDay + 1 + i);

  // Next month days for padding
  const totalCells = firstDay + daysInMonth;
  const nextPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function handleDayClick(day: number) {
    const dateStr = toYMD(viewYear, viewMonth, day);
    if (selecting === "start") {
      setTempStart(dateStr);
      // If new start is after current end, reset end
      if (tempEnd && dateStr > tempEnd) {
        setTempEnd("");
      }
      setSelecting("end");
    } else {
      if (dateStr < tempStart) {
        // If end is before start, swap
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
      setSelecting("start");
    }
  }

  function handleToday() {
    const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
    setTempStart(todayStr);
    setTempEnd(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function handleApply() {
    if (tempStart && tempEnd) {
      onApply(tempStart, tempEnd);
      onOpenChange(false);
    }
  }

  function handleCancel() {
    onCancel();
    onOpenChange(false);
  }

  function isInRange(day: number) {
    if (!tempStart || !tempEnd) return false;
    const d = toYMD(viewYear, viewMonth, day);
    return d >= tempStart && d <= tempEnd;
  }

  function isStart(day: number) {
    return toYMD(viewYear, viewMonth, day) === tempStart;
  }

  function isEnd(day: number) {
    return toYMD(viewYear, viewMonth, day) === tempEnd;
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
      {/* Header: Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Date display + Today button */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSelecting("start")}
          className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-center ${
            selecting === "start" ? "border-red-400 bg-red-50 text-red-500 font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tempStart ? formatDateBR(tempStart) : "Início"}
        </button>
        <span className="text-xs text-gray-400 self-center">—</span>
        <button
          onClick={() => setSelecting("end")}
          className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-center ${
            selecting === "end" ? "border-red-400 bg-red-50 text-red-500 font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tempEnd ? formatDateBR(tempEnd) : "Fim"}
        </button>
        <button
          onClick={handleToday}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[10px] font-medium text-gray-400 text-center py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Previous month padding */}
        {paddingDays.map((d, i) => (
          <div key={`prev-${i}`} className="text-center py-1.5">
            <span className="text-xs text-gray-300">{d}</span>
          </div>
        ))}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const todayDay = isToday(day);

          return (
            <div
              key={day}
              className={`text-center py-1 ${inRange && !start && !end ? "bg-red-50" : ""} ${start ? "bg-red-50 rounded-l-full" : ""} ${end ? "bg-red-50 rounded-r-full" : ""}`}
            >
              <button
                onClick={() => handleDayClick(day)}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                  start || end
                    ? "bg-red-500 text-white shadow-sm"
                    : todayDay
                    ? "bg-gray-100 text-red-500 font-bold ring-1 ring-red-300"
                    : inRange
                    ? "text-red-500 hover:bg-red-100"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}

        {/* Next month padding */}
        {Array.from({ length: nextPadding }, (_, i) => i + 1).map(d => (
          <div key={`next-${d}`} className="text-center py-1.5">
            <span className="text-xs text-gray-300">{d}</span>
          </div>
        ))}
      </div>

      {/* Footer: Cancel / Apply */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleCancel}
          className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={!tempStart || !tempEnd}
          className="flex-1 text-xs py-2 rounded-lg bg-red-500 text-white hover:bg-red-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
