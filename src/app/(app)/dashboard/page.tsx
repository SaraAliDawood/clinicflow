import { prisma } from '@/lib/db';
import { toHHMM } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, string> = {
  BOOKED: 'bg-sky-400/15 text-sky-300',
  COMPLETED: 'bg-emerald-400/15 text-emerald-300',
  CANCELLED: 'bg-slate-500/15 text-slate-400',
  NO_SHOW: 'bg-amber-400/15 text-amber-300',
};

export default async function DashboardPage() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [appointments, providerCount, patientCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: today },
      orderBy: { startMin: 'asc' },
      include: { patient: { select: { name: true } }, provider: { select: { name: true } } },
    }),
    prisma.provider.count({ where: { active: true } }),
    prisma.patient.count(),
  ]);

  const booked = appointments.filter((a) => a.status === 'BOOKED').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-teal-300/80">Overview</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          Today · <span className="text-slate-400">{today.toISOString().slice(0, 10)}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Appointments" value={String(appointments.length)} accent />
        <Stat label="Still booked" value={String(booked)} />
        <Stat label="Completed" value={String(completed)} />
        <Stat label="Providers · Patients" value={`${providerCount} · ${patientCount}`} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-white">Today’s schedule</h2>
          <span className="text-xs text-slate-500">{appointments.length} total</span>
        </div>
        {appointments.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No appointments today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-t border-white/[0.05] transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-mono text-xs text-teal-300">{toHHMM(a.startMin)}–{toHHMM(a.endMin)}</td>
                    <td className="px-5 py-3 text-slate-200">{a.patient.name}</td>
                    <td className="px-5 py-3 text-slate-400">{a.provider.name}</td>
                    <td className="px-5 py-3"><span className={`chip ${STATUS[a.status]}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card card-hover p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${accent ? 'text-teal-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
