import { prisma } from '@/lib/db';
import { appointmentCreateSchema } from '@/lib/validation';
import { hasConflict } from '@/lib/scheduling';
import { requireUser, json, fail, handleError } from '@/lib/http';

// GET /api/appointments?date=YYYY-MM-DD&providerId=  — list, newest first.
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const providerId = url.searchParams.get('providerId') || undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(date ? { date: new Date(`${date}T00:00:00.000Z`) } : {}),
      ...(providerId ? { providerId } : {}),
    },
    orderBy: [{ date: 'desc' }, { startMin: 'asc' }],
    include: {
      patient: { select: { name: true } },
      provider: { select: { name: true } },
    },
    take: 200,
  });
  return json(appointments);
}

// POST /api/appointments — book a slot, rejecting double-books.
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  try {
    const body = appointmentCreateSchema.parse(await req.json());
    const day = new Date(`${body.date}T00:00:00.000Z`);

    const appointment = await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({ where: { id: body.providerId } });
      if (!provider) throw new Error('Provider not found.');

      const endMin = body.startMin + provider.slotMinutes;
      if (body.startMin < provider.workStartMin || endMin > provider.workEndMin) {
        throw new Error('Requested time is outside the provider’s working hours.');
      }

      const existing = await tx.appointment.findMany({
        where: { providerId: body.providerId, date: day, status: { not: 'CANCELLED' } },
        select: { startMin: true, endMin: true },
      });
      if (hasConflict({ start: body.startMin, end: endMin }, existing.map((e) => ({ start: e.startMin, end: e.endMin })))) {
        throw new Error('That slot is already booked.');
      }

      return tx.appointment.create({
        data: {
          providerId: body.providerId,
          patientId: body.patientId,
          date: day,
          startMin: body.startMin,
          endMin,
          reason: body.reason,
        },
        include: { patient: true, provider: true },
      });
    });

    return json(appointment, 201);
  } catch (err) {
    // A genuine double-book is a conflict, not a bad request.
    if (err instanceof Error && err.message === 'That slot is already booked.') {
      return fail(err.message, 409);
    }
    return handleError(err);
  }
}
