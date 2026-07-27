import { prisma } from "@/lib/prisma";

export type ProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
};

const demoProducts: ProductItem[] = [
  {
    id: "prod-1",
    name: "Dari Coffee",
    slug: "dari-coffee",
    description: "Fresh roasted beans with a warm, floral aroma for daily Dari tea and coffee rituals.",
    price: 18,
    image: "#",
  },
  {
    id: "prod-2",
    name: "Handmade Shawl",
    slug: "handmade-shawl",
    description: "Soft woven fabric crafted for comfort and elegant everyday wear.",
    price: 32,
    image: "#",
  },
  {
    id: "prod-3",
    name: "Spiced Saffron",
    slug: "spiced-saffron",
    description: "Premium saffron threads sourced for rich aroma and authentic flavor.",
    price: 24,
    image: "#",
  },
];

let _dbViable: boolean | null = null;

async function isViable() {
  if (_dbViable === false) return false;
  if (!process.env.DATABASE_URL) {
    _dbViable = false;
    return false;
  }
  if (_dbViable === true) return true;
  try {
    await prisma.$queryRawUnsafe("SELECT 1").catch(() => {
      throw new Error("db ping failed");
    });
    _dbViable = true;
    return true;
  } catch {
    _dbViable = false;
    return false;
  }
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!(await isViable())) return fallback;
  try {
    const p = fn();
    if (!p || typeof p.then !== "function") return p as T;
    return await p;
  } catch {
    return fallback;
  }
}

export async function getProducts() {
  return safe(async () => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return products.length ? products : demoProducts;
  }, demoProducts);
}

export async function getProductBySlug(slug: string) {
  const fallback = demoProducts.find((product) => product.slug === slug) ?? null;
  return safe(async () => {
    const product = await prisma.product.findUnique({ where: { slug } });
    return product ?? fallback;
  }, fallback);
}
