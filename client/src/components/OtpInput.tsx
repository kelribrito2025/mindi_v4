import { useRef, useState, useEffect, useCallback } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 5,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Split value into array of characters
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      // Only allow digits
      if (char && !/^\d$/.test(char)) return;

      const newDigits = [...digits];
      newDigits[index] = char;
      const newValue = newDigits.join("").trim();
      onChange(newValue);

      // Move to next input if character was entered
      if (char && index < length - 1) {
        focusInput(index + 1);
      }

      // Call onComplete when all digits are filled
      if (char && newValue.length === length) {
        onComplete?.(newValue);
      }
    },
    [digits, length, onChange, onComplete, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[index]) {
          // Clear current digit
          handleChange(index, "");
        } else if (index > 0) {
          // Move to previous and clear
          focusInput(index - 1);
          handleChange(index - 1, "");
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, length, handleChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pastedData) {
        onChange(pastedData);
        // Focus the next empty input or the last one
        const nextIndex = Math.min(pastedData.length, length - 1);
        focusInput(nextIndex);
        if (pastedData.length === length) {
          onComplete?.(pastedData);
        }
      }
    },
    [length, onChange, onComplete, focusInput]
  );

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled) {
      focusInput(0);
    }
  }, [disabled, focusInput]);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[index] || ""}
          disabled={disabled}
          onChange={(e) => {
            const char = e.target.value.slice(-1);
            handleChange(index, char);
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          className={[
            "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-xl border-2 transition-colors duration-200 outline-none",
            "bg-muted/50 text-foreground",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-text",
            error
              ? "border-red-400 bg-red-50 text-red-500 animate-shake"
              : focusedIndex === index
                ? "border-primary ring-2 ring-primary/20 bg-card shadow-sm"
                : digits[index]
                  ? "border-primary/40 bg-card"
                  : "border-border hover:border-muted-foreground/40",
          ].join(" ")}
        />
      ))}

      {/* Shake animation for error state */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
