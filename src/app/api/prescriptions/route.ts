import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, handleError } from '@/lib/http';

// GET /api/prescriptions — list, newest first.
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const rx = await prisma.prescription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { patient: { select: { name: true } }, _count: { select: { items: true } } },
  });
  return json(rx);
}

const schema = z.object({
  patientId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    medicineId: z.string().min(1),
    quantity: z.number().int().positive(),
    dosage: z.string().optional(),
  })).min(1, 'Add at least one medicine.'),
});

// POST /api/prescriptions — issue a prescription; decrements pharmacy stock.
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const body = schema.parse(await req.json());
    const rx = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: body.patientId } });
      if (!patient) throw new Error('Patient not found.');

      for (const it of body.items) {
        const med = await tx.medicine.findUnique({ where: { id: it.medicineId } });
        if (!med) throw new Error('Medicine not found.');
        if (med.stock < it.quantity) throw new Error(`Not enough stock for ${med.name} (have ${med.stock}).`);
        await tx.medicine.update({ where: { id: med.id }, data: { stock: { decrement: it.quantity } } });
      }

      const year = new Date().getFullYear();
      const seq = (await tx.prescription.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } })) + 1;
      return tx.prescription.create({
        data: {
          number: `RX-${year}-${String(seq).padStart(6, '0')}`,
          patientId: patient.id,
          notes: body.notes,
          authorName: guard.session.name,
          items: { create: body.items },
        },
        include: { items: { include: { medicine: true } }, patient: true },
      });
    });
    return json(rx, 201);
  } catch (err) {
    return handleError(err);
  }
}
