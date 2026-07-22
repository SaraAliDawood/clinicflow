'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface MedRec { id: string; kind: string; title: string; details: string | null; authorName: string | null; createdAt: string }
interface Appt { id: string; date: string; startMin: number; status: string; provider: { name: string } }
interface Patient {
  id: string; name: string; email: string | null; phone: string | null; dob: string | null;
  gender: string | null; bloodType: string | null; allergies: string | null; address: string | null;
  records: MedRec[]; appointments: Appt[];
}

const KIND_STYLE: Record<string, string> = {
  VISIT: 'bg-sky-400/15 text-sky-300', NOTE: 'bg-slate-400/15 text-slate-300',
  DIAGNOSIS: 'bg-teal-400/15 text-teal-300', LAB: 'bg-violet-400/15 text-violet-300',
};

export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState({ kind: 'NOTE', title: '', details: '' });
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/patients/${id}`).then((r) => r.json()).then((d) => setP(d.error ? null : d)).finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!rec.title.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/patients/${id}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
    setBusy(false);
    if (res.ok) { setRec({ kind: 'NOTE', title: '', details: '' }); load(); }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />;
  if (!p) return <p className="text-slate-400">Patient not found. <Link href="/patients" className="text-teal-300">Back</Link></p>;

  return (
    <div className="space-y-6">
      <Link href="/patients" className="text-sm text-slate-400 hover:text-teal-300">← All patients</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-emerald-400 font-display text-xl font-bold text-slate-900">
              {p.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{p.name}</h1>
              <p className="text-sm text-slate-400">{p.gender || '—'}{p.dob ? ` · ${new Date(p.dob).toLocaleDateString()}` : ''}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Blood type" value={p.bloodType} />
            <Row label="Phone" value={p.phone} />
            <Row label="Email" value={p.email} />
            <Row label="Allergies" value={p.allergies} />
            <Row label="Address" value={p.address} />
          </dl>
        </div>

        {/* Records + history */}
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={addRecord} className="card p-5">
            <h2 className="mb-3 font-display text-sm font-semibold text-white">Add medical record</h2>
            <div className="flex flex-wrap gap-3">
              <select value={rec.kind} onChange={(e) => setRec({ ...rec, kind: e.target.value })} className="input w-auto">
                {['NOTE', 'VISIT', 'DIAGNOSIS', 'LAB'].map((k) => <option key={k} className="bg-[#0e131b]">{k}</option>)}
              </select>
              <input value={rec.title} onChange={(e) => setRec({ ...rec, title: e.target.value })} placeholder="Title" className="input flex-1 min-w-[160px]" />
            </div>
            <textarea value={rec.details} onChange={(e) => setRec({ ...rec, details: e.target.value })} placeholder="Details (optional)" rows={2} className="input mt-3 resize-none" />
            <button type="submit" disabled={busy} className="btn-primary mt-3">{busy ? 'Saving…' : 'Add record'}</button>
          </form>

          <section className="card overflow-hidden">
            <h2 className="border-b border-white/[0.07] px-5 py-4 font-display text-sm font-semibold text-white">Medical history</h2>
            {p.records.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No records yet.</p> : (
              <ul className="divide-y divide-white/[0.05]">
                {p.records.map((r) => (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{r.title}</span>
                      <span className={`chip ${KIND_STYLE[r.kind]}`}>{r.kind}</span>
                    </div>
                    {r.details && <p className="mt-1 text-sm text-slate-400">{r.details}</p>}
                    <p className="mt-1 text-xs text-slate-600">{new Date(r.createdAt).toLocaleString()}{r.authorName ? ` · ${r.authorName}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-white/[0.07] px-5 py-4 font-display text-sm font-semibold text-white">Appointments</h2>
            {p.appointments.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No appointments.</p> : (
              <ul className="divide-y divide-white/[0.05]">
                {p.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate-300">{new Date(a.date).toLocaleDateString()} · {a.provider.name}</span>
                    <span className="chip bg-white/5 text-slate-400">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value || '—'}</dd>
    </div>
  );
}
