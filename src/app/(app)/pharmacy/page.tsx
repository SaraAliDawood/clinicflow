'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatMoney, toCents } from '@/lib/money';

interface Medicine { id: string; name: string; sku: string; unit: string; stock: number; priceCents: number }
interface CartLine { medicineId: string; name: string; unit: string; unitPriceCents: number; stock: number; quantity: number }
interface Movement { id: string; delta: number; reason: string; createdAt: string; medicine: { name: string } }
interface Patient { id: string; name: string }

const REASON_STYLE: Record<string, string> = {
  INITIAL: 'bg-slate-500/15 text-slate-300', RESTOCK: 'bg-emerald-400/15 text-emerald-300',
  DISPENSE: 'bg-rose-400/15 text-rose-300', ADJUST: 'bg-amber-400/15 text-amber-300',
};

export default function PharmacyPage() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState('');

  function loadMeds(q = '') { setLoading(true); fetch(`/api/medicines${q ? `?query=${encodeURIComponent(q)}` : ''}`).then((r) => r.json()).then(setMeds).finally(() => setLoading(false)); }
  function loadMovements() { fetch('/api/stock-movements').then((r) => r.json()).then(setMovements); }
  useEffect(() => { const t = setTimeout(() => loadMeds(query), 250); return () => clearTimeout(t); }, [query]);
  useEffect(() => { loadMovements(); fetch('/api/patients').then((r) => r.json()).then(setPatients); }, []);

  function addToCart(id: string) {
    const m = meds.find((x) => x.id === id); if (!m) return;
    setCart((c) => c.find((l) => l.medicineId === id) ? c.map((l) => l.medicineId === id ? { ...l, quantity: l.quantity + 1 } : l)
      : [...c, { medicineId: m.id, name: m.name, unit: m.unit, unitPriceCents: m.priceCents, stock: m.stock, quantity: 1 }]);
    setPick('');
  }
  function setQty(id: string, q: number) { setCart((c) => c.map((l) => l.medicineId === id ? { ...l, quantity: Math.max(1, q) } : l)); }
  function removeLine(id: string) { setCart((c) => c.filter((l) => l.medicineId !== id)); }

  const cartTotal = useMemo(() => cart.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0), [cart]);
  const overStock = cart.some((l) => l.quantity > l.stock);

  async function dispense() {
    if (!cart.length) return;
    setBusy(true); setFlash(null);
    const res = await fetch('/api/dispenses', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, items: cart.map((l) => ({ medicineId: l.medicineId, quantity: l.quantity })) }) });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setFlash({ kind: 'ok', text: `Dispensed ${d.number} — ${formatMoney(d.totalCents)}. Stock updated.` });
      setCart([]); loadMeds(query); loadMovements();
    } else { const e = await res.json().catch(() => ({})); setFlash({ kind: 'err', text: e.error ?? 'Dispense failed.' }); loadMeds(query); }
  }

  async function restock(id: string) {
    await fetch(`/api/medicines/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restock: 20 }) });
    loadMeds(query); loadMovements();
  }

  const lowStock = meds.filter((m) => m.stock <= 10).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Pharmacy</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Dispensing &amp; Inventory</h1>
      </div>

      {flash && <div className={`rounded-xl border px-4 py-2.5 text-sm ${flash.kind === 'ok' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/30 bg-rose-400/10 text-rose-300'}`}>{flash.text}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dispense counter */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-sm font-semibold text-white">Dispense counter</h2>
          <div className="flex flex-wrap gap-2">
            <select value={pick} onChange={(e) => e.target.value && addToCart(e.target.value)} className="input flex-1 min-w-[200px]">
              <option value="" className="bg-[#0e131b]">Search &amp; add a medicine…</option>
              {meds.map((m) => <option key={m.id} value={m.id} disabled={m.stock === 0} className="bg-[#0e131b]">{m.name} — {formatMoney(m.priceCents)} (stock {m.stock})</option>)}
            </select>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input w-48">
              <option value="" className="bg-[#0e131b]">Walk-in (no patient)</option>
              {patients.map((p) => <option key={p.id} value={p.id} className="bg-[#0e131b]">{p.name}</option>)}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            {cart.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Add medicines to dispense.</p>}
            {cart.map((l) => (
              <div key={l.medicineId} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{l.name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(l.unitPriceCents)} · {l.stock} in stock</p>
                </div>
                <input type="number" min="1" value={l.quantity} onChange={(e) => setQty(l.medicineId, parseInt(e.target.value) || 1)}
                  className={`input w-20 ${l.quantity > l.stock ? 'border-rose-400/60' : ''}`} />
                <span className="w-24 text-right text-sm font-medium text-white">{formatMoney(l.quantity * l.unitPriceCents)}</span>
                <button onClick={() => removeLine(l.medicineId)} className="text-slate-500 hover:text-rose-400">✕</button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="text-sm text-slate-400">Total <span className="ml-2 font-display text-xl font-bold text-teal-300">{formatMoney(cartTotal)}</span></span>
              <button onClick={dispense} disabled={busy || overStock} className="btn-primary">{overStock ? 'Not enough stock' : busy ? 'Dispensing…' : 'Dispense & update stock'}</button>
            </div>
          )}
        </section>

        {/* Stock movements audit */}
        <section className="card overflow-hidden">
          <h2 className="border-b border-white/[0.07] px-5 py-4 font-display text-sm font-semibold text-white">Stock activity</h2>
          <ul className="max-h-[360px] divide-y divide-white/[0.05] overflow-y-auto">
            {movements.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">No activity.</li>}
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <div>
                  <p className="text-slate-300">{m.medicine.name}</p>
                  <p className="text-xs text-slate-600">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`chip ${REASON_STYLE[m.reason]}`}>{m.reason}</span>
                  <span className={`font-mono text-sm ${m.delta < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{m.delta > 0 ? '+' : ''}{m.delta}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Inventory */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-sm font-semibold text-white">Inventory</h2>
          {lowStock > 0 && <span className="chip bg-amber-400/15 text-amber-300">⚠ {lowStock} low on stock</span>}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicine by name or SKU…" className="input" />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Medicine</th><th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Price</th><th className="px-5 py-3 font-medium">Stock</th><th className="px-5 py-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="border-t border-white/[0.05]">{Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3 w-16 animate-pulse rounded bg-white/10" /></td>)}</tr>))}
                {!loading && meds.map((m) => (
                  <tr key={m.id} className="border-t border-white/[0.05]">
                    <td className="px-5 py-3 text-slate-200">{m.name} <span className="text-xs text-slate-500">/ {m.unit}</span></td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.sku}</td>
                    <td className="px-5 py-3 text-slate-300">{formatMoney(m.priceCents)}</td>
                    <td className="px-5 py-3"><span className={`chip ${m.stock <= 10 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{m.stock}</span></td>
                    <td className="px-5 py-3 text-right"><button onClick={() => restock(m.id)} className="btn-ghost py-1 text-xs">Restock +20</button></td>
                  </tr>
                ))}
                {!loading && meds.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No medicines found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
