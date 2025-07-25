
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

async function getCongresses(): Promise<Congress[]> {
    const API_KEY = process.env.NEXT_PUBLIC_CONGRESS_API_KEY || 'DEMO_KEY';
    const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return [];
        }
        const data = await res.json();
        return (data.congresses || [])
            .filter(Boolean)
            .map(congress => ({
                ...congress,
                number: parseInt(congress.name.match(/(\d+)/)?.[1] || '0', 10)
            }))
            .sort((a, b) => b.number - a.number);
    } catch (error) {
        return [];
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
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCongress, setSelectedCongress] = useState('');
  const [congresses, setCongresses] = useState<Congress[]>([]);
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendPasswordReset, selectedCongress, setSelectedCongress, congresses }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
