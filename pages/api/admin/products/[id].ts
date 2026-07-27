import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { updateProduct } from "@/lib/dashboard";
import { productSchema } from "@/lib/validators/commerce";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const parsed = productSchema.safeParse(req.body);
  if (!id || Array.isArray(id) || !parsed.success) {
    return res.status(400).json({ error: parsed.success ? "Invalid product id" : parsed.error.issues[0]?.message });
  }

  try {
    const product = await updateProduct(id, { ...parsed.data, image: parsed.data.image || "#" });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to update product" });
  }
}
