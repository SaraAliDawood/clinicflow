import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, fail, handleError } from '@/lib/http';

const patchSchema = z.object({ active: z.boolean() });

// PATCH /api/providers/:id — toggle active (ADMIN only).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  if (guard.session.role !== 'ADMIN') return fail('Admin role required.', 403);
  try {
    const { id } = await params;
    const { active } = patchSchema.parse(await req.json());
    const updated = await prisma.provider.update({ where: { id }, data: { active } });
    return json({ id: updated.id, active: updated.active });
  } catch (err) {
    return handleError(err);
  }
}
