import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { getLocale, translations } from "@/lib/i18n";
import { nextAuthOptions } from "@/lib/auth";
import SiteHeader from "@/components/site-header";

export default async function ProfilePage({ searchParams }: { searchParams?: { lang?: string } }) {
  const locale = getLocale(searchParams?.lang);
  const t = translations[locale];
  const session = await getServerSession(nextAuthOptions);

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
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
                <p className="text-sm text-slate-500">{t.orderHistory}</p>
                <p className="mt-2 text-slate-600">{t.noOrders}</p>
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
