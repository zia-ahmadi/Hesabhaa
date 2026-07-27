import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/dashboard";

let _prismaViableCache: boolean | null = null;

async function isPrismaViable(): Promise<boolean> {
  if (_prismaViableCache === false) return false;
  if (!process.env.DATABASE_URL) {
    _prismaViableCache = false;
    return false;
  }
  const url = process.env.DATABASE_URL;
  if (!/^prisma(\+postgres)?:\/\//.test(url) && !/^postgresql?:\/\//.test(url)) {
    _prismaViableCache = false;
    return false;
  }
  if (_prismaViableCache === true) return true;
  try {
    await prisma.$queryRawUnsafe("SELECT 1 AS ping").catch(() => {
      throw new Error("ping failed");
    });
    _prismaViableCache = true;
    return true;
  } catch {
    _prismaViableCache = false;
    return false;
  }
}

type PrismaFn<T> = () => Promise<T>;

async function safe<T>(fn: PrismaFn<T>, fallback: T): Promise<T> {
  if (!(await isPrismaViable())) return fallback;
  try {
    const p = fn();
    if (!p || typeof p.then !== "function") return p as T;
    return await p;
  } catch {
    return fallback;
  }
}

export type Customer = {
  id: string;
  name: string;
  email: string;
  role: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
};

export type Payment = {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  order?: { id: string; product?: { name?: string } };
};

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  currency: string;
  paymentInstructions: string;
  isShopOpen: boolean;
};

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  revenueByDay: { date: string; total: number }[];
  ordersByStatus: Record<string, number>;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "بازار بستها",
  siteDescription: "مارکت‌پلیس پاسخگو با Next.js و Prisma",
  supportEmail: "support@bastaha.com",
  currency: "USD",
  paymentInstructions: "Please complete the payment via bank transfer and submit the reference number.",
  isShopOpen: true,
};

const mockPayments: Payment[] = [];

let mockSettingsStore: SiteSettings = { ...DEFAULT_SETTINGS };

const mockCustomers: (Customer & { email: string; role: string })[] = [
  {
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@bastaha.com",
    role: "customer",
    totalOrders: 0,
    totalSpent: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-mock-2",
    name: "Ahmad Samim",
    email: "ahmad@example.com",
    role: "customer",
    totalOrders: 3,
    totalSpent: 125,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust-mock-3",
    name: "Fahima Rahimi",
    email: "fahima@example.com",
    role: "customer",
    totalOrders: 1,
    totalSpent: 32,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockOrderHistory: { date: string; total: number }[] = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString("en-CA"),
    total: Math.floor(Math.random() * 200 + 20),
  };
});

export async function getDashboardStats(): Promise<DashboardStats> {
  const fallback = (() => {
    const revenue = mockOrderHistory.reduce((s, d) => s + d.total, 0);
    return {
      totalRevenue: revenue,
      totalOrders: mockCustomers.reduce((s, c) => s + c.totalOrders, 0) + 2,
      totalProducts: 3,
      totalCustomers: mockCustomers.length,
      pendingOrders: 2,
      completedOrders: 3,
      revenueByDay: mockOrderHistory,
      ordersByStatus: { pending: 2, processing: 1, shipped: 1, delivered: 2, cancelled: 1 },
    };
  })();

  return safe<DashboardStats>(async () => {
    const [orders, products, users] = await Promise.all([
      prisma.order.findMany({ include: { product: true } }),
      prisma.product.findMany(),
      prisma.user.findMany(),
    ]);

    const customers = users.filter((u) => (u as { role?: string }).role !== "admin");
    const revenue = orders.reduce((sum, o) => sum + ((o as { total?: number }).total || 0), 0);
    const pending = orders.filter((o) => (o as { status?: string }).status === "pending").length;
    const completed = orders.filter(
      (o) => (o as { status?: string }).status === "delivered" || (o as { status?: string }).status === "completed"
    ).length;

    const byStatus: Record<string, number> = {};
    for (const o of orders) {
      const s = (o as { status?: string }).status || "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString("en-CA");
      const dayTotal = orders
        .filter(
          (o) =>
            new Date((o as { createdAt: Date | string }).createdAt).toLocaleDateString("en-CA") === dateStr
        )
        .reduce((sum, o) => sum + ((o as { total?: number }).total || 0), 0);
      return { date: dateStr, total: dayTotal };
    });

    return {
      totalRevenue: Number(revenue.toFixed(2)),
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      pendingOrders: pending,
      completedOrders: completed,
      revenueByDay: last7Days,
      ordersByStatus: byStatus,
    };
  }, fallback);
}

export async function listCustomers(): Promise<Customer[]> {
  return safe<Customer[]>(async () => {
    const users = await prisma.user.findMany({
      include: { orders: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    return users
      .filter((u) => (u as { role?: string }).role !== "admin")
      .map((u) => ({
        id: (u as { id: string }).id,
        name: (u as { name: string }).name,
        email: (u as { email: string }).email,
        role: (u as { role: string }).role,
        totalOrders: ((u as { orders?: unknown[] }).orders || []).length,
        totalSpent: ((u as { orders?: { total?: number }[] }).orders || []).reduce(
          (s, o) => s + (o.total || 0),
          0
        ),
        createdAt: new Date((u as { createdAt: Date | string }).createdAt).toISOString(),
      }));
  }, mockCustomers);
}

export async function getCustomerById(id: string) {
  const fallback = (() => {
    const c = mockCustomers.find((x) => x.id === id) ?? mockCustomers[0];
    return { ...c, orders: [], payments: [] };
  })();
  return safe(async () => {
    const res = await prisma.user.findUnique({
      where: { id },
      include: { orders: { include: { product: true } }, payments: true },
    });
    return res ?? fallback;
  }, fallback);
}

export async function updateCustomerRole(id: string, role: string): Promise<Customer | null> {
  const fallback = (() => {
    const idx = mockCustomers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    mockCustomers[idx] = { ...mockCustomers[idx], role };
    return mockCustomers[idx];
  })();
  return safe<Customer | null>(async () => {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      include: { orders: true, payments: true },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      totalOrders: updated.orders.length,
      totalSpent: updated.orders.reduce((s, o) => s + (o.total || 0), 0),
      createdAt: new Date(updated.createdAt).toISOString(),
    };
  }, fallback);
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const fallback = (() => {
    const idx = mockCustomers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    mockCustomers.splice(idx, 1);
    return true;
  })();
  return safe<boolean>(async () => {
    await prisma.order.deleteMany({ where: { userId: id } });
    await prisma.payment.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return true;
  }, fallback);
}

export async function listPayments() {
  return safe(async () => {
    const rows = await prisma.payment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        order: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() }));
  }, mockPayments as any);
}

export async function createPayment(
  userId: string,
  orderId: string,
  amount: number,
  method: string = "manual",
  reference?: string
) {
  const base = {
    id: `pay-${Date.now()}`,
    userId,
    orderId,
    amount,
    method,
    status: "pending" as const,
    reference: reference ?? undefined,
    createdAt: new Date().toISOString(),
  };
  const fallback = (() => {
    const withMeta = {
      ...base,
      user: { name: "Customer", email: "customer@example.com" },
      order: { id: orderId, product: { name: "Product" } },
    } as unknown as (typeof mockPayments)[number];
    mockPayments.unshift(withMeta);
    return withMeta;
  })();
  return safe(async () => {
    const created = await prisma.payment.create({
      data: { userId, orderId, amount, method, status: "pending", reference: reference ?? undefined },
      include: {
        user: { select: { name: true, email: true } },
        order: { include: { product: { select: { name: true } } } },
      },
    });
    return { ...created, createdAt: new Date(created.createdAt).toISOString() };
  }, fallback as any);
}

export async function updatePaymentStatus(
  id: string,
  status: "pending" | "completed" | "failed" | "refunded"
) {
  const fallback = (() => {
    const idx = mockPayments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    mockPayments[idx] = { ...mockPayments[idx], status };
    return mockPayments[idx];
  })();
  return safe(async () => {
    const updated = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        order: { include: { product: { select: { name: true } } } },
      },
    });
    return { ...updated, createdAt: new Date(updated.createdAt).toISOString() };
  }, fallback as any);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return safe<SiteSettings>(async () => {
    const rows = await prisma.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const r of rows) settingsMap[r.key] = r.value;

    return {
      siteName: settingsMap.siteName ?? DEFAULT_SETTINGS.siteName,
      siteDescription: settingsMap.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
      supportEmail: settingsMap.supportEmail ?? DEFAULT_SETTINGS.supportEmail,
      currency: settingsMap.currency ?? DEFAULT_SETTINGS.currency,
      paymentInstructions: settingsMap.paymentInstructions ?? DEFAULT_SETTINGS.paymentInstructions,
      isShopOpen:
        settingsMap.isShopOpen === undefined ? DEFAULT_SETTINGS.isShopOpen : settingsMap.isShopOpen === "true",
    };
  }, { ...mockSettingsStore });
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const merged = { ...mockSettingsStore, ...patch };
  const fallback = (() => {
    mockSettingsStore = merged;
    return merged;
  })();
  return safe<SiteSettings>(async () => {
    const entries: [string, string][] = [
      ["siteName", merged.siteName],
      ["siteDescription", merged.siteDescription],
      ["supportEmail", merged.supportEmail],
      ["currency", merged.currency],
      ["paymentInstructions", merged.paymentInstructions],
      ["isShopOpen", String(merged.isShopOpen)],
    ];

    for (const [key, value] of entries) {
      await prisma.settings.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    mockSettingsStore = merged;
    return merged;
  }, fallback);
}

export async function deleteProduct(id: string) {
  return safe<boolean>(async () => {
    await prisma.order.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return true;
  }, false);
}

export async function toggleProductActive(id: string, isActive: boolean) {
  return safe(async () => {
    return await prisma.product.update({ where: { id }, data: { isActive } });
  }, null);
}

export async function updateOrderStatusAndMaybePayment(
  id: string,
  status: OrderStatus,
  paymentStatus?: Payment["status"]
) {
  return safe(async () => {
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { product: true, user: true, payment: true },
    });

    if (paymentStatus && !updated.payment) {
      await prisma.payment.create({
        data: {
          userId: updated.userId,
          orderId: updated.id,
          amount: updated.total,
          method: "manual",
          status: paymentStatus,
        },
      });
    } else if (paymentStatus && updated.payment) {
      await prisma.payment.update({
        where: { id: updated.payment.id },
        data: { status: paymentStatus },
      });
    }

    return prisma.order.findUnique({
      where: { id },
      include: { product: true, user: true, payment: true },
    });
  }, null);
}
