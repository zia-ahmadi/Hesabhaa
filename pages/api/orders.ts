import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/auth";
import { createOrder } from "@/lib/dashboard";
import { orderSchema } from "@/lib/validators/commerce";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Choose a valid product and quantity." });
  }

  try {
    const user = session.user as typeof session.user & { id?: string };
    if (!user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const order = await createOrder(user.id, parsed.data.productId, parsed.data.quantity);
    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to place order" });
  }
}
