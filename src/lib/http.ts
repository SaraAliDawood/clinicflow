import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession, type SessionPayload } from './auth';

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', issues: err.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const message = err instanceof Error ? err.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function requireUser(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: fail('Authentication required', 401) };
  return { session };
}
