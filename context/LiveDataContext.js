"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

const defaultData = { heel: 0, outer: 0, inner: 0, toe: 0 };

const LiveDataContext = createContext({
  latest: defaultData,
  isConnected: false
});

export const LiveDataProvider = ({ children }) => {
  const [latest, setLatest] = useState(defaultData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine the correct WebSocket URL (supports localhost and network IPs)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ Connected to WebSocket stream');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // The simulator/ESP32 sends { type: "pressure", heel: X, ... }
        // We ignore the initial "hello" message to prevent UI crashes.
        if (data && data.type === 'pressure') {
          setLatest({
            heel: data.heel,
            outer: data.outer,
            inner: data.inner,
            toe: data.toe
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('⚠️ WebSocket connection closed');
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <LiveDataContext.Provider value={{ latest, isConnected }}>
      {children}
    </LiveDataContext.Provider>
  );
};

export const useLiveData = () => useContext(LiveDataContext);