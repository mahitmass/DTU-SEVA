"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, X } from "lucide-react";
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

  return (
    <div className="px-5 pb-8 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-500">
            Ongoing
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Medicines</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={startCreate}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-glowSoft"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <ul className="mt-6 space-y-3">
        <AnimatePresence>
          {meds.map((m) => (
            <motion.li
              key={m.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className={`flex items-center justify-between rounded-2xl border bg-panel px-4 py-3 ${
                m.missed ? "border-red-600 shadow-glowSoft" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-10 w-1 rounded-full ${m.missed ? "bg-red-600" : "bg-zinc-700"}`} />
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-zinc-400">
                    {m.time} · {m.frequency}
                    {m.missed ? " · missed dose" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(m)} className="rounded-full p-2 text-zinc-400 hover:text-white">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(m.id)} className="rounded-full p-2 text-zinc-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={save}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editing ? "Edit medicine" : "Add medicine"}</h2>
                <button type="button" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2"
                placeholder="Metformin"
              />
              <label className="mt-4 block text-xs uppercase tracking-wider text-zinc-500">Time of day</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2"
              />
              <label className="mt-4 block text-xs uppercase tracking-wider text-zinc-500">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-5 w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white"
              >
                Save
              </motion.button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
