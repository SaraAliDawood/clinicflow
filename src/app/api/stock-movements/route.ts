import { prisma } from '@/lib/db';
import { requireUser, json } from '@/lib/http';

// GET /api/stock-movements — recent stock audit trail (all medicines).
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: { medicine: { select: { name: true } } },
  });
  return json(movements);
}
