import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { deleteCustomer, updateCustomerRole } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid customer id" });
  }

  if (req.method === "PATCH") {
    const { role } = req.body || {};
    if (typeof role !== "string" || !["customer", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    try {
      const updated = await updateCustomerRole(id, role);
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to update customer" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const ok = await deleteCustomer(id);
      if (!ok) return res.status(404).json({ error: "Customer not found" });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to delete customer" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
