import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method === "GET") {
    const settings = await getSiteSettings();
    return res.status(200).json(settings);
  }

  if (req.method === "PATCH") {
    try {
      const updated = await updateSiteSettings(req.body || {});
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to update settings" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
