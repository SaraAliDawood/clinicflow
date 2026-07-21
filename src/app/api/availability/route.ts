import { prisma } from '@/lib/db';
import { generateSlots, toHHMM } from '@/lib/scheduling';
import { requireUser, json, fail } from '@/lib/http';

// GET /api/availability?providerId=&date=YYYY-MM-DD
// Returns bookable slots for a provider on a day (working hours minus booked).
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const providerId = url.searchParams.get('providerId');
  const date = url.searchParams.get('date');
  if (!providerId || !date) return fail('providerId and date are required.');

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return fail('Provider not found.', 404);

  const day = new Date(`${date}T00:00:00.000Z`);
  const booked = await prisma.appointment.findMany({
    where: { providerId, date: day, status: { not: 'CANCELLED' } },
    select: { startMin: true, endMin: true },
  });

  const slots = generateSlots(
    provider.workStartMin,
    provider.workEndMin,
    provider.slotMinutes,
    booked.map((b) => ({ start: b.startMin, end: b.endMin })),
  );

  return json({
    date,
    provider: { id: provider.id, name: provider.name, slotMinutes: provider.slotMinutes },
    slots: slots.map((s) => ({ startMin: s.start, endMin: s.end, label: toHHMM(s.start) })),
  });
}
