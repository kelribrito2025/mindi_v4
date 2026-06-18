import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface SlidingTabsProps<T extends string> {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SlidingTabs<T extends string>({ options, value, onChange, className = "" }: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const updatePillPosition = useCallback(() => {
    const idx = options.findIndex(o => o.value === value);
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [value, options]);

  useLayoutEffect(() => {
    updatePillPosition();
  }, [updatePillPosition]);

  useEffect(() => {
    const timer = setTimeout(updatePillPosition, 50);
    return () => clearTimeout(timer);
  }, [updatePillPosition]);

  useEffect(() => {
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [updatePillPosition]);

  return (
    <div ref={containerRef} className={`relative flex items-center gap-1 bg-muted rounded-xl p-1 ${className}`}>
      {pillStyle.width > 0 && (
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-white shadow-sm transition-colors duration-300 ease-in-out"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
          }}
        />
      )}
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => { btnRefs.current[i] = el; }}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 whitespace-nowrap ${
            value === opt.value
              ? "text-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
