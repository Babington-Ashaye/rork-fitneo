import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import i18n, {
  changeAppLanguage,
  getCurrentLanguage,
  SupportedLanguage,
  supportedLanguages
} from "@/lib/i18n";

type LanguageContextValue = {
  language: SupportedLanguage;
  languages: typeof supportedLanguages;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setCurrentLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  useEffect(() => {
    const syncLanguage = (nextLanguage: string) => {
      if (supportedLanguages.some((item) => item.code === nextLanguage)) {
        setCurrentLanguage(nextLanguage as SupportedLanguage);
      }
    };

    i18n.on("languageChanged", syncLanguage);
    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    languages: supportedLanguages,
    setLanguage: async (nextLanguage) => {
      setCurrentLanguage(nextLanguage);
      await changeAppLanguage(nextLanguage);
    }
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
