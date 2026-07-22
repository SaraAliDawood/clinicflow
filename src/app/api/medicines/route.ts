import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, handleError } from '@/lib/http';

// GET /api/medicines?query= — inventory search (low stock first).
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const query = new URL(req.url).searchParams.get('query')?.trim();
  const medicines = await prisma.medicine.findMany({
    where: query ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] } : undefined,
    orderBy: { stock: 'asc' },
  });
  return json(medicines);
}

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string().min(1).default('unit'),
  stock: z.number().int().nonnegative(),
  priceCents: z.number().int().nonnegative(),
});

// POST /api/medicines — add an inventory item.
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const b = schema.parse(await req.json());
    const med = await prisma.medicine.create({
      data: {
        ...b,
        movements: b.stock > 0 ? { create: { delta: b.stock, reason: 'INITIAL', note: 'Opening stock' } } : undefined,
      },
    });
    return json(med, 201);
  } catch (err) {
    return handleError(err);
  }
}
