
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

// This file should only handle authentication logic.
// Data fetching for congresses is now handled by server components.

export interface User extends FirebaseUser {
  role?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  precinct?: string;
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
  constituentDescription?: string;
  overallView?: number;
  policyInterests?: {
    climateEnergyEnvironment?: number;
    criminalJustice?: number;
    defenseNationalSecurity?: number;
    discriminationPrejudice?: number;
    economyWork?: number;
    education?: number;
    healthPolicy?: number;
    immigrationMigration?: number;
    internationalAffairs?: number;
    nationalConditions?: number;
    religionGovernment?: number;
    technology?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  nickname?: string;
  publicProfileFields?: string[];
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
    threads?: string;
    bluesky?: string;
  };
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isInitialLoadComplete: boolean;
  refreshUserData: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
  isInitialLoadComplete: false,
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
      setIsInitialLoadComplete(true); // Mark initial auth load as complete
    });

    return () => unsubscribe();
  }, [db]);

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

  const refreshUserData = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({ ...auth.currentUser, ...userDoc.data() } as User);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendPasswordReset, isInitialLoadComplete, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
