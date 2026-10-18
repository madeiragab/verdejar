import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, refreshSession, setAccessToken, subscribeSession } from '../api/client';
import type { Session, User } from '../api/types';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isModerator: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    subscribeSession((s) => setUser(s?.user ?? null));
    // Ao abrir o site, tenta recuperar a sessão pelo cookie httpOnly.
    refreshSession().finally(() => setReady(true));
  }, []);

  const start = useCallback((s: Session) => {
    setAccessToken(s.accessToken);
    setUser(s.user);
    return s.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      start(await api<Session>('/auth/login', { method: 'POST', body: { email, password } })),
    [start],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) =>
      start(await api<Session>('/auth/register', { method: 'POST', body: { name, email, password } })),
    [start],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      isModerator: user?.role === 'MODERATOR' || user?.role === 'ADMIN',
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
