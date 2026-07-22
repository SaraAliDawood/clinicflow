import { prisma } from '@/lib/db';
import { requireUser, json, fail } from '@/lib/http';

// GET /api/patients/:id — full profile with records + appointment history.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      records: { orderBy: { createdAt: 'desc' } },
      appointments: {
        orderBy: { date: 'desc' },
        take: 20,
        include: { provider: { select: { name: true } } },
      },
    },
  });
  if (!patient) return fail('Patient not found.', 404);
  return json(patient);
}
