import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/translations";

export const useTranslation = () => {
  const { language } = useTheme();

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry["en"] || key;
  };

  return { t, language };
};
