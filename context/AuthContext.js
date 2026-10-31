"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "insole-user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        api(`/api/auth/me?userId=${parsed.id}`)
          .then((fresh) => {
            setUser(fresh);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          })
          .catch(() => {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          })
          .finally(() => setReady(true));
        return;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  const persist = (next) => {
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const login = async (username, password) => {
    setError("");
    const next = await api("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    persist(next);
    return next;
  };

  const signup = async (username, password) => {
    setError("");
    const next = await api("/api/auth/signup", {
      method: "POST",
      body: { username, password },
    });
    persist(next);
    return next;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, ready, error, setError, login, signup, logout }),
    [user, ready, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
