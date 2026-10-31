"use client";
import React, { useState, useEffect } from "react";

export default function DashboardPage() {
  const [data, setData] = useState({ heel: 0, outer: 0, inner: 0, toe: 0 });
  const [usbStatus, setUsbStatus] = useState("Connecting...");
  const [simMode, setSimMode] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (simMode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/pressure");
        if (res.ok) {
          const json = await res.json();
          if (json.latest) {
            setData(json.latest);
            setUsbStatus(json.usbPort || "Connected");
            setHistory((prev) => [...prev.slice(-29), json.latest]);
          }
        }
      } catch (e) {
        setUsbStatus("Backend Offline (Run node server.js)");
      }
    }, 120);
    return () => clearInterval(interval);
  }, [simMode]);

  useEffect(() => {
    if (!simMode) return;
    const timer = setInterval(() => {
      const t = Date.now() / 500;
      const sim = {
        heel: Math.max(0, Math.round(1800 + Math.sin(t) * 1500)),
        outer: Math.max(0, Math.round(1200 + Math.cos(t * 1.1) * 900)),
        inner: Math.max(0, Math.round(1000 + Math.sin(t * 0.8) * 800)),
        toe: Math.max(0, Math.round(1500 + Math.cos(t * 1.3) * 1300)),
      };
      setData(sim);
      setUsbStatus("Simulated Stream Active");
      setHistory((prev) => [...prev.slice(-29), sim]);
    }, 120);
    return () => clearInterval(timer);
  }, [simMode]);

  const getColor = (v) => {
    if (v > 2800) return "#ef4444";
    if (v > 1400) return "#f59e0b";
    if (v > 150) return "#10b981";
    return "#1e293b";
  };

  const maxVal = Math.max(data.heel, data.outer, data.inner, data.toe);
  const statusText =
    maxVal > 2800
      ? "CRITICAL ULCER RISK DETECTED"
      : maxVal > 1400
      ? "MODERATE PLANTAR LOAD"
      : "SAFE PLANTAR DISTRIBUTION";
  const statusColor = maxVal > 2800 ? "#ef4444" : maxVal > 1400 ? "#f59e0b" : "#10b981";

  const cardStyle = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", color: "#f8fafc", padding: "28px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", paddingBottom: "20px", borderBottom: "1px solid #1e293b" }}>
          <div>
            <span style={{ background: "#064e3b", color: "#34d399", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px" }}>
              SEVA FIRST INNOVATION CHALLENGE
            </span>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "8px 0 4px 0" }}>
              Smart Diabetic Insole — Live Wired Telemetry
            </h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
              4-Zone FSR 402 Plantar Pressure & Neuropathic Ulcer Prevention System
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => setSimMode(!simMode)}
              style={{
                background: simMode ? "#7c3aed" : "#1e293b",
                color: "#fff",
                border: "1px solid #475569",
                padding: "10px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {simMode ? "⚡ Simulator: ON" : "Test Gait Simulator"}
            </button>
            <div style={{ background: "#0f172a", border: "1px solid #334155", padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#38bdf8" }}>
              🔌 USB Status: {usbStatus}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", marginTop: "24px" }}>
          <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>Anatomical Plantar Heatmap</h3>
            <div style={{ background: "#030712", border: "1px solid #1e293b", borderRadius: "24px", padding: "16px", width: "240px", height: "400px" }}>
              <svg viewBox="0 0 200 420" style={{ width: "100%", height: "100%" }}>
                <path d="M100,15 C145,15 170,55 165,120 C160,180 145,220 145,270 C145,320 155,365 135,395 C115,415 80,415 65,395 C45,365 55,320 55,270 C55,220 40,180 35,120 C30,55 55,15 100,15 Z" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                <circle cx="75" cy="65" r="26" fill={getColor(data.toe)} />
                <text x="75" y="70" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">{data.toe}</text>
                <circle cx="70" cy="145" r="28" fill={getColor(data.inner)} />
                <text x="70" y="150" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">{data.inner}</text>
                <circle cx="132" cy="165" r="28" fill={getColor(data.outer)} />
                <text x="132" y="170" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">{data.outer}</text>
                <circle cx="100" cy="345" r="36" fill={getColor(data.heel)} />
                <text x="100" y="350" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{data.heel}</text>
              </svg>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ ...cardStyle, borderLeft: `6px solid ${statusColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>LIVE CLINICAL STATUS</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: statusColor, marginTop: "4px" }}>{statusText}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>Peak ADC</div>
                <div style={{ fontSize: "28px", fontWeight: 900 }}>{maxVal}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { name: "Heel Sensor (D32)", val: data.heel, sub: "Rearfoot Strike Zone" },
                { name: "Outer Foot (D33)", val: data.outer, sub: "Lateral Midfoot Arch" },
                { name: "Inner Ball (D34)", val: data.inner, sub: "Medial Metatarsal Head" },
                { name: "Big Toe / Hallux (D35)", val: data.toe, sub: "Distal Forefoot Zone" },
              ].map((s, idx) => {
                const pct = Math.min(100, Math.round((s.val / 4095) * 100));
                return (
                  <div key={idx} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "16px" }}>{s.name}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.sub}</div>
                      </div>
                      <div style={{ fontSize: "26px", fontWeight: 900, color: getColor(s.val) === "#1e293b" ? "#38bdf8" : getColor(s.val) }}>{s.val}</div>
                    </div>
                    <div style={{ height: "10px", background: "#030712", borderRadius: "999px", overflow: "hidden", marginTop: "14px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: getColor(s.val) === "#1e293b" ? "#38bdf8" : getColor(s.val), transition: "width 0.1s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Live Pressure Waveform (10Hz USB Stream)</div>
              <div style={{ height: "110px", display: "flex", alignItems: "flex-end", gap: "6px", borderBottom: "1px solid #1e293b", paddingTop: "10px" }}>
                {history.map((pt, i) => {
                  const p = Math.max(pt.heel, pt.outer, pt.inner, pt.toe);
                  const h = Math.max(8, Math.round((p / 4095) * 100));
                  return (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: getColor(p) === "#1e293b" ? "#38bdf8" : getColor(p), borderRadius: "4px 4px 0 0" }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}