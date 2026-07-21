import { prisma } from '@/lib/db';
import { verifyPassword, signSession, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { json, fail, handleError } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail('Invalid email or password.', 401);
    }
    await setSessionCookie(
      await signSession({ userId: user.id, email: user.email, name: user.name, role: user.role }),
    );
    return json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
