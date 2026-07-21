import { prisma } from '@/lib/db';
import { appointmentStatusSchema } from '@/lib/validation';
import { requireUser, json, fail, handleError } from '@/lib/http';

// PATCH /api/appointments/:id — update status (complete / cancel / no-show).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const { status } = appointmentStatusSchema.parse(await req.json());
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return fail('Appointment not found.', 404);

    const updated = await prisma.appointment.update({ where: { id }, data: { status } });
    return json({ id: updated.id, status: updated.status });
  } catch (err) {
    return handleError(err);
  }
}
