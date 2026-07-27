import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/dashboard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { status } = req.body || {};
  if (!id || !status) {
    return res.status(400).json({ error: "Missing order status" });
  }

  try {
    const order = await updateOrderStatus(String(id), status);
    return res.status(200).json(order);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to update order status" });
  }
}
