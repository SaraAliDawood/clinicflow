'use client';

import { useCallback, useEffect, useState } from 'react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  hours: string;
}
interface Patient {
  id: string;
  name: string;
}
interface Slot {
  startMin: number;
  label: string;
}

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
      setProviders(p);
      if (p[0]) setProviderId(p[0].id);
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

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  async function addPatient() {
    const name = newPatient.trim();
    if (!name) return;
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const p = await res.json();
      setNewPatient('');
      setPatients((prev) => [p, ...prev]);
      setPatientId(p.id);
    }
  }

  async function book(startMin: number, label: string) {
    if (!patientId) {
      setFlash({ kind: 'err', text: 'Select a patient first.' });
      return;
    }
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, patientId, date, startMin }),
    });
    if (res.ok) {
      setFlash({ kind: 'ok', text: `Booked ${label}.` });
      loadSlots(); // the slot should now disappear
    } else {
      const data = await res.json().catch(() => ({}));
      setFlash({ kind: 'err', text: data.error ?? 'Could not book.' });
      loadSlots(); // refresh in case someone else took it
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Book an appointment</h1>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Provider</span>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.specialty} ({p.hours})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Patient</span>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Quick-add patient</span>
          <input
            value={newPatient}
            onChange={(e) => setNewPatient(e.target.value)}
            placeholder="Patient name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button onClick={addPatient} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Add
        </button>
      </div>

      {flash && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            flash.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {flash.text}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-slate-600">Available slots</h2>
        {loadingSlots ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-400">No open slots for this day.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.startMin}
                onClick={() => book(s.startMin, s.label)}
                className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-2 text-sm font-medium text-teal-800 hover:bg-brand hover:text-white"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
