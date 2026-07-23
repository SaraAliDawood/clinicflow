'use client';

import { useEffect, useState } from 'react';

interface Rx { id: string; number: string; createdAt: string; authorName: string | null; patient: { name: string }; _count: { items: number } }
interface Patient { id: string; name: string }
interface Medicine { id: string; name: string; stock: number }
interface Line { medicineId: string; quantity: string; dosage: string }

export default function PrescriptionsPage() {
  const [list, setList] = useState<Rx[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ medicineId: '', quantity: '1', dosage: '' }]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function load() { setLoading(true); fetch('/api/prescriptions').then((r) => r.json()).then(setList).finally(() => setLoading(false)); }
  useEffect(() => {
    load();
    fetch('/api/patients').then((r) => r.json()).then((p: Patient[]) => { setPatients(p); if (p[0]) setPatientId(p[0].id); });
    fetch('/api/medicines').then((r) => r.json()).then((m: Medicine[]) => { setMeds(m); });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const items = lines.filter((l) => l.medicineId).map((l) => ({ medicineId: l.medicineId, quantity: parseInt(l.quantity) || 1, dosage: l.dosage || undefined }));
      if (!items.length) throw new Error('Add at least one medicine.');
      const res = await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, notes, items }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Could not issue prescription.'); }
      setOpen(false); setLines([{ medicineId: '', quantity: '1', dosage: '' }]); setNotes(''); load();
      fetch('/api/medicines').then((r) => r.json()).then(setMeds);
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Error'); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Pharmacy</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Prescriptions</h1>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary">{open ? 'Close' : '+ New prescription'}</button>
      </div>

      {open && (
        <form onSubmit={submit} className="card space-y-3 p-5">
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Patient</span>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
              {patients.map((p) => <option key={p.id} value={p.id} className="bg-[#0e131b]">{p.name}</option>)}
            </select>
          </label>
          {lines.map((l, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <select value={l.medicineId} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, medicineId: e.target.value } : x))} className="input flex-1 min-w-[160px]">
                <option value="" className="bg-[#0e131b]">Select medicine…</option>
                {meds.map((m) => <option key={m.id} value={m.id} className="bg-[#0e131b]">{m.name} (stock {m.stock})</option>)}
              </select>
              <input value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} type="number" min="1" placeholder="Qty" className="input w-20" />
              <input value={l.dosage} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, dosage: e.target.value } : x))} placeholder="Dosage e.g. 1x daily" className="input w-40" />
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { medicineId: '', quantity: '1', dosage: '' }])} className="text-sm text-teal-300 hover:text-teal-200">+ Add medicine</button>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="input resize-none" />
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <button disabled={busy} className="btn-primary">{busy ? 'Issuing…' : 'Issue prescription'}</button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3 font-medium">Rx</th><th className="px-5 py-3 font-medium">Patient</th>
            <th className="px-5 py-3 font-medium">Items</th><th className="px-5 py-3 font-medium">By</th><th className="px-5 py-3 font-medium">Date</th>
          </tr></thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-white/[0.05]">{Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3 w-16 animate-pulse rounded bg-white/10" /></td>)}</tr>
            ))}
            {!loading && list.map((r) => (
              <tr key={r.id} className="border-t border-white/[0.05]">
                <td className="px-5 py-3 font-mono text-xs text-teal-300">{r.number}</td>
                <td className="px-5 py-3 text-slate-300">{r.patient.name}</td>
                <td className="px-5 py-3 text-slate-400">{r._count.items}</td>
                <td className="px-5 py-3 text-slate-400">{r.authorName || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && list.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No prescriptions yet.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
