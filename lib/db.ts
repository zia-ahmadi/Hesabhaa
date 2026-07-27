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

export async function getProducts() {
  try {
    if (!process.env.DATABASE_URL) {
      return demoProducts;
    }

    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return products.length ? products : demoProducts;
  } catch {
    return demoProducts;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    if (!process.env.DATABASE_URL) {
      return demoProducts.find((product) => product.slug === slug) ?? null;
    }

    const product = await prisma.product.findUnique({ where: { slug } });
    return product ?? demoProducts.find((item) => item.slug === slug) ?? null;
  } catch {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }
}
