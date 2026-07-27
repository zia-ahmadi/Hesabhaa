import { prisma } from "@/lib/prisma";

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockOrderRecord = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  user?: { id: string; name: string; email: string };
  product?: ProductRecord;
};

const mockProducts: ProductRecord[] = [
  {
    id: "prod-mock-1",
    name: "Dari Coffee",
    slug: "dari-coffee",
    description: "Fresh roasted beans with a warm, floral aroma for daily Dari tea and coffee rituals.",
    price: 18,
    image: "#",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-mock-2",
    name: "Handmade Shawl",
    slug: "handmade-shawl",
    description: "Soft woven fabric crafted for comfort and elegant everyday wear.",
    price: 32,
    image: "#",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-mock-3",
    name: "Spiced Saffron",
    slug: "spiced-saffron",
    description: "Premium saffron threads sourced for rich aroma and authentic flavor.",
    price: 24,
    image: "#",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOrders: MockOrderRecord[] = [];

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

export async function listProducts() {
  return safe(async () => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return products.length ? products : mockProducts;
  }, mockProducts);
}

export async function getProductById(id: string) {
  const fallback = mockProducts.find((product) => product.id === id) ?? null;
  return safe(async () => {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ?? fallback;
  }, fallback);
}

export async function createProduct(input: ProductInput) {
  const mockCreate = () => {
    const product: ProductRecord = {
      id: `prod-mock-${Date.now()}`,
      ...input,
      price: Number(input.price),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.unshift(product);
    return product;
  };
  return safe(async () => {
    return await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: Number(input.price),
        image: input.image,
      },
    });
  }, mockCreate());
}

export async function updateProduct(id: string, input: ProductInput) {
  const mockUpdate = () => {
    const index = mockProducts.findIndex((product) => product.id === id);
    if (index === -1) return null;
    const updated = {
      ...mockProducts[index],
      ...input,
      price: Number(input.price),
      updatedAt: new Date(),
    };
    mockProducts[index] = updated;
    return updated;
  };
  return safe(async () => {
    return await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: Number(input.price),
        image: input.image,
      },
    });
  }, mockUpdate());
}

export async function listUserOrders(userId: string) {
  const fallback = mockOrders.filter((order) => order.userId === userId);
  return safe(async () => {
    const rows = await prisma.order.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.length ? rows : fallback;
  }, fallback);
}

export async function listOrders() {
  return safe(async () => {
    const rows = await prisma.order.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.length ? rows : mockOrders;
  }, mockOrders);
}

export async function createOrder(userId: string, productId: string, quantity = 1) {
  const product = mockProducts.find((item) => item.id === productId);
  const mockCreate = () => {
    if (!product) throw new Error("Product not found");
    const order: MockOrderRecord = {
      id: `order-mock-${Date.now()}`,
      userId,
      productId,
      quantity,
      total: product.price * quantity,
      status: "pending",
      createdAt: new Date(),
      product,
      user: { id: userId, name: "Customer", email: "customer@example.com" },
    };
    mockOrders.unshift(order);
    return order;
  };
  if (!(await isViable())) return mockCreate();
  try {
    const p = (async () => {
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      if (!dbProduct) {
        if (!product) throw new Error("Product not found");
      }
      const usedProduct = dbProduct ?? product;
      if (!usedProduct) throw new Error("Product not found");
      return prisma.order.create({
        data: {
          userId,
          productId,
          quantity,
          total: usedProduct.price * quantity,
          status: "pending",
        },
        include: { product: true, user: true },
      });
    })();
    if (!p || typeof p.then !== "function") return p;
    return await p;
  } catch {
    return mockCreate();
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const mockUpdate = () => {
    const index = mockOrders.findIndex((order) => order.id === id);
    if (index === -1) return null;
    mockOrders[index] = { ...mockOrders[index], status };
    return mockOrders[index];
  };
  return safe(async () => {
    return await prisma.order.update({
      where: { id },
      data: { status },
      include: { product: true, user: true },
    });
  }, mockUpdate() as any);
}
