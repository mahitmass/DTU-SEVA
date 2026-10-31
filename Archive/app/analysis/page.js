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
import { TrendingDown, TrendingUp, AlertCircle, ShieldCheck, Activity } from "lucide-react";
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
    <div className="px-2 sm:px-4 md:px-6 pb-12 pt-6 sm:pt-8">
      {/* Header */}
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-5 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
            Plantar Biomechanics
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Pressure Analysis</h1>
          <div className="mt-1.5 h-0.5 w-16 bg-red-600" />
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300">
            Window: <span className="font-semibold text-white">Last 7 Days</span>
          </span>
          <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 font-mono text-xs text-zinc-400">
            Threshold: {data?.threshold || 3000}
          </span>
        </div>
      </header>

      {/* Top Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Improvement Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 ${
            improving
              ? "border-emerald-500/40 bg-emerald-950/15"
              : "border-red-600/70 bg-red-950/20 shadow-[0_0_24px_rgba(255,0,0,0.15)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Clinical Assessment
            </span>
            {improving ? (
              <ShieldCheck className="text-emerald-400" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            {improving ? (
              <TrendingDown className="text-emerald-400" size={26} />
            ) : (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <TrendingUp className="text-red-500" size={26} />
              </motion.div>
            )}
            <div>
              <p className={`text-lg font-bold ${improving ? "text-emerald-400" : "text-red-500"}`}>
                {status ? status.badge : "Calculating..."}
              </p>
              <p className="text-xs text-zinc-400">
                {improving ? "Ulcer risk stabilized" : "High focal pressure warning"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 24-Hour Comparison Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <span>24h Alert Frequency</span>
            <Activity size={16} className="text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{status?.lastAlerts ?? 0}</span>
            <span className="text-xs text-zinc-400">
              alerts vs <span className="font-mono">{status?.prevAlerts ?? 0}</span> yesterday
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            Trend:{" "}
            <span
              className={`font-semibold ${
                (status?.deltaPct ?? 0) <= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {(status?.deltaPct ?? 0) > 0 ? "+" : ""}
              {status?.deltaPct ?? 0}%
            </span>{" "}
            change in threshold spikes.
          </p>
        </div>

        {/* Sensor Distribution Summary Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Sensor Channels
          </span>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2">
              <div className="text-[10px] uppercase text-zinc-400">Heel</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-red-600" />
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2">
              <div className="text-[10px] uppercase text-zinc-400">Toe</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-rose-400" />
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-2">
              <div className="text-[10px] uppercase text-zinc-400">Inner</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-400" />
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-2">
              <div className="text-[10px] uppercase text-zinc-400">Outer</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-600" />
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-500">Continuous sampling across 4 plantar zones</p>
        </div>
      </div>

      {/* Main Interactive Recharts Chart */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-white">Multi-Sensor Pressure Waveform</h2>
            <p className="text-xs text-zinc-400">Full 7-day chronological progression of insole logs</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-red-600" /> Heel
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-rose-400" /> Toe
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-zinc-400" /> Inner
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-zinc-600" /> Outer
          </div>
        </div>

        <div className="h-80 w-full md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.series || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={tick}
                stroke="#71717a"
                tick={{ fontSize: 11, fill: "#71717a" }}
                minTickGap={32}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 11, fill: "#71717a" }}
                domain={[0, 4095]}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
                labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="heel"
                name="Heel"
                stroke="#FF0000"
                dot={false}
                strokeWidth={2.5}
                activeDot={{ r: 5, fill: "#FF0000" }}
              />
              <Line
                type="monotone"
                dataKey="toe"
                name="Toe"
                stroke="#fb7185"
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 4, fill: "#fb7185" }}
              />
              <Line
                type="monotone"
                dataKey="inner"
                name="Inner Metatarsal"
                stroke="#a1a1aa"
                dot={false}
                strokeWidth={1.8}
              />
              <Line
                type="monotone"
                dataKey="outer"
                name="Outer Metatarsal"
                stroke="#52525b"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
