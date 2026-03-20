import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/http";

type User = { id: number; username: string };

type AuthContextValue = {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = async () => {
    try {
      const meRes = await api.me();
      setUser(meRes.user);
      setError(null);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // Initialize CSRF cookie for subsequent state-changing requests.
        await api.getCsrf();
        await refreshMe();
      } catch {
        // ignore
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };
    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.login(username, password);
      // Backend rotates CSRF on login; fetch the new token before state-changing requests.
      await api.getCsrf();
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.register(username, password);
      // Backend issues a new CSRF token on register; fetch it to keep CSRF validation consistent.
      await api.getCsrf();
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initialized,
      loading,
      error,
      login,
      register,
      logout,
      refreshMe,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, initialized, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

