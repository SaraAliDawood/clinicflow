import { requireUser, json } from '@/lib/http';

export async function GET() {
  const guard = await requireUser();
  if ('response' in guard) return guard.response;
  return json(guard.session);
}
