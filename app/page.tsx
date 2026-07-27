import Link from "next/link";
import { getProducts } from "@/lib/db";
import { getLocale, translations } from "@/lib/i18n";
import ProductCard from "@/components/product-card";
import SiteHeader from "@/components/site-header";

export default async function Home({
  searchParams,
}: {
  searchParams?: { lang?: string };
}) {
  const locale = getLocale(searchParams?.lang);
  const t = translations[locale];
  const products = await getProducts();

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8">
        <section className="grid gap-8 overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-12 text-white shadow-xl sm:grid-cols-[1.4fr_0.9fr] sm:items-center sm:px-10">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{t.siteName}</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">{t.homeTitle}</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">{t.homeDescription}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/products?lang=${locale}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {t.browseProducts}
              </Link>
              <Link
                href={`/auth/register?lang=${locale}`}
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t.register}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-2xl">
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
            <Link href={`/products?lang=${locale}`} className="text-sm font-semibold text-slate-900 transition hover:text-slate-700">
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
