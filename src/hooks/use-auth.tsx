
'use client';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { Congress } from '@/types';

// Add this outside your component
let congressCache: Congress[] | null = null;
let cacheExpiry: number = 0;

export interface User extends FirebaseUser {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  congressionalDistrict?: string;
  stateSenatedistrict?: string;
  stateHouseDistrict?: string;
  birthYear?: number;
  gender?: string;
  maritalStatus?: string;
  politicalAffiliation?: string;
  education?: string;
  profession?: string;
  militaryService?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

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

    // This function now calls the internal API route instead of the external one.
    // This is more secure and avoids client-side fetch issues.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002');
    const url = `${baseUrl}/api/congresses`;
    
    try {
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`Failed to fetch congresses from internal API: ${res.status}`);
            if (congressCache) {
              console.warn("Using stale cache due to API error.");
              return congressCache;
            }
            return getFallbackCongresses();
        }

        const data = await res.json();
        const congresses = (data.congresses || [])
          .filter(Boolean)
          .map((congress: any) => ({
            ...congress,
            number: parseInt(congress.name.match(/(\\d+)/)?.[1] || '0', 10)
          }))
          .sort((a: any, b: any) => b.number - a.number);
        
        if (congresses.length > 0) {
            congressCache = congresses;
            cacheExpiry = now + (60 * 60 * 1000); // Cache for 1 hour
        }
        
        return congresses.length > 0 ? congresses : getFallbackCongresses();
    } catch (error) {
        console.error('Error fetching congresses from internal API:', error);
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
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() } as User);
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
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
  }, [selectedCongress, db]);

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
