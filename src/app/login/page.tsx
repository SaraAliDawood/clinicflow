'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(600px 400px at 20% 20%, rgba(45,212,191,0.25), transparent 60%), radial-gradient(600px 500px at 90% 90%, rgba(56,189,248,0.18), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-2 font-display text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-300 to-emerald-400 text-slate-900">C</span>
          ClinicFlow
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
            Scheduling,<br />solved.
          </h1>
          <p className="mt-4 max-w-sm text-slate-300">
            Real-time availability, zero double-bookings, and a live view of your clinic’s day —
            in one clean console.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Live availability', 'Conflict-free booking', 'Today at a glance'].map((t) => (
              <span key={t} className="chip border border-white/10 bg-white/5 text-slate-300">{t}</span>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-slate-500">Built by Sara Dawood</div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-bold text-white">ClinicFlow</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Sign in to the scheduler.' : 'Get started in seconds.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <Field label="Name" type="text" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            )}
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="mt-5 w-full text-center text-sm text-slate-400 transition hover:text-teal-300"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>

          <p className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-center text-xs text-slate-500">
            Demo login — <span className="text-slate-300">admin@clinicflow.dev</span> / <span className="text-slate-300">password123</span>
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="input" />
    </label>
  );
}
