"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function tick(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function AnalysisPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    api("/api/trends?days=7", { user }).then(setData).catch(() => {});
  }, [user]);

  const status = data?.status;
  const improving = status?.improving;

  return (
    <div className="px-5 pb-8 pt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
        Pressure history
      </p>
      <h1 className="mt-1 text-3xl font-semibold">Analysis</h1>

      {status && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-5 rounded-2xl border bg-panel p-4 ${
            improving ? "border-emerald-500/40" : "border-red-600 shadow-glowSoft"
          }`}
        >
          <div className="flex items-center gap-3">
            {improving ? (
              <TrendingDown className="text-emerald-400" />
            ) : (
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <TrendingUp className="text-red-500" />
              </motion.div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Improvement status</p>
              <p className={`text-lg font-semibold ${improving ? "text-emerald-400" : "text-red-500"}`}>
                {status.badge}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Red alerts (&gt; {status.threshold}): {status.lastAlerts} in the last 24h vs {status.prevAlerts}{" "}
            the day before ({status.deltaPct > 0 ? "+" : ""}
            {status.deltaPct}%).
          </p>
        </motion.div>
      )}

      <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-3">
        <h2 className="mb-2 px-1 text-sm font-medium text-zinc-300">7-day multi-sensor trend</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.series || []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={tick}
                stroke="#71717a"
                tick={{ fontSize: 10 }}
                minTickGap={28}
              />
              <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #27272a", borderRadius: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="heel" stroke="#FF0000" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="toe" stroke="#fb7185" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="inner" stroke="#a1a1aa" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="outer" stroke="#52525b" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
