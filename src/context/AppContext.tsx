import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type AppContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  calendarMode: 'gregorian' | 'hijri';
  setCalendarMode: (mode: 'gregorian' | 'hijri') => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { i18n } = useTranslation();
  
  const [language, setLangState] = useState<string>(localStorage.getItem('language') || 'en');
  const [currency, setCurrencyState] = useState<string>(localStorage.getItem('currency') || 'USD');
  const [calendarMode, setCalendarModeState] = useState<'gregorian' | 'hijri'>(
    (localStorage.getItem('calendarMode') as 'gregorian' | 'hijri') || 'gregorian'
  );

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = (language === 'ar' || language === 'ur') ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language, i18n]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);
  
  useEffect(() => {
    localStorage.setItem('calendarMode', calendarMode);
  }, [calendarMode]);

  return (
    <AppContext.Provider value={{
      language, setLanguage: setLangState,
      currency, setCurrency: setCurrencyState,
      calendarMode, setCalendarMode: setCalendarModeState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
