'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney, toCents } from '@/lib/money';

interface Invoice {
  id: string; number: string; status: string; totalCents: number; currency: string;
  issuedAt: string; patient: { name: string }; _count: { items: number };
}
interface Patient { id: string; name: string }
interface Line { description: string; quantity: string; unitPrice: string }

const STATUS: Record<string, string> = {
  UNPAID: 'bg-amber-400/15 text-amber-300',
  PAID: 'bg-emerald-400/15 text-emerald-300',
  VOID: 'bg-slate-500/15 text-slate-400',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/invoices').then((r) => r.json()).then(setInvoices).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    fetch('/api/patients').then((r) => r.json()).then((p: Patient[]) => { setPatients(p); if (p[0]) setPatientId(p[0].id); });
  }, []);

  const billed = invoices.reduce((s, i) => s + (i.status !== 'VOID' ? i.totalCents : 0), 0);
  const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalCents, 0);
  const outstanding = invoices.filter((i) => i.status === 'UNPAID').reduce((s, i) => s + i.totalCents, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const items = lines.filter((l) => l.description.trim()).map((l) => ({
        description: l.description, quantity: parseInt(l.quantity) || 1, unitPriceCents: toCents(l.unitPrice || '0'),
      }));
      if (!items.length) throw new Error('Add at least one line item.');
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, items }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Could not create invoice.'); }
      setOpen(false); setLines([{ description: '', quantity: '1', unitPrice: '' }]); load();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Error'); } finally { setBusy(false); }
  }

  const draftTotal = lines.reduce((s, l) => s + (parseInt(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Finance</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Billing &amp; Invoices</h1>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary">{open ? 'Close' : '+ New invoice'}</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total billed" value={formatMoney(billed)} accent />
        <Stat label="Collected" value={formatMoney(paid)} />
        <Stat label="Outstanding" value={formatMoney(outstanding)} warn />
      </div>

      {open && (
        <form onSubmit={submit} className="card space-y-3 p-5">
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Patient</span>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
              {patients.map((p) => <option key={p.id} value={p.id} className="bg-[#0e131b]">{p.name}</option>)}
            </select>
          </label>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <input value={l.description} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Description (e.g. Consultation)" className="input flex-1 min-w-[160px]" />
                <input value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} type="number" min="1" placeholder="Qty" className="input w-20" />
                <input value={l.unitPrice} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, unitPrice: e.target.value } : x))} type="number" step="0.01" placeholder="Unit price" className="input w-32" />
              </div>
            ))}
            <button type="button" onClick={() => setLines([...lines, { description: '', quantity: '1', unitPrice: '' }])} className="text-sm text-teal-300 hover:text-teal-200">+ Add line</button>
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total: <span className="font-semibold text-white">{formatMoney(toCents(draftTotal))}</span></span>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create invoice'}</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Issued</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.05]">{Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3 w-20 animate-pulse rounded bg-white/10" /></td>)}</tr>
              ))}
              {!loading && invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-white/[0.05] transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3"><Link href={`/billing/${inv.id}`} className="font-mono text-xs text-teal-300 hover:underline">{inv.number}</Link></td>
                  <td className="px-5 py-3 text-slate-300">{inv.patient.name}</td>
                  <td className="px-5 py-3 font-medium text-white">{formatMoney(inv.totalCents, inv.currency)}</td>
                  <td className="px-5 py-3"><span className={`chip ${STATUS[inv.status]}`}>{inv.status}</span></td>
                  <td className="px-5 py-3 text-slate-500">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && invoices.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="card card-hover p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ? 'text-teal-300' : warn ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
