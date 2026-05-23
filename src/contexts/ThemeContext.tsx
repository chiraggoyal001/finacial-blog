import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  language: "en" | "hi";
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
    }
    
    const savedLang = localStorage.getItem("language");
    if (savedLang === "hi") {
      setLanguage("hi");
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isDark, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("language", language);
    }
  }, [language, isMounted]);

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
