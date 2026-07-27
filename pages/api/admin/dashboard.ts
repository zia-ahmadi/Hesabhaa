import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stats = await getDashboardStats();
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to fetch stats" });
  }
}
