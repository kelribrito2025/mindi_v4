import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
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

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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
    if (minDate && dateStr < minDate) return;
    onChange(dateStr);
    setOpen(false);
  }

  function handleToday() {
    const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
    if (minDate && todayStr < minDate) return;
    onChange(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  }

  function isSelected(day: number) {
    return toYMD(viewYear, viewMonth, day) === value;
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }

  function isDisabled(day: number) {
    if (!minDate) return false;
    return toYMD(viewYear, viewMonth, day) < minDate;
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button - same style as Relatórios */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 w-full h-10 rounded-xl border px-3 text-sm transition-colors ${
          value
            ? "border-red-400 bg-red-50 text-red-500 font-medium"
            : "border-gray-200 text-gray-500 hover:bg-gray-50"
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span>{value ? formatDateBR(value) : "Selecione uma data"}</span>
      </button>

      {/* Popover calendar - exact same visual as DateRangePicker */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header: Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Date display + Today button */}
          <div className="flex gap-2 mb-3">
            <div
              className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border text-center ${
                value ? "border-red-400 bg-red-50 text-red-500 font-medium" : "border-gray-200 text-gray-400"
              }`}
            >
              {value ? formatDateBR(value) : "Selecione uma data"}
            </div>
            <button
              type="button"
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
              const selected = isSelected(day);
              const todayDay = isToday(day);
              const disabled = isDisabled(day);

              return (
                <div key={day} className="text-center py-1">
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    disabled={disabled}
                    className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? "bg-red-500 text-white shadow-sm"
                        : disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : todayDay
                        ? "bg-gray-100 text-red-500 font-bold ring-1 ring-red-300"
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
        </div>
      )}
    </div>
  );
}
