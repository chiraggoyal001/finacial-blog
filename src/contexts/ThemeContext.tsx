import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  language: "en" | "hi";
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [language, setLanguage] = useState<"en" | "hi">(() => {
    const saved = localStorage.getItem("language");
    return (saved === "hi" ? "hi" : "en") as "en" | "hi";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleTheme = () => {
    setIsDark((p) => {
      const next = !p;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };
  const toggleLanguage = () => {
    setLanguage((p) => {
      const next = p === "en" ? "hi" : "en";
      localStorage.setItem("language", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, language, toggleLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
