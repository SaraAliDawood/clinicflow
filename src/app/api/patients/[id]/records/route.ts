import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser, json, handleError } from '@/lib/http';

const schema = z.object({
  kind: z.enum(['VISIT', 'NOTE', 'DIAGNOSIS', 'LAB']),
  title: z.string().min(1),
  details: z.string().optional(),
});

// POST /api/patients/:id/records — append a medical record.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = schema.parse(await req.json());
    const record = await prisma.medicalRecord.create({
      data: { patientId: id, kind: body.kind, title: body.title, details: body.details, authorName: guard.session.name },
    });
    return json(record, 201);
  } catch (err) {
    return handleError(err);
  }
}
