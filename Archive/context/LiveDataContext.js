"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { WS_URL } from "@/lib/api";

const defaultData = {
  heel: 0,
  outer: 0,
  inner: 0,
  toe: 0,
  timestamp: 0,
  source: "idle",
  threshold: 3000,
};

const LiveDataContext = createContext({
  latest: defaultData,
  connected: false,
  isConnected: false,
});

function resolveWsUrl() {
  if (typeof window === "undefined") return WS_URL;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8080`;
}

export function LiveDataProvider({ children }) {
  const [latest, setLatest] = useState(defaultData);
  const [connected, setConnected] = useState(false);
  const retry = useRef(null);

  useEffect(() => {
    let ws;
    let closed = false;
    const wsUrl = resolveWsUrl();

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: "hello", role: "client" }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg && msg.type === "pressure") setLatest(msg);
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry.current = setTimeout(connect, 1200);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry.current);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        }
      }
    };
  }, []);

  const value = useMemo(
    () => ({ latest, connected, isConnected: connected }),
    [latest, connected]
  );
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error("useLiveData must be used inside LiveDataProvider");
  return ctx;
}
