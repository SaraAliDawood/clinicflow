'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string; name: string; email: string | null; phone: string | null;
  gender: string | null; bloodType: string | null;
  _count: { appointments: number; records: number };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', address: '' });
  const [busy, setBusy] = useState(false);

  function load(q = '') {
    setLoading(true);
    fetch(`/api/patients${q ? `?query=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json()).then(setPatients).finally(() => setLoading(false));
  }
  useEffect(() => { const t = setTimeout(() => load(query), 250); return () => clearTimeout(t); }, [query]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setBusy(false);
    if (res.ok) { setOpen(false); setForm({ name: '', email: '', phone: '', dob: '', gender: '', bloodType: '', allergies: '', address: '' }); load(query); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Records</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Patients</h1>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary">{open ? 'Close' : '+ New patient'}</button>
      </div>

      {open && (
        <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-3">
          <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <Field label="Date of birth" value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} type="date" />
          <Field label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
          <Field label="Blood type" value={form.bloodType} onChange={(v) => setForm({ ...form, bloodType: v })} />
          <Field label="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} wide />
          <div className="flex items-end"><button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save patient'}</button></div>
        </form>
      )}

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patients by name, email or phone…" className="input" />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Blood</th>
                <th className="px-5 py-3 font-medium">Visits</th>
                <th className="px-5 py-3 font-medium">Records</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.05]">
                  {Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3 w-20 animate-pulse rounded bg-white/10" /></td>)}
                </tr>
              ))}
              {!loading && patients.map((p) => (
                <tr key={p.id} className="border-t border-white/[0.05] transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <Link href={`/patients/${p.id}`} className="font-medium text-white hover:text-teal-300">{p.name}</Link>
                    {p.gender && <span className="ml-2 text-xs text-slate-500">{p.gender}</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{p.phone || p.email || '—'}</td>
                  <td className="px-5 py-3"><span className="chip bg-rose-400/10 text-rose-300">{p.bloodType || '—'}</span></td>
                  <td className="px-5 py-3 text-slate-300">{p._count.appointments}</td>
                  <td className="px-5 py-3 text-slate-300">{p._count.records}</td>
                </tr>
              ))}
              {!loading && patients.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No patients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, wide }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="input [color-scheme:dark]" />
    </label>
  );
}
