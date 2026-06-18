import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  forceTheme: (theme: Theme | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  // Tema forçado por páginas públicas (null = usar tema normal)
  const [forcedTheme, setForcedTheme] = useState<Theme | null>(null);

  const activeTheme = forcedTheme ?? theme;

  useEffect(() => {
    const root = document.documentElement;
    // Adicionar classe de transição temporária para animação suave
    root.classList.add("theme-transition");
    
    if (activeTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Só persistir no localStorage se não estiver forçado
    if (switchable && forcedTheme === null) {
      localStorage.setItem("theme", theme);
    }
    
    // Remover classe de transição após a animação completar
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 250);
    
    return () => clearTimeout(timeout);
  }, [activeTheme, theme, switchable, forcedTheme]);

  const toggleTheme = switchable
    ? () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const forceTheme = useCallback((t: Theme | null) => {
    setForcedTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme, switchable, forceTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
