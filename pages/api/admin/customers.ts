import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { deleteCustomer, listCustomers, updateCustomerRole, getCustomerById } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method === "GET") {
    const customers = await listCustomers();
    return res.status(200).json(customers);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { deleteCustomer, updateCustomerRole, getCustomerById };
