"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
      <div className="px-5 pb-8 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">Profile</p>
        <h1 className="mt-1 text-3xl font-semibold">Account</h1>
        <div className="mt-8 rounded-2xl border border-white/10 bg-panel p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Signed in as</p>
          <p className="mt-1 text-2xl font-semibold">{user.username}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">user id {user.id}</p>
          <p className="mt-4 text-sm text-zinc-400">
            Session is stored in this browser. Pressure history and medicines stay in the local
            SQLite database across refresh.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            className="mt-6 w-full rounded-xl border border-red-600 py-2.5 font-semibold text-red-500"
          >
            Log out
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">Access</p>
      <h1 className="mt-1 text-3xl font-semibold">{mode === "login" ? "Log in" : "Sign up"}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Credentials are saved in SQLite on this machine so the demo remembers you.
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-full bg-panel p-1 text-sm">
        {["login", "signup"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`rounded-full py-2 capitalize ${mode === m ? "bg-red-600 font-semibold" : "text-zinc-400"}`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-zinc-500">Username</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-panel px-3 py-2.5"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-zinc-500">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-panel px-3 py-2.5"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          className="w-full rounded-xl bg-red-600 py-2.5 font-semibold disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </motion.button>
      </form>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={demo}
        className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm text-zinc-300"
      >
        Continue as demo (demo / demo123)
      </motion.button>
    </div>
  );
}
