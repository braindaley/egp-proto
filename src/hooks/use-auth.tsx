
'use client';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { Congress } from '@/types';

// Add this outside your component
let congressCache: Congress[] | null = null;
let cacheExpiry: number = 0;

function getFallbackCongresses(): Congress[] {
  console.warn('Using fallback congress data.');
  return [
    { name: '119th Congress', number: 119, startYear: '2025', endYear: '2027' },
    { name: '118th Congress', number: 118, startYear: '2023', endYear: '2025' },
    { name: '117th Congress', number: 117, startYear: '2021', endYear: '2023' },
    { name: '116th Congress', number: 116, startYear: '2019', endYear: '2021' },
    { name: '115th Congress', number: 115, startYear: '2017', endYear: '2019' },
  ].sort((a, b) => b.number - a.number);
}

async function getCongresses(): Promise<Congress[]> {
    const now = Date.now();
    if (congressCache && now < cacheExpiry) {
        return congressCache;
    }

    try {
        const res = await fetch('/api/congresses');

        if (res.status === 429) {
          if (congressCache) {
            console.warn('Rate limit exceeded, using cached data.');
            return congressCache;
          }
          return getFallbackCongresses();
        }

        if (!res.ok) {
            console.error(`Failed to fetch congresses from local API: ${res.status}`);
            return getFallbackCongresses();
        }
        const data = await res.json();
        const result = data.congresses || [];
        
        if (result.length > 0) {
            congressCache = result;
            cacheExpiry = now + (60 * 60 * 1000); // Cache for 1 hour
        }
        
        return result.length > 0 ? result : getFallbackCongresses();
    } catch (error) {
        console.error('Error fetching congresses from local API:', error);
        return getFallbackCongresses();
    }
}


type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  selectedCongress: string;
  setSelectedCongress: (congress: string) => void;
  congresses: Congress[];
  isInitialLoadComplete: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
  selectedCongress: '',
  setSelectedCongress: () => {},
  congresses: [],
  isInitialLoadComplete: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCongress, setSelectedCongress] = useState('');
  const [congresses, setCongresses] = useState<Congress[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    getCongresses().then(data => {
        setCongresses(data);
        if (data.length > 0 && !selectedCongress) {
            setSelectedCongress(data[0].number.toString());
        }
        setIsInitialLoadComplete(true);
    });

    return () => unsubscribe();
  }, [selectedCongress]);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    setUser(null);
    await signOut(auth);
    router.push('/');
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendPasswordReset, selectedCongress, setSelectedCongress, congresses, isInitialLoadComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
