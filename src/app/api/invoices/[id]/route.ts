import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, fail, handleError } from '@/lib/http';

// GET /api/invoices/:id — full invoice with items + patient.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, patient: true },
  });
  if (!invoice) return fail('Invoice not found.', 404);
  return json(invoice);
}

// PATCH /api/invoices/:id — update status (mark paid / void).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const { id } = await params;
    const { status } = z.object({ status: z.enum(['UNPAID', 'PAID', 'VOID']) }).parse(await req.json());
    const updated = await prisma.invoice.update({ where: { id }, data: { status } });
    return json({ id: updated.id, status: updated.status });
  } catch (err) {
    return handleError(err);
  }
}
