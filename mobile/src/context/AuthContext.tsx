import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

interface User {
  userId: string;
  email: string;
  role: string;
  profile?: { firstName?: string; lastName?: string; phone?: string; city?: string; region?: string };
  doctorInfo?: { specialization?: string; licenseNumber?: string; verificationStatus?: string };
  patientInfo?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const u = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const login = async (u: User, t: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, t);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
    setUser(u); setToken(t);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null); setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
