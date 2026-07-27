import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { deleteProduct, toggleProductActive } from "@/lib/admin";
import { updateProduct } from "@/lib/dashboard";
import { productSchema } from "@/lib/validators/commerce";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: "Administrator access is required" });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  if (req.method === "PUT") {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product details" });
    }

    try {
      const product = await updateProduct(id, { ...parsed.data, image: parsed.data.image || "#" });
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json(product);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const ok = await deleteProduct(id);
      if (!ok) return res.status(404).json({ error: "Product not found or couldn't be deleted" });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to delete product" });
    }
  }

  if (req.method === "PATCH") {
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }
    try {
      const updated = await toggleProductActive(id, isActive);
      if (!updated) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to toggle product" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
