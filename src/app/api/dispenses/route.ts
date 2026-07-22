import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, handleError } from '@/lib/http';

// GET /api/dispenses — recent dispenses.
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const dispenses = await prisma.dispense.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { patient: { select: { name: true } }, items: { include: { medicine: { select: { name: true } } } } },
  });
  return json(dispenses);
}

const schema = z.object({
  patientId: z.string().optional().or(z.literal('')),
  items: z.array(z.object({ medicineId: z.string().min(1), quantity: z.number().int().positive() })).min(1, 'Add at least one medicine.'),
});

// POST /api/dispenses — dispense medicines: validates + decrements stock, snapshots
// price, logs a DISPENSE stock movement per item, all in one transaction.
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const body = schema.parse(await req.json());
    const dispense = await prisma.$transaction(async (tx) => {
      let total = 0;
      const lines: { medicineId: string; quantity: number; unitPriceCents: number }[] = [];

      for (const it of body.items) {
        const med = await tx.medicine.findUnique({ where: { id: it.medicineId } });
        if (!med) throw new Error('Medicine not found.');
        if (med.stock < it.quantity) throw new Error(`Not enough stock for ${med.name} (have ${med.stock}, need ${it.quantity}).`);
        await tx.medicine.update({ where: { id: med.id }, data: { stock: { decrement: it.quantity } } });
        await tx.stockMovement.create({ data: { medicineId: med.id, delta: -it.quantity, reason: 'DISPENSE', note: `Dispensed ${it.quantity} ${med.unit}` } });
        lines.push({ medicineId: med.id, quantity: it.quantity, unitPriceCents: med.priceCents });
        total += it.quantity * med.priceCents;
      }

      const year = new Date().getFullYear();
      const seq = (await tx.dispense.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } })) + 1;
      return tx.dispense.create({
        data: {
          number: `DSP-${year}-${String(seq).padStart(6, '0')}`,
          patientId: body.patientId || null,
          totalCents: total,
          authorName: guard.session.name,
          items: { create: lines },
        },
        include: { items: { include: { medicine: true } }, patient: true },
      });
    });
    return json(dispense, 201);
  } catch (err) {
    return handleError(err);
  }
}
