"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, X, Clock, AlertCircle, CheckCircle2, Pill } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const FREQUENCIES = ["Daily", "Weekly", "Twice daily", "Every other day"];

const emptyForm = { name: "", time: "08:00", frequency: "Daily" };

export default function MedicinesPage() {
  const { user } = useAuth();
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const rows = await api("/api/medicines", { user });
    setMeds(rows);
  }

  useEffect(() => {
    if (user) load().catch((e) => setError(e.message));
  }, [user]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(med) {
    setEditing(med.id);
    setForm({ name: med.name, time: med.time, frequency: med.frequency });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api(`/api/medicines/${editing}`, { method: "PUT", body: form, user });
      } else {
        await api("/api/medicines", { method: "POST", body: form, user });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api(`/api/medicines/${id}`, { method: "DELETE", user });
    await load();
  }

  const missedCount = meds.filter((m) => m.missed).length;

  return (
    <div className="px-2 sm:px-4 md:px-6 pb-12 pt-6 sm:pt-8">
      {/* Header */}
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-5 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
            Adherence Tracker
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Diabetic Medicines</h1>
          <div className="mt-1.5 h-0.5 w-16 bg-red-600" />
        </div>

        <div className="flex items-center gap-3">
          {missedCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/30 px-3.5 py-1.5 text-xs font-semibold text-red-400">
              <AlertCircle size={14} />
              {missedCount} Missed Dose Alert
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={startCreate}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-colors hover:bg-red-500"
          >
            <Plus size={16} />
            <span>Add Medication</span>
          </motion.button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-600/50 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Medicines Grid (2 columns on tablet/desktop) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnimatePresence>
          {meds.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`flex items-center justify-between rounded-2xl border p-4 backdrop-blur-sm transition-all hover:border-zinc-700 ${
                m.missed
                  ? "border-red-600/70 bg-red-950/20 shadow-[0_0_20px_rgba(255,0,0,0.15)]"
                  : "border-zinc-800 bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    m.missed ? "bg-red-600/20 text-red-500" : "bg-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <Pill size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-white">{m.name}</p>
                    {m.missed && (
                      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Due Now
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                    <Clock size={12} className="text-zinc-500" />
                    <span>{m.time}</span>
                    <span>·</span>
                    <span className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-2 py-0.5 text-[10px] text-zinc-300">
                      {m.frequency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(m)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {meds.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          <Pill size={36} className="mx-auto text-zinc-600" />
          <p className="mt-3 text-sm">No scheduled medications yet.</p>
          <button
            onClick={startCreate}
            className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Add Your First Medicine
          </button>
        </div>
      )}

      {/* Add / Edit Modal Dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={save}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-white">
                  {editing ? "Edit Medication" : "Add New Medication"}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Medicine Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                    placeholder="e.g. Metformin 500mg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Scheduled Time
                  </label>
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f} className="bg-zinc-900 text-white">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-transparent py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-glowSoft hover:bg-red-500"
                >
                  Save Schedule
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
