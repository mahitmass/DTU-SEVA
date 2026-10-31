"use client";

import { AuthProvider } from "@/context/AuthContext";
import { LiveDataProvider } from "@/context/LiveDataContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <LiveDataProvider>{children}</LiveDataProvider>
    </AuthProvider>
  );
}
