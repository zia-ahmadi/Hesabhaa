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

export async function listProducts() {
  if (!process.env.DATABASE_URL) {
    return mockProducts;
  }

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return products.length ? products : mockProducts;
}

export async function getProductById(id: string) {
  if (!process.env.DATABASE_URL) {
    return mockProducts.find((product) => product.id === id) ?? null;
  }

  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(input: ProductInput) {
  if (!process.env.DATABASE_URL) {
    const product: ProductRecord = {
      id: `prod-mock-${Date.now()}`,
      ...input,
      price: Number(input.price),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.unshift(product);
    return product;
  }

  return prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: Number(input.price),
      image: input.image,
    },
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  if (!process.env.DATABASE_URL) {
    const index = mockProducts.findIndex((product) => product.id === id);
    if (index === -1) {
      return null;
    }

    const updated = {
      ...mockProducts[index],
      ...input,
      price: Number(input.price),
      updatedAt: new Date(),
    };
    mockProducts[index] = updated;
    return updated;
  }

  return prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: Number(input.price),
      image: input.image,
    },
  });
}

export async function listUserOrders(userId: string) {
  if (!process.env.DATABASE_URL) {
    return mockOrders.filter((order) => order.userId === userId);
  }

  return prisma.order.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrders() {
  if (!process.env.DATABASE_URL) {
    return mockOrders;
  }

  return prisma.order.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(userId: string, productId: string, quantity = 1) {
  if (!process.env.DATABASE_URL) {
    const product = mockProducts.find((item) => item.id === productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const order: MockOrderRecord = {
      id: `order-mock-${Date.now()}`,
      userId,
      productId,
      quantity,
      total: product.price * quantity,
      status: "pending",
      createdAt: new Date(),
      product,
      user: {
        id: userId,
        name: "Customer",
        email: "customer@example.com",
      },
    };
    mockOrders.unshift(order);
    return order;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.order.create({
    data: {
      userId,
      productId,
      quantity,
      total: product.price * quantity,
      status: "pending",
    },
    include: { product: true, user: true },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!process.env.DATABASE_URL) {
    const index = mockOrders.findIndex((order) => order.id === id);
    if (index === -1) {
      return null;
    }

    mockOrders[index] = { ...mockOrders[index], status };
    return mockOrders[index];
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: { product: true, user: true },
  });
}
