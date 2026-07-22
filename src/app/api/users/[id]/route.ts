import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, fail, handleError } from '@/lib/http';

// PATCH /api/users/:id — change a team member's role (ADMIN only).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  if (guard.session.role !== 'ADMIN') return fail('Admin role required.', 403);
  try {
    const { id } = await params;
    const { role } = z.object({ role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF']) }).parse(await req.json());
    const updated = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, role: true } });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
