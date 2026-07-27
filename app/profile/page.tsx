import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { getLocale, translations } from "@/lib/i18n";
import { nextAuthOptions } from "@/lib/auth";
import SiteHeaderShell from "@/components/site-header-shell";
import { listUserOrders } from "@/lib/dashboard";

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams?.lang);
  const t = translations[locale];
  const session = await getServerSession(nextAuthOptions);
  const user = session?.user ? (session.user as typeof session.user & { id?: string }) : undefined;
  const orders = user?.id ? await listUserOrders(user.id) : [];

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-semibold text-slate-900">{t.profile}</h1>
          {session?.user ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">{t.name}</p>
                <p className="mt-1 text-lg font-medium text-slate-900">{session.user.name}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">{t.email}</p>
                <p className="mt-1 text-lg font-medium text-slate-900">{session.user.email}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{t.orderHistory}</p>
                  <Link href={`/dashboard?lang=${locale}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
                    View dashboard
                  </Link>
                </div>
                {orders.length === 0 ? (
                  <p className="mt-2 text-slate-600">{t.noOrders}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{order.product?.name ?? "Product"}</p>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase text-white">{order.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{t.quantity}: {order.quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              <p>{t.login} / {t.register} {t.signIn}.</p>
              <Link href={`/auth/login?lang=${locale}`} className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                {t.login}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
