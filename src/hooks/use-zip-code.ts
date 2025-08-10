import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const ZIP_CODE_COOKIE_KEY = 'user_zip_code';

export const useZipCode = () => {
  const [zipCode, setZipCode] = useState<string | null>(null);

  useEffect(() => {
    const savedZipCode = Cookies.get(ZIP_CODE_COOKIE_KEY);
    if (savedZipCode) {
      setZipCode(savedZipCode);
    }
  }, []);

  const saveZipCode = (newZipCode: string) => {
    setZipCode(newZipCode);
    Cookies.set(ZIP_CODE_COOKIE_KEY, newZipCode, { expires: 365 });
  };

  const clearZipCode = () => {
    setZipCode(null);
    Cookies.remove(ZIP_CODE_COOKIE_KEY);
  };

  return { zipCode, saveZipCode, clearZipCode };
};
