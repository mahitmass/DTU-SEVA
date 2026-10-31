"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthGate({ children }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (pathname === "/account") return children;
  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-zinc-500">
        Loading session…
      </div>
    );
  }
  if (user) return children;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-6 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-600/40 bg-red-600/10 text-red-500">
        <ShieldAlert size={26} />
      </div>
      <h1 className="text-2xl font-semibold">Sign in to monitor your feet</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Live pressure, insights, and medicine reminders are tied to your account so the
        insole remembers you after refresh.
      </p>
      <Link
        href="/account"
        className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glowSoft"
      >
        Go to Account
      </Link>
    </motion.div>
  );
}
