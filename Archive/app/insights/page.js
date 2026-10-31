"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles, BrainCircuit } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const ICONS = {
  alert: AlertTriangle,
  warn: AlertTriangle,
  ok: CheckCircle2,
  info: Info,
};

const TONE = {
  alert: "border-red-600/70 bg-red-950/20 text-red-400 shadow-[0_0_20px_rgba(255,0,0,0.15)]",
  warn: "border-amber-500/40 bg-amber-950/15 text-amber-300",
  ok: "border-emerald-500/40 bg-emerald-950/15 text-emerald-400",
  info: "border-zinc-800 bg-zinc-900/80 text-zinc-300",
};

export default function InsightsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api("/api/insights", { user })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [user]);

  const insightsList = data?.insights || [];
  const alertCount = insightsList.filter((i) => i.severity === "alert" || i.severity === "warn").length;

  return (
    <div className="px-2 sm:px-4 md:px-6 pb-12 pt-6 sm:pt-8">
      {/* Header */}
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
              AI Algorithmic Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Gait Insights</h1>
          <div className="mt-1.5 h-0.5 w-16 bg-red-600" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-300">
            <span className="text-zinc-500">Samples Analyzed: </span>
            <span className="font-mono font-semibold text-white">{data?.count ?? 0}</span>
          </div>
          {alertCount > 0 && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-3.5 py-1.5 text-xs font-semibold text-red-400">
              {alertCount} Attention Required
            </div>
          )}
        </div>
      </header>

      {err && (
        <div className="mb-6 rounded-xl border border-red-600/50 bg-red-950/20 p-4 text-sm text-red-400">
          {err}
        </div>
      )}

      {/* Insights Grid (1 col on mobile, 2 cols on tablet/desktop) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insightsList.map((item, i) => {
          const Icon = ICONS[item.severity] || Sparkles;
          const isAlert = item.severity === "alert";

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-sm transition-all hover:border-zinc-700 ${
                TONE[item.severity] || TONE.info
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isAlert ? "bg-red-600/20 text-red-500" : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                    {item.severity}
                  </span>
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-zinc-300">{item.body}</p>
              </div>

              {item.correction && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    Clinician Guidance:
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-300">{item.correction}</p>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
