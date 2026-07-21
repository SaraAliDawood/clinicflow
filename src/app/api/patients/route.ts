import { prisma } from '@/lib/db';
import { patientCreateSchema } from '@/lib/validation';
import { requireUser, json, handleError } from '@/lib/http';

// GET /api/patients — list patients (newest first).
export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return json(patients);
}

// POST /api/patients — register a patient.
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const body = patientCreateSchema.parse(await req.json());
    const patient = await prisma.patient.create({
      data: { name: body.name, email: body.email || null, phone: body.phone || null },
    });
    return json(patient, 201);
  } catch (err) {
    return handleError(err);
  }
}
