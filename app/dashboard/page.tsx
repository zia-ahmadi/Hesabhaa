import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { nextAuthOptions } from "@/lib/auth";
import { getLocale, translations } from "@/lib/i18n";
import SiteHeaderShell from "@/components/site-header-shell";
import { listUserOrders } from "@/lib/dashboard";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams?.lang);
  const t = translations[locale];
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.email) {
    return (
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
        <SiteHeaderShell />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-5 py-16 sm:px-8">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <h1 className="text-3xl font-semibold">{t.profile}</h1>
            <p className="mt-4 text-slate-600">Please sign in to access your dashboard.</p>
            <Link href={`/auth/login?lang=${locale}`} className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              {t.login}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const user = session.user as typeof session.user & { id?: string };
  const orders = await listUserOrders(user.id ?? "");

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">User Dashboard</p>
          <h1 className="text-4xl font-semibold">{t.profile}</h1>
          <p className="text-slate-600">Track your orders, review your profile, and stay updated on delivery progress.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-semibold">Profile</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{t.name}</p>
                <p className="mt-2 text-lg font-medium">{session.user.name}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{t.email}</p>
                <p className="mt-2 text-lg font-medium">{session.user.email}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">My Orders</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{orders.length} total</span>
            </div>
            <div className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">No orders yet.</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{order.product?.name ?? "Product"}</p>
                        <p className="text-sm text-slate-600">{t.quantity}: {order.quantity}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white uppercase">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{t.total}: ${Number(order.total).toFixed(2)}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
