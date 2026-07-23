'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/billing', label: 'Billing' },
  { href: '/pharmacy', label: 'Pharmacy' },
  { href: '/prescriptions', label: 'Rx' },
  { href: '/team', label: 'Team' },
  { href: '/book', label: 'Book' },
];

export default function AppHeader({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b11]/80 backdrop-blur-xl">
      <div className="relative mx-auto flex w-[88%] max-w-[1600px] items-center justify-between py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-bold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-teal-300 to-emerald-400 text-sm text-slate-900">C</span>
            ClinicFlow
          </Link>
          <nav className="hidden gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 lg:inline">{name}</span>
          <button onClick={logout} className="btn-ghost hidden px-3 py-1.5 text-sm lg:inline-flex">Sign out</button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 text-slate-200 transition hover:bg-white/5 lg:hidden"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="absolute left-0 right-0 top-full mt-px rounded-b-2xl border-b border-white/[0.07] bg-[#0b0f16] p-4 shadow-2xl lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.07] pt-3">
                <span className="text-sm text-slate-500">{name}</span>
                <button onClick={logout} className="btn-ghost px-3 py-1.5 text-sm">Sign out</button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
