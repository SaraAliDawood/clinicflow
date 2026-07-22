'use client';

import { useEffect, useState } from 'react';
import { formatMoney, toCents } from '@/lib/money';

interface Medicine { id: string; name: string; sku: string; unit: string; stock: number; priceCents: number }

export default function PharmacyPage() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', unit: 'tablet', stock: '', price: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function load() { setLoading(true); fetch('/api/medicines').then((r) => r.json()).then(setMeds).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const res = await fetch('/api/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, sku: form.sku, unit: form.unit, stock: parseInt(form.stock) || 0, priceCents: toCents(form.price || '0') }) });
    setBusy(false);
    if (res.ok) { setOpen(false); setForm({ name: '', sku: '', unit: 'tablet', stock: '', price: '' }); load(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Could not add.'); }
  }
  async function restock(id: string, delta: number) {
    await fetch(`/api/medicines/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restock: delta }) });
    load();
  }

  const lowStock = meds.filter((m) => m.stock <= 10).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Pharmacy</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Inventory</h1>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary">{open ? 'Close' : '+ Add medicine'}</button>
      </div>

      {lowStock > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          ⚠ {lowStock} item{lowStock > 1 ? 's' : ''} low on stock (≤ 10).
        </div>
      )}

      {open && (
        <form onSubmit={add} className="card grid gap-3 p-5 sm:grid-cols-3">
          <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} />
          <F label="SKU" v={form.sku} on={(v) => setForm({ ...form, sku: v })} />
          <F label="Unit" v={form.unit} on={(v) => setForm({ ...form, unit: v })} />
          <F label="Initial stock" v={form.stock} on={(v) => setForm({ ...form, stock: v })} type="number" />
          <F label="Unit price" v={form.price} on={(v) => setForm({ ...form, price: v })} type="number" />
          <div className="flex items-end"><button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Add'}</button></div>
          {err && <p className="text-sm text-rose-400 sm:col-span-3">{err}</p>}
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-medium">Medicine</th><th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Price</th><th className="px-5 py-3 font-medium">Stock</th><th className="px-5 py-3 font-medium">Restock</th>
            </tr></thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.05]">{Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3 w-16 animate-pulse rounded bg-white/10" /></td>)}</tr>
              ))}
              {!loading && meds.map((m) => (
                <tr key={m.id} className="border-t border-white/[0.05]">
                  <td className="px-5 py-3 text-slate-200">{m.name} <span className="text-xs text-slate-500">/ {m.unit}</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.sku}</td>
                  <td className="px-5 py-3 text-slate-300">{formatMoney(m.priceCents)}</td>
                  <td className="px-5 py-3"><span className={`chip ${m.stock <= 10 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{m.stock}</span></td>
                  <td className="px-5 py-3"><button onClick={() => restock(m.id, 20)} className="btn-ghost py-1 text-xs">+20</button></td>
                </tr>
              ))}
              {!loading && meds.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No medicines yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function F({ label, v, on, type = 'text' }: { label: string; v: string; on: (x: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input type={type} step="0.01" value={v} onChange={(e) => on(e.target.value)} required className="input" />
    </label>
  );
}
