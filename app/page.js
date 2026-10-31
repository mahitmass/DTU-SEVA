"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, Sparkles } from "lucide-react";
import FootMap from "@/components/FootMap";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/context/LiveDataContext";
import { api } from "@/lib/api";

export default function HomePage() {
  const { user } = useAuth();
  const { latest, connected } = useLiveData();
  const [insights, setInsights] = useState([]);
  const [meds, setMeds] = useState([]);
  const [demoOn, setDemoOn] = useState(true);

  const alerting = ["heel", "outer", "inner", "toe"].some(
    (k) => Number(latest[k]) > (latest.threshold || 3000)
  );

  useEffect(() => {
    if (!user) return;
    api("/api/insights", { user })
      .then((d) => setInsights(d.insights || []))
      .catch(() => {});
    api("/api/medicines", { user })
      .then(setMeds)
      .catch(() => {});
  }, [user]);

  async function toggleDemo() {
    const next = !demoOn;
    setDemoOn(next);
    await api(next ? "/api/demo/start" : "/api/demo/stop", { method: "POST", user });
  }

  const due = meds.find((m) => m.missed) || meds[0];
  const cards = insights.slice(0, 2);

  return (
    <div className="px-5 pb-8 pt-8">
      <header className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
          Feet Health
        </p>
        <h1 className="mt-1 text-3xl font-semibold">Home</h1>
        <div className="mx-auto mt-2 h-0.5 w-16 bg-red-600" />
      </header>

      <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <motion.span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`}
            animate={connected ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          {connected ? (latest.source === "esp32" ? "ESP32 live" : "Live stream") : "Reconnecting"}
        </span>
        <button
          onClick={toggleDemo}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-panel px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300"
        >
          <Radio size={12} />
          {demoOn ? "Demo walk on" : "Demo walk off"}
        </button>
      </div>

      <FootMap values={latest} threshold={latest.threshold || 3000} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Summary
        </h2>
        <div className="space-y-3">
          {alerting && (
            <motion.div
              className="rounded-xl border border-red-600 bg-panel p-4 shadow-glowSoft"
              animate={{ boxShadow: ["0 0 0 rgba(255,0,0,0)", "0 0 24px rgba(255,0,0,0.45)", "0 0 0 rgba(255,0,0,0)"] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
                Excess pressure detected
              </p>
              <p className="mt-1 text-sm text-emerald-400">Try taking a break from walking</p>
            </motion.div>
          )}

          {cards.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-panel p-4">
              <p className="text-sm font-medium text-red-400">{c.title}</p>
              <p className="mt-2 text-sm text-emerald-400">{c.correction}</p>
            </div>
          ))}

          {due && (
            <motion.div
              className="rounded-xl border border-red-600/50 bg-panel p-4"
              animate={due.missed ? { opacity: [1, 0.65, 1] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-red-500">
                <Sparkles size={14} />
                Medicine reminder: {due.name} {due.missed ? "due" : `at ${due.time}`}
                {due.missed ? " !!" : ""}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
