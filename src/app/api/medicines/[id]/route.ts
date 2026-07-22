import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, handleError } from '@/lib/http';

// PATCH /api/medicines/:id — restock (delta) or set price.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const { id } = await params;
    const b = z.object({ restock: z.number().int().optional(), priceCents: z.number().int().nonnegative().optional() }).parse(await req.json());
    const med = await prisma.medicine.update({
      where: { id },
      data: {
        ...(b.restock ? { stock: { increment: b.restock } } : {}),
        ...(b.priceCents !== undefined ? { priceCents: b.priceCents } : {}),
      },
    });
    return json({ id: med.id, stock: med.stock, priceCents: med.priceCents });
  } catch (err) {
    return handleError(err);
  }
}
