import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/auth";
import { createOrder } from "@/lib/dashboard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { productId, quantity = 1 } = req.body || {};
  if (!productId) {
    return res.status(400).json({ error: "Product id is required" });
  }

  try {
    const user = session.user as typeof session.user & { id?: string };
    const order = await createOrder(user.id ?? "", productId, Number(quantity));
    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to place order" });
  }
}
