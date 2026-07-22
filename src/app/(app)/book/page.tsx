'use client';

import { useCallback, useEffect, useState } from 'react';

interface Provider { id: string; name: string; specialty: string; hours: string }
interface Patient { id: string; name: string }
interface Slot { startMin: number; label: string }

export default function BookPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providerId, setProviderId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newPatient, setNewPatient] = useState('');
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/providers').then((r) => r.json()).then((p: Provider[]) => {
      setProviders(p); if (p[0]) setProviderId(p[0].id);
    });
    loadPatients();
  }, []);

  function loadPatients() {
    fetch('/api/patients').then((r) => r.json()).then(setPatients);
  }

  const loadSlots = useCallback(() => {
    if (!providerId || !date) return;
    setLoadingSlots(true);
    fetch(`/api/availability?providerId=${providerId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [providerId, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function addPatient() {
    const name = newPatient.trim();
    if (!name) return;
    const res = await fetch('/api/patients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const p = await res.json();
      setNewPatient(''); setPatients((prev) => [p, ...prev]); setPatientId(p.id);
    }
  }

  async function book(startMin: number, label: string) {
    if (!patientId) { setFlash({ kind: 'err', text: 'Select a patient first.' }); return; }
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, patientId, date, startMin }),
    });
    if (res.ok) { setFlash({ kind: 'ok', text: `Booked ${label}.` }); loadSlots(); }
    else { const d = await res.json().catch(() => ({})); setFlash({ kind: 'err', text: d.error ?? 'Could not book.' }); loadSlots(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Scheduler</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Book an appointment</h1>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Provider</span>
          <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="input">
            {providers.map((p) => <option key={p.id} value={p.id} className="bg-[#0e131b]">{p.name} — {p.specialty} ({p.hours})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input [color-scheme:dark]" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Patient</span>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
            <option value="" className="bg-[#0e131b]">Select…</option>
            {patients.map((p) => <option key={p.id} value={p.id} className="bg-[#0e131b]">{p.name}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Quick-add patient</span>
          <input value={newPatient} onChange={(e) => setNewPatient(e.target.value)} placeholder="Patient name" className="input w-56" />
        </label>
        <button onClick={addPatient} className="btn-ghost">Add</button>
      </div>

      {flash && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm ${flash.kind === 'ok' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/30 bg-rose-400/10 text-rose-300'}`}>
          {flash.text}
        </div>
      )}

      <section className="card p-5">
        <h2 className="mb-4 font-display text-sm font-semibold text-white">Available slots</h2>
        {loadingSlots ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-500">No open slots for this day.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {slots.map((s) => (
              <button key={s.startMin} onClick={() => book(s.startMin, s.label)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition
                           hover:border-teal-400/60 hover:bg-teal-400/10 hover:text-teal-200 hover:-translate-y-0.5
                           focus:ring-4 focus:ring-teal-400/15">
                {s.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
