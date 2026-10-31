"use client";
import React, { useState, useEffect } from "react";

export default function DashboardPage() {
  const [data, setData] = useState({ heel: 0, outer: 0, inner: 0, toe: 0 });
  const [connected, setConnected] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [history, setHistory] = useState([]);

  // Connect to WebSocket (ws://localhost:8080) + Fallback HTTP Polling
  useEffect(() => {
    if (simMode) return;

    let ws;
    try {
      ws = new WebSocket("ws://localhost:8080");
      ws.onopen = () => setConnected(true);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "LIVE_PRESSURE" && msg.data) {
          setData(msg.data);
          setHistory((prev) => [...prev.slice(-29), msg.data]);
        }
      };
      ws.onclose = () => setConnected(false);
    } catch (e) {
      console.error("WS error", e);
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/pressure");
        if (res.ok) {
          const json = await res.json();
          if (json.latest) {
            setData(json.latest);
            setConnected(true);
          }
        }
      } catch (err) {
        setConnected(false);
      }
    }, 300);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [simMode]);

  // Built-in backup simulator for testing UI without ESP32
  useEffect(() => {
    if (!simMode) return;
    const timer = setInterval(() => {
      const t = Date.now() / 600;
      const simulated = {
        heel: Math.max(0, Math.round(1800 + Math.sin(t) * 1400)),
        outer: Math.max(0, Math.round(1100 + Math.cos(t * 1.1) * 900)),
        inner: Math.max(0, Math.round(950 + Math.sin(t * 0.8) * 700)),
        toe: Math.max(0, Math.round(1400 + Math.cos(t * 1.3) * 1200)),
      };
      setData(simulated);
      setHistory((prev) => [...prev.slice(-29), simulated]);
    }, 150);
    return () => clearInterval(timer);
  }, [simMode]);

  const getZoneColor = (val) => {
    if (val > 2800) return "#ef4444"; // Red - High Ulcer Risk
    if (val > 1500) return "#f59e0b"; // Amber - Moderate
    if (val > 200) return "#10b981";  // Emerald - Normal Active
    return "#1e293b";                 // Slate - Resting
  };

  const maxSensor = Math.max(data.heel, data.outer, data.inner, data.toe);
  const riskStatus =
    maxSensor > 2800
      ? { label: "CRITICAL PRESSURE ALERT", color: "bg-red-500/20 text-red-400 border-red-500/50" }
      : maxSensor > 1500
      ? { label: "MODERATE GAIT LOAD", color: "bg-amber-500/20 text-amber-300 border-amber-500/50" }
      : { label: "SAFE PLANTAR DISTRIBUTION", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10 font-sans">
      {/* Top Navbar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            SEVA First Innovation Challenge
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight text-white">
            Smart Diabetic Insole Telemetry
          </h1>
          <p className="text-slate-400 text-sm">
            Real-Time Plantar Pressure & Neuropathic Ulcer Prevention System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSimMode(!simMode)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              simMode
                ? "bg-purple-600 text-white border-purple-400"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {simMode ? "⚡ Demo Simulator: ON" : "Simulate Gait"}
          </button>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${
              connected || simMode
                ? "bg-emerald-950/50 border-emerald-700 text-emerald-300"
                : "bg-red-950/50 border-red-800 text-red-400"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected || simMode ? "bg-emerald-400 animate-pulse" : "bg-red-500"
              }`}
            />
            {simMode ? "Simulated Stream" : connected ? "ESP32 Connected" : "Waiting for ESP32..."}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Anatomical Foot Heatmap */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Live Plantar Heatmap</h2>
            <span className="text-xs text-slate-400">ADC Resolution: 12-Bit (0-4095)</span>
          </div>

          {/* Interactive SVG Insole */}
          <div className="relative w-64 h-[420px] bg-slate-950 rounded-3xl border border-slate-800/80 flex items-center justify-center p-4 shadow-inner">
            <svg viewBox="0 0 200 420" className="w-full h-full">
              {/* Foot Outline */}
              <path
                d="M100,15 C145,15 170,55 165,120 C160,180 145,220 145,270 C145,320 155,365 135,395 C115,415 80,415 65,395 C45,365 55,320 55,270 C55,220 40,180 35,120 C30,55 55,15 100,15 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="3"
              />

              {/* Toe Sensor (D35) */}
              <circle
                cx="75"
                cy="65"
                r="26"
                fill={getZoneColor(data.toe)}
                className="transition-all duration-150"
              />
              <text x="75" y="70" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                {data.toe}
              </text>

              {/* Inner Ball / Medial Forefoot (D34) */}
              <circle
                cx="70"
                cy="145"
                r="28"
                fill={getZoneColor(data.inner)}
                className="transition-all duration-150"
              />
              <text x="70" y="150" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                {data.inner}
              </text>

              {/* Outer Ball / Lateral Midfoot (D33) */}
              <circle
                cx="132"
                cy="165"
                r="28"
                fill={getZoneColor(data.outer)}
                className="transition-all duration-150"
              />
              <text x="132" y="170" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                {data.outer}
              </text>

              {/* Heel Sensor (D32) */}
              <circle
                cx="100"
                cy="345"
                r="35"
                fill={getZoneColor(data.heel)}
                className="transition-all duration-150"
              />
              <text x="100" y="350" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">
                {data.heel}
              </text>
            </svg>
          </div>

          {/* Color Legend */}
          <div className="w-full grid grid-cols-3 gap-2 mt-6 text-center text-xs">
            <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 py-1.5 rounded">
              Normal (&lt;1500)
            </div>
            <div className="bg-amber-950/60 border border-amber-800/60 text-amber-300 py-1.5 rounded">
              Elevated (1500+)
            </div>
            <div className="bg-red-950/60 border border-red-800/60 text-red-300 py-1.5 rounded">
              Risk (&gt;2800)
            </div>
          </div>
        </div>

        {/* Right Column: Sensor Gauges & Diagnostics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Clinical Status Banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${riskStatus.color}`}>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                Clinical Neuropathy Diagnostic Status
              </div>
              <div className="text-xl font-extrabold mt-1">{riskStatus.label}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-75">Peak Reading</div>
              <div className="text-2xl font-black">{maxSensor}</div>
            </div>
          </div>

          {/* 4 Sensor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Heel Strike (Pin D32)", val: data.heel, desc: "Calcaneus Rearfoot Load" },
              { label: "Outer Ball (Pin D33)", val: data.outer, desc: "Lateral Metatarsal Head" },
              { label: "Inner Ball (Pin D34)", val: data.inner, desc: "First Metatarsal Head" },
              { label: "Hallux / Big Toe (Pin D35)", val: data.toe, desc: "Distal Phalanx Propulsion" },
            ].map((sensor, idx) => {
              const pct = Math.min(100, Math.round((sensor.val / 4095) * 100));
              return (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{sensor.label}</h3>
                      <p className="text-xs text-slate-400">{sensor.desc}</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">{sensor.val}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-4 border border-slate-800">
                    <div
                      className="h-full transition-all duration-150 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getZoneColor(sensor.val),
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>0 ADC</span>
                    <span>Load: {pct}%</span>
                    <span>4095 Max</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Telemetry History Bars */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm">Real-Time Peak Pressure Stream (10Hz)</h3>
              <span className="text-xs text-slate-400">Last 30 Samples</span>
            </div>
            <div className="h-32 flex items-end gap-1.5 pt-4 border-b border-slate-800">
              {history.length === 0 ? (
                <div className="w-full text-center text-slate-500 text-xs pb-10">
                  Press an FSR sensor or click &quot;Simulate Gait&quot; to see live waveform...
                </div>
              ) : (
                history.map((pt, i) => {
                  const peak = Math.max(pt.heel, pt.outer, pt.inner, pt.toe);
                  const heightPct = Math.max(6, Math.round((peak / 4095) * 100));
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all duration-75"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: getZoneColor(peak),
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
