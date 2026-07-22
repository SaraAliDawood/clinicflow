import { z } from 'zod';
import { prisma } from '@/lib/db';
import { invoiceTotalCents } from '@/lib/money';
import { requireUser, json, handleError } from '@/lib/http';

const createSchema = z.object({
  patientId: z.string().min(1),
  notes: z.string().optional(),
  dueAt: z.string().optional().or(z.literal('')),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative(),
  })).min(1, 'Add at least one line item.'),
});

// GET /api/invoices?status= — list, newest first.
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const status = new URL(req.url).searchParams.get('status') || undefined;
  const invoices = await prisma.invoice.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { issuedAt: 'desc' },
    take: 200,
    include: { patient: { select: { name: true } }, _count: { select: { items: true } } },
  });
  return json(invoices);
}

// POST /api/invoices — create an invoice from patient + line items (transactional).
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const body = createSchema.parse(await req.json());
    const invoice = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: body.patientId } });
      if (!patient) throw new Error('Patient not found.');
      const total = invoiceTotalCents(body.items);
      const year = new Date().getFullYear();
      const seq = (await tx.invoice.count({ where: { issuedAt: { gte: new Date(year, 0, 1) } } })) + 1;
      return tx.invoice.create({
        data: {
          number: `INV-${year}-${String(seq).padStart(6, '0')}`,
          patientId: patient.id,
          totalCents: total,
          notes: body.notes,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          items: { create: body.items },
        },
        include: { items: true, patient: true },
      });
    });
    return json(invoice, 201);
  } catch (err) {
    return handleError(err);
  }
}
