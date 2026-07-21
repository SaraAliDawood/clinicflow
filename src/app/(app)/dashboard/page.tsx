import { prisma } from '@/lib/db';
import { toHHMM } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
  NO_SHOW: 'bg-amber-100 text-amber-700',
};

export default async function DashboardPage() {
  // "Today" as midnight UTC — appointments store their day the same way.
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-ink">Today · {today.toISOString().slice(0, 10)}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Appointments today" value={String(appointments.length)} />
        <Stat label="Still booked" value={String(booked)} />
        <Stat label="Providers · Patients" value={`${providerCount} · ${patientCount}`} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-medium text-slate-600">
          Today’s schedule
        </h2>
        {appointments.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No appointments today.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-mono text-xs">
                    {toHHMM(a.startMin)}–{toHHMM(a.endMin)}
                  </td>
                  <td className="px-6 py-3">{a.patient.name}</td>
                  <td className="px-6 py-3">{a.provider.name}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
