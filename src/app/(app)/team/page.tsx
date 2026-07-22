'use client';

import { useEffect, useState } from 'react';

interface Provider { id: string; name: string; specialty: string; hours: string; slotMinutes: number; active: boolean }
interface Staff { id: string; name: string; email: string; role: string }

const ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'];

export default function TeamPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [me, setMe] = useState<{ role: string; userId: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', specialty: '', start: '09:00', end: '17:00', slotMinutes: '30' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function loadProviders() { fetch('/api/providers?all=1').then((r) => r.json()).then(setProviders); }
  function loadStaff() { fetch('/api/users').then((r) => r.ok ? r.json() : []).then(setStaff); }
  useEffect(() => {
    loadProviders();
    fetch('/api/auth/me').then((r) => r.json()).then((m) => { setMe(m); if (m.role === 'ADMIN') loadStaff(); });
  }, []);

  const isAdmin = me?.role === 'ADMIN';

  async function addDoctor(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const res = await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, specialty: form.specialty, start: form.start, end: form.end, slotMinutes: parseInt(form.slotMinutes) || 30 }) });
    setBusy(false);
    if (res.ok) { setOpen(false); setForm({ name: '', specialty: '', start: '09:00', end: '17:00', slotMinutes: '30' }); loadProviders(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Could not add doctor.'); }
  }
  async function toggle(id: string, active: boolean) {
    await fetch(`/api/providers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
    loadProviders();
  }
  async function setRole(id: string, role: string) {
    await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    loadStaff();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Administration</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Team</h1>
      </div>

      {/* Doctors */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Doctors <span className="text-slate-500">({providers.length})</span></h2>
          {isAdmin && <button onClick={() => setOpen((o) => !o)} className="btn-primary">{open ? 'Close' : '+ Add doctor'}</button>}
        </div>

        {open && (
          <form onSubmit={addDoctor} className="card grid gap-3 p-5 sm:grid-cols-3">
            <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} />
            <F label="Specialty" v={form.specialty} on={(v) => setForm({ ...form, specialty: v })} />
            <F label="Slot (min)" v={form.slotMinutes} on={(v) => setForm({ ...form, slotMinutes: v })} type="number" />
            <F label="Start" v={form.start} on={(v) => setForm({ ...form, start: v })} type="time" />
            <F label="End" v={form.end} on={(v) => setForm({ ...form, end: v })} type="time" />
            <div className="flex items-end"><button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save doctor'}</button></div>
            {err && <p className="text-sm text-rose-400 sm:col-span-3">{err}</p>}
          </form>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <div key={p.id} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-white">{p.name}</p>
                  <p className="text-sm text-teal-300/90">{p.specialty}</p>
                </div>
                <span className={`chip ${p.active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}>{p.active ? 'Active' : 'Off'}</span>
              </div>
              <p className="mt-3 font-mono text-xs text-slate-500">{p.hours} · {p.slotMinutes}-min slots</p>
              {isAdmin && <button onClick={() => toggle(p.id, !p.active)} className="btn-ghost mt-4 w-full py-1.5 text-xs">{p.active ? 'Deactivate' : 'Activate'}</button>}
            </div>
          ))}
        </div>
      </section>

      {/* Staff */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Staff accounts <span className="text-slate-500">({staff.length})</span></h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Email</th><th className="px-5 py-3 font-medium">Role</th>
              </tr></thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id} className="border-t border-white/[0.05]">
                    <td className="px-5 py-3 text-slate-200">{u.name}</td>
                    <td className="px-5 py-3 text-slate-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} disabled={u.id === me?.userId}
                        className="input w-auto py-1.5 text-xs disabled:opacity-50">
                        {ROLES.map((r) => <option key={r} className="bg-[#0e131b]">{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function F({ label, v, on, type = 'text' }: { label: string; v: string; on: (x: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} required className="input [color-scheme:dark]" />
    </label>
  );
}
