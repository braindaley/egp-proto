
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './use-auth'; // Import useAuth

interface ZipCodeContextType {
  zipCode: string | null;
  setZipCode: (zipCode: string | null) => void;
  saveZipCode: (zipCode: string) => void;
  clearZipCode: () => void;
}

const ZipCodeContext = createContext<ZipCodeContextType | undefined>(undefined);

export const ZipCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zipCode, setZipCodeState] = useState<string | null>(null);
  const { user } = useAuth(); // Get user from useAuth

  useEffect(() => {
    if (user && user.zipCode) {
      setZipCodeState(user.zipCode);
      localStorage.setItem('user_zip_code', user.zipCode);
    } else {
      const storedZip = localStorage.getItem('user_zip_code');
      if (storedZip) {
        setZipCodeState(storedZip);
      }
    }
  }, [user]);

  const setZipCode = (newZipCode: string | null) => {
    setZipCodeState(newZipCode);
    if (newZipCode) {
      localStorage.setItem('user_zip_code', newZipCode);
    } else {
      localStorage.removeItem('user_zip_code');
    }
  };

  const saveZipCode = (newZipCode: string) => {
    setZipCode(newZipCode);
  };

  const clearZipCode = () => {
    setZipCode(null);
  };

  return (
    <ZipCodeContext.Provider value={{ zipCode, setZipCode, saveZipCode, clearZipCode }}>
      {children}
    </ZipCodeContext.Provider>
  );
};

export const useZipCode = () => {
  const context = useContext(ZipCodeContext);
  if (context === undefined) {
    throw new Error('useZipCode must be used within a ZipCodeProvider');
  }
  return context;
};
