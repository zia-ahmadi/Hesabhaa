import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { createProduct, listProducts } from "@/lib/dashboard";
import { productSchema } from "@/lib/validators/commerce";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method === "GET") {
    const products = await listProducts();
    return res.status(200).json(products);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product details" });
  }

  try {
    const product = await createProduct({ ...parsed.data, image: parsed.data.image || "#" });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to create product" });
  }
}
