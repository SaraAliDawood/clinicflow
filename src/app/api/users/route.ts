import { prisma } from '@/lib/db';
import { requireUser, json, fail } from '@/lib/http';

// GET /api/users — list team members (ADMIN only).
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  if (guard.session.role !== 'ADMIN') return fail('Admin role required.', 403);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return json(users);
}
