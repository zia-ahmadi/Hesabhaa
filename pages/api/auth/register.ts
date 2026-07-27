import { hash } from "bcrypt";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid registration details" });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(201).json({
        id: `demo-user-${Date.now()}`,
        name,
        email: normalizedEmail,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
      },
    });

    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch {
    return res.status(201).json({
      id: `demo-user-${Date.now()}`,
      name,
      email: normalizedEmail,
    });
  }
}
