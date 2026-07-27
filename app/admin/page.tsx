import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { isAdminEmail, nextAuthOptions } from "@/lib/auth";
import { getLocale, translations } from "@/lib/i18n";
import SiteHeaderShell from "@/components/site-header-shell";
import AdminDashboard from "@/components/admin-dashboard";
import { listOrders, listProducts } from "@/lib/dashboard";
import { getDashboardStats, listCustomers, listPayments, getSiteSettings } from "@/lib/admin";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams?.lang);
  const t = translations[locale];
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return (
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
        <SiteHeaderShell />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-5 py-16 sm:px-8">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-4 text-slate-600">Please sign in with the administrator email to manage products and orders.</p>
            <Link href={`/auth/login?lang=${locale}`} className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              {t.login}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [products, orders, stats, customers, payments, settings] = await Promise.all([
    listProducts(),
    listOrders(),
    getDashboardStats(),
    listCustomers(),
    listPayments(),
    getSiteSettings(),
  ]);

  const userWithRole = session.user as typeof session.user & { role?: string };

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin Dashboard</p>
          <h1 className="text-4xl font-semibold">Manage your shop</h1>
          <p className="text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{session.user.email}</span>
            {userWithRole.role === "admin" || isAdminEmail(session.user.email) ? (
              <span className="ml-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">ADMIN</span>
            ) : null}
          </p>
        </div>

        <AdminDashboard
          initialProducts={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: Number(product.price),
            image: product.image,
            stock: (product as { stock?: number }).stock ?? 0,
            isActive: (product as { isActive?: boolean }).isActive ?? true,
          }))}
          initialOrders={orders.map((order) => ({
            id: order.id,
            status: order.status,
            total: Number(order.total),
            quantity: order.quantity,
            createdAt: new Date(order.createdAt).toLocaleDateString(),
            product: { name: order.product?.name },
            user: { name: order.user?.name, email: order.user?.email },
            payment: (order as { payment?: { status?: string } | null }).payment ?? null,
          }))}
          initialStats={stats}
          initialCustomers={customers}
          initialPayments={payments as unknown as Parameters<typeof AdminDashboard>[0]["initialPayments"]}
          initialSettings={settings}
          locale={locale}
        />
      </main>
    </div>
  );
}
