"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Database, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { user, login, signup, logout, error, setError } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(username, password);
      else await signup(username, password);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    try {
      await login("demo", "demo123");
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="mx-auto max-w-2xl px-2 sm:px-4 md:px-6 pb-12 pt-6 sm:pt-8">
        <header className="mb-6 border-b border-zinc-800/80 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">Profile</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Patient Account</h1>
          <div className="mt-1.5 h-0.5 w-16 bg-red-600" />
        </header>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 border border-red-500/30 text-red-500">
              <User size={28} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Authenticated Patient</p>
              <p className="text-xl font-bold text-white">{user.username}</p>
              <p className="font-mono text-xs text-zinc-500">System ID: #{user.id}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-xs text-zinc-300">
              <Database size={16} className="text-red-500" />
              <span>Biometric insole records are saved persistently to local SQLite (<code>database.db</code>).</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-xs text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Session persists automatically in browser local storage across restarts.</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-600/60 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-950/30 hover:border-red-500"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-12 pt-6 sm:pt-10">
      <header className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">Secure Access</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
          {mode === "login" ? "Welcome Back" : "Register Patient"}
        </h1>
        <p className="mt-1.5 text-xs text-zinc-400">
          Smart Insole live clinical monitoring & reminder suite
        </p>
      </header>

      {/* Switcher */}
      <div className="grid grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 text-xs">
        <button
          onClick={() => {
            setMode("login");
            setError("");
          }}
          className={`rounded-lg py-2 font-semibold transition-all ${
            mode === "login" ? "bg-red-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setError("");
          }}
          className={`rounded-lg py-2 font-semibold transition-all ${
            mode === "signup" ? "bg-red-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Username</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            placeholder="Username (min 3 chars)"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            placeholder="Password (min 4 chars)"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={busy}
          className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-glowSoft hover:bg-red-500 disabled:opacity-60"
        >
          {busy ? "Authenticating…" : mode === "login" ? "Sign In" : "Create Account"}
        </motion.button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-zinc-900 px-2 text-[10px] uppercase text-zinc-500">Quick Test</span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={demo}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Sparkles size={14} className="text-red-400" />
          <span>Demo Account (demo / demo123)</span>
        </motion.button>
      </form>
    </div>
  );
}
