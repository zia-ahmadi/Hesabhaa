import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/auth";
import { createProduct, listProducts } from "@/lib/dashboard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const products = await listProducts();
    return res.status(200).json(products);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, slug, description, price, image } = req.body || {};
  if (!name || !slug || !description || price === undefined) {
    return res.status(400).json({ error: "Missing product details" });
  }

  try {
    const product = await createProduct({ name, slug, description, price: Number(price), image: image || "#" });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to create product" });
  }
}
