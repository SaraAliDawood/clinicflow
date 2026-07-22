import { prisma } from '@/lib/db';
import { patientCreateSchema } from '@/lib/validation';
import { requireUser, json, handleError } from '@/lib/http';

// GET /api/patients?query= — list patients (searchable), with counts.
export async function GET(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  const query = new URL(req.url).searchParams.get('query')?.trim();
  const patients = await prisma.patient.findMany({
    where: query
      ? { OR: [{ name: { contains: query } }, { email: { contains: query } }, { phone: { contains: query } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { _count: { select: { appointments: true, records: true } } },
  });
  return json(patients);
}

// POST /api/patients — register a patient (full profile).
export async function POST(req: Request) {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  try {
    const b = patientCreateSchema.parse(await req.json());
    const patient = await prisma.patient.create({
      data: {
        name: b.name,
        email: b.email || null,
        phone: b.phone || null,
        dob: b.dob ? new Date(b.dob) : null,
        gender: b.gender || null,
        bloodType: b.bloodType || null,
        allergies: b.allergies || null,
        address: b.address || null,
      },
    });
    return json(patient, 201);
  } catch (err) {
    return handleError(err);
  }
}
