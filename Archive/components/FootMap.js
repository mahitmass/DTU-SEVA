"use client";

import { motion } from "framer-motion";

const SENSORS = [
  { key: "toe", cx: 118, cy: 52, label: "Toe" },
  { key: "inner", cx: 92, cy: 108, label: "Inner" },
  { key: "outer", cx: 148, cy: 118, label: "Outer" },
  { key: "heel", cx: 122, cy: 214, label: "Heel" },
];

export default function FootMap({ values, threshold = 3000 }) {
  const alerts = SENSORS.filter((s) => Number(values[s.key]) > threshold);
  const hottest = SENSORS.reduce((a, b) =>
    Number(values[a.key]) >= Number(values[b.key]) ? a : b
  );

  return (
    <div className="relative mx-auto flex w-full max-w-md max-h-[65vh] flex-col items-center justify-center">
      <motion.div
        className="relative aspect-square w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px] overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-2xl"
        animate={
          alerts.length
            ? { boxShadow: ["0 0 0 0 rgba(255,0,0,0.0)", "0 0 42px 8px rgba(255,0,0,0.35)", "0 0 0 0 rgba(255,0,0,0.0)"] }
            : { boxShadow: "0 0 0 0 rgba(255,0,0,0)" }
        }
        transition={{ duration: 1.15, repeat: alerts.length ? Infinity : 0, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-3 rounded-full border border-white/5"
          animate={alerts.length ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.35 }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <svg viewBox="0 0 240 240" className="relative h-full w-full p-6">
          <path
            d="M118 28c-18 4-38 28-42 58-3 22 2 38 8 54 6 16 8 30 6 48-2 16 4 32 20 40 14 7 30 7 44-2 16-10 24-28 26-46 3-22 8-40 4-62-5-28-18-52-38-70-8-8-18-16-28-20z"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="3"
          />
          <path
            d="M96 46c8-10 22-16 34-14"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="2"
          />
          {SENSORS.map((s) => {
            const v = Number(values[s.key] || 0);
            const hot = v > threshold;
            return (
              <g key={s.key}>
                {hot && (
                  <motion.circle
                    cx={s.cx}
                    cy={s.cy}
                    r={18}
                    fill="rgba(255,0,0,0.18)"
                    animate={{ scale: [0.9, 1.45, 0.9], opacity: [0.55, 0.1, 0.55] }}
                    style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
                    transition={{ duration: 0.85, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.circle
                  cx={s.cx}
                  cy={s.cy}
                  r={7}
                  fill={hot ? "#FF0000" : "#3f3f46"}
                  animate={
                    hot
                      ? {
                          scale: [1, 1.4, 1],
                          fill: "#FF0000",
                          filter: [
                            "drop-shadow(0 0 2px #FF0000)",
                            "drop-shadow(0 0 16px #FF0000)",
                            "drop-shadow(0 0 2px #FF0000)",
                          ],
                        }
                      : { scale: 1, fill: "#3f3f46", filter: "drop-shadow(0 0 0px #000)" }
                  }
                  style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
                  transition={{ duration: 0.7, repeat: hot ? Infinity : 0 }}
                />
              </g>
            );
          })}
        </svg>

        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-2 top-8 max-w-[42%] rounded-md border border-red-600 bg-black/80 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-500 shadow-glow"
          >
            <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
              Alert!!
            </motion.span>
            <div className="mt-0.5 text-[9px] font-medium normal-case tracking-normal text-red-300">
              Excess pressure · {hottest.label}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="mt-5 grid w-full max-w-[320px] grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider text-zinc-500">
        {SENSORS.map((s) => {
          const v = Number(values[s.key] || 0);
          const hot = v > threshold;
          return (
            <div key={s.key} className={`rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-2 ${hot ? "border-red-600/50 text-red-500 shadow-glowSoft" : ""}`}>
              <div className="font-semibold text-zinc-400">{s.label}</div>
              <div className="font-mono text-xs font-bold text-zinc-200">{v}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
