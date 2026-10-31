"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const ICONS = {
  alert: AlertTriangle,
  warn: AlertTriangle,
  ok: CheckCircle2,
  info: Info,
};

const TONE = {
  alert: "border-red-600/70 text-red-400",
  warn: "border-red-500/30 text-red-300",
  ok: "border-emerald-500/40 text-emerald-400",
  info: "border-white/10 text-zinc-300",
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

  return (
    <div className="px-5 pb-8 pt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
        AI algorithms
      </p>
      <h1 className="mt-1 text-3xl font-semibold">Insights</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Personalized from {data?.count ?? "—"} recent insole samples — not canned copy.
      </p>

      {err && <p className="mt-4 text-sm text-red-500">{err}</p>}

      <div className="mt-6 space-y-4">
        {(data?.insights || []).map((item, i) => {
          const Icon = ICONS[item.severity] || Sparkles;
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border bg-panel p-4 ${TONE[item.severity] || TONE.info}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.body}</p>
                  <p className="mt-3 text-sm font-medium text-emerald-400">
                    Correction: {item.correction}
                  </p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
