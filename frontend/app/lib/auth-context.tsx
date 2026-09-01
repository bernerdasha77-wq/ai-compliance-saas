'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  full_name?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  /** false, пока не проверили localStorage на клиенте (сразу после монтирования
   * token/user ещё null даже у залогиненного пользователя) — страницы,
   * показывающие "Пожалуйста, войдите в систему" при отсутствии token,
   * должны дождаться authReady, иначе это сообщение ошибочно мелькает (а то
   * и залипает — см. историю: report/[id] и history не сбрасывали error
   * при повторном срабатывании эффекта) при каждой прямой загрузке страницы. */
  authReady: boolean;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (storedToken && userData) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setUser(JSON.parse(userData));
    }
    setAuthReady(true);
  }, []);

  const login = (newToken: string) => {
    setIsAuthenticated(true);
    setToken(newToken);
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        authReady,
        isAuthOpen,
        openAuth: () => setIsAuthOpen(true),
        closeAuth: () => setIsAuthOpen(false),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
