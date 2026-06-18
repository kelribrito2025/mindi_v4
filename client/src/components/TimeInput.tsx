import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeInputProps {
  value: string; // "HH:MM" format or ""
  onChange: (value: string) => void;
  onComplete?: () => void; // Called when a complete time (HH:MM) is entered, useful for auto-focus to next field
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string; // Used for auto-focus between fields
}

/**
 * TimeInput - Campo de horário com máscara automática HH:MM
 * 
 * Aceita apenas números e formata automaticamente:
 * - "2300" → "23:00"
 * - "900" → "09:00"
 * - "1330" → "13:30"
 * - Valida limite 00:00 até 23:59
 */
export function TimeInput({ value, onChange, onComplete, className, placeholder = "--:--", disabled, id }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value with prop when not focused
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value || "");
    }
  }, [value, isFocused]);

  const formatTimeString = (raw: string): string => {
    // Remove tudo que não é número
    const digits = raw.replace(/\D/g, "");
    
    if (digits.length === 0) return "";
    
    if (digits.length <= 2) {
      // Apenas horas parciais - mostrar com : se tiver 2 dígitos
      if (digits.length === 1) {
        return digits;
      }
      // 2 dígitos: pode ser hora
      const h = parseInt(digits, 10);
      if (h > 23) return "23:";
      return digits + ":";
    }
    
    if (digits.length === 3) {
      // 3 dígitos: pode ser H:MM ou HH:M
      // Tentar HH:M primeiro (ex: 130 → 13:0)
      const h2 = parseInt(digits.substring(0, 2), 10);
      if (h2 <= 23) {
        const m1 = digits.substring(2, 3);
        return `${digits.substring(0, 2)}:${m1}`;
      }
      // Senão H:MM (ex: 900 → 09:00)
      const h1 = parseInt(digits.substring(0, 1), 10);
      const mm = parseInt(digits.substring(1, 3), 10);
      if (mm > 59) return `0${h1}:59`;
      return `0${h1}:${digits.substring(1, 3)}`;
    }
    
    // 4+ dígitos: HH:MM
    const hStr = digits.substring(0, 2);
    const mStr = digits.substring(2, 4);
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const isCompleteTime = (val: string): boolean => {
    return /^\d{2}:\d{2}$/.test(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    
    // Se o usuário está apagando, permitir
    if (rawInput.length < displayValue.length) {
      const digits = rawInput.replace(/\D/g, "");
      if (digits.length === 0) {
        setDisplayValue("");
        onChange("");
        return;
      }
      const formatted = formatTimeString(digits);
      setDisplayValue(formatted);
      if (isCompleteTime(formatted)) {
        onChange(formatted);
      }
      return;
    }
    
    // Formatar o input
    const formatted = formatTimeString(rawInput);
    setDisplayValue(formatted);
    
    // Só notificar o onChange quando o horário estiver completo (HH:MM)
    if (isCompleteTime(formatted)) {
      onChange(formatted);
      // Auto-focus para o próximo campo quando o horário está completo
      if (onComplete) {
        // Pequeno delay para garantir que o onChange foi processado
        setTimeout(() => onComplete(), 50);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (!displayValue || displayValue.replace(/\D/g, "").length === 0) {
      setDisplayValue("");
      onChange("");
      return;
    }
    
    const digits = displayValue.replace(/\D/g, "");
    
    // Auto-completar horários parciais no blur
    let finalValue = "";
    
    if (digits.length === 1) {
      // Ex: "2" → "02:00"
      finalValue = `0${digits}:00`;
    } else if (digits.length === 2) {
      // Ex: "23" → "23:00"
      let h = parseInt(digits, 10);
      if (h > 23) h = 23;
      finalValue = `${h.toString().padStart(2, "0")}:00`;
    } else if (digits.length === 3) {
      // Ex: "130" → "13:00" ou "900" → "09:00"
      const h2 = parseInt(digits.substring(0, 2), 10);
      if (h2 <= 23) {
        const m = parseInt(digits.substring(2) + "0", 10);
        finalValue = `${h2.toString().padStart(2, "0")}:${Math.min(m, 59).toString().padStart(2, "0")}`;
      } else {
        const h1 = parseInt(digits.substring(0, 1), 10);
        const mm = parseInt(digits.substring(1, 3), 10);
        finalValue = `0${h1}:${Math.min(mm, 59).toString().padStart(2, "0")}`;
      }
    } else {
      finalValue = formatTimeString(digits);
    }
    
    if (isCompleteTime(finalValue)) {
      setDisplayValue(finalValue);
      onChange(finalValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Selecionar todo o texto ao focar
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir: backspace, delete, tab, escape, enter, setas
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End" ||
      // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) ||
      (e.metaKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase()))
    ) {
      return;
    }
    
    // Bloquear tudo que não é número
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Limitar a 4 dígitos
    const currentDigits = displayValue.replace(/\D/g, "");
    const start = inputRef.current?.selectionStart ?? 0;
    const end = inputRef.current?.selectionEnd ?? 0;
    if (start === end && currentDigits.length >= 4) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn(
      "relative flex items-center",
      className
    )}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-8 w-[82px] sm:w-[100px] rounded-lg border border-input bg-background px-2 sm:px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "pr-7 sm:pr-8"
        )}
        maxLength={5}
        autoComplete="off"
      />
      <Clock className="absolute right-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
