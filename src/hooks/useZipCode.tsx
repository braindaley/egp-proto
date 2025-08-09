
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ZipCodeContextType {
  zipCode: string | null;
  setZipCode: (zipCode: string | null) => void;
}

const ZipCodeContext = createContext<ZipCodeContextType | undefined>(undefined);

export const ZipCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zipCode, setZipCodeState] = useState<string | null>(null);

  const setZipCode = (newZipCode: string | null) => {
    console.log(`[ZipCodeProvider] Updating zip code to: ${newZipCode}`);
    setZipCodeState(newZipCode);
  };

  return (
    <ZipCodeContext.Provider value={{ zipCode, setZipCode }}>
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
