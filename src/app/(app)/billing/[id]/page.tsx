'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

interface Item { id: string; description: string; quantity: number; unitPriceCents: number }
interface Invoice {
  id: string; number: string; status: string; currency: string; totalCents: number;
  issuedAt: string; dueAt: string | null; notes: string | null;
  patient: { name: string; email: string | null; phone: string | null };
  items: Item[];
}

const STATUS: Record<string, string> = {
  UNPAID: 'bg-amber-400/15 text-amber-300', PAID: 'bg-emerald-400/15 text-emerald-300', VOID: 'bg-slate-500/15 text-slate-400',
};

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() { setLoading(true); fetch(`/api/invoices/${id}`).then((r) => r.json()).then((d) => setInv(d.error ? null : d)).finally(() => setLoading(false)); }
  useEffect(load, [id]);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setBusy(false); load();
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />;
  if (!inv) return <p className="text-slate-400">Invoice not found. <Link href="/billing" className="text-teal-300">Back</Link></p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/billing" className="text-sm text-slate-400 hover:text-teal-300">← All invoices</Link>

      <div className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{inv.number}</h1>
            <p className="mt-1 text-sm text-slate-400">Issued {new Date(inv.issuedAt).toLocaleDateString()}{inv.dueAt ? ` · Due ${new Date(inv.dueAt).toLocaleDateString()}` : ''}</p>
          </div>
          <span className={`chip ${STATUS[inv.status]}`}>{inv.status}</span>
        </div>

        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Bill to</p>
          <p className="mt-1 font-medium text-white">{inv.patient.name}</p>
          <p className="text-sm text-slate-400">{inv.patient.phone || inv.patient.email || ''}</p>
        </div>

        <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Unit</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it) => (
              <tr key={it.id} className="border-t border-white/[0.05]">
                <td className="py-3 text-slate-200">{it.description}</td>
                <td className="py-3 text-right text-slate-400">{it.quantity}</td>
                <td className="py-3 text-right text-slate-400">{formatMoney(it.unitPriceCents, inv.currency)}</td>
                <td className="py-3 text-right text-slate-200">{formatMoney(it.quantity * it.unitPriceCents, inv.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mt-4 flex justify-end border-t border-white/[0.08] pt-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
            <p className="font-display text-3xl font-bold text-teal-300">{formatMoney(inv.totalCents, inv.currency)}</p>
          </div>
        </div>

        {inv.status !== 'VOID' && (
          <div className="mt-6 flex gap-2">
            {inv.status !== 'PAID' && <button onClick={() => setStatus('PAID')} disabled={busy} className="btn-primary">Mark as paid</button>}
            {inv.status === 'PAID' && <button onClick={() => setStatus('UNPAID')} disabled={busy} className="btn-ghost">Mark unpaid</button>}
            <button onClick={() => setStatus('VOID')} disabled={busy} className="btn-ghost">Void</button>
          </div>
        )}
      </div>
    </div>
  );
}
