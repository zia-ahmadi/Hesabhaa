import Link from "next/link";
import { getProducts } from "@/lib/db";
import { getLocale, translations } from "@/lib/i18n";
import ProductCard from "@/components/product-card";
import SiteHeaderShell from "@/components/site-header-shell";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
}) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams?.lang);
  const t = translations[locale];
  const products = await getProducts();

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-[var(--background)] text-slate-900">
      <SiteHeaderShell />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8">
        <section className="grid gap-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:grid-cols-[1.3fr_0.9fr] sm:items-center sm:px-8">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">{t.siteName}</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">{t.homeTitle}</h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">{t.homeDescription}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/products?lang=${locale}`}
                className="inline-flex items-center justify-center rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                {t.browseProducts}
              </Link>
              <Link
                href={`/auth/register?lang=${locale}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t.register}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              {products.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t.productsTitle}</p>
              <h2 className="text-3xl font-semibold text-slate-900">{t.browseProducts}</h2>
            </div>
            <Link href={`/products?lang=${locale}`} className="text-sm font-semibold text-amber-700 transition hover:text-amber-800">
              {t.viewDetails}
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
