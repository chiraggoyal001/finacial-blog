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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark((p) => !p);
  const toggleLanguage = () => setLanguage((p) => (p === "en" ? "hi" : "en"));

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
