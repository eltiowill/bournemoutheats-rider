import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage]);

  const loadTranslations = async (language) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/translations/${language}`);
      setTranslations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English
      setCurrentLanguage('en');
      setLoading(false);
    }
  };

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred_language', language);
  };

  const t = (key) => {
    return translations[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    translations,
    loading,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
