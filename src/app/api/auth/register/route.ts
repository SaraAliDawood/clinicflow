import { prisma } from '@/lib/db';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { json, fail, handleError } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    if (await prisma.user.findUnique({ where: { email: body.email } })) {
      return fail('That email is already registered.', 409);
    }
    const count = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: count === 0 ? 'ADMIN' : 'STAFF',
      },
    });
    await setSessionCookie(
      await signSession({ userId: user.id, email: user.email, name: user.name, role: user.role }),
    );
    return json({ id: user.id, email: user.email, name: user.name, role: user.role }, 201);
  } catch (err) {
    return handleError(err);
  }
}
