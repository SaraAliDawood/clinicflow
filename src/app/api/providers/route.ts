import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, fail, handleError } from '@/lib/http';
import { toHHMM, parseHHMM } from '@/lib/scheduling';

// GET /api/providers?all=1 — providers with working hours (active only by default).
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  const all = new URL(req.url).searchParams.get('all') === '1';
  const providers = await prisma.provider.findMany({
    where: all ? undefined : { active: true },
    orderBy: { name: 'asc' },
  });
  return json(
    providers.map((p) => ({
      id: p.id, name: p.name, specialty: p.specialty, slotMinutes: p.slotMinutes, active: p.active,
      workStartMin: p.workStartMin, workEndMin: p.workEndMin,
      hours: `${toHHMM(p.workStartMin)}–${toHHMM(p.workEndMin)}`,
    })),
  );
}

const createSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.number().int().positive().max(240),
});

// POST /api/providers — add a doctor (ADMIN only).
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  if (guard.session.role !== 'ADMIN') return fail('Admin role required.', 403);
  try {
    const b = createSchema.parse(await req.json());
    const provider = await prisma.provider.create({
      data: { name: b.name, specialty: b.specialty, workStartMin: parseHHMM(b.start), workEndMin: parseHHMM(b.end), slotMinutes: b.slotMinutes },
    });
    return json(provider, 201);
  } catch (err) {
    return handleError(err);
  }
}
