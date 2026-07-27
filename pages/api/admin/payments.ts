import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { createPayment, listPayments, updatePaymentStatus } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method === "GET") {
    const payments = await listPayments();
    return res.status(200).json(payments);
  }

  if (req.method === "POST") {
    const { userId, orderId, amount, method, reference } = req.body || {};
    if (!userId || !orderId || typeof amount !== "number") {
      return res.status(400).json({ error: "userId, orderId, and amount are required" });
    }
    try {
      const payment = await createPayment(userId, orderId, amount, method, reference);
      return res.status(201).json(payment);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to create payment" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { updatePaymentStatus };
