import { prisma } from '@/lib/db';
import { requireUser, json } from '@/lib/http';
import { toHHMM } from '@/lib/scheduling';

// GET /api/providers — active providers with their working hours.
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  const providers = await prisma.provider.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  return json(
    providers.map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      slotMinutes: p.slotMinutes,
      hours: `${toHHMM(p.workStartMin)}–${toHHMM(p.workEndMin)}`,
    })),
  );
}
