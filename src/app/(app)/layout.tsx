import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/billing', label: 'Billing' },
  { href: '/book', label: 'Book' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b11]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-[88%] max-w-[1600px] items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-display font-bold text-white">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-teal-300 to-emerald-400 text-sm text-slate-900">C</span>
              ClinicFlow
            </span>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">{session.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-[88%] max-w-[1600px] py-8">{children}</main>
    </div>
  );
}
