import Link from "next/link";
import { getProducts } from "@/lib/db";
import { getLocale, translations } from "@/lib/i18n";
import SiteHeaderShell from "@/components/site-header-shell";
import ProductCard from "@/components/product-card";

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<{ lang?: string }> | { lang?: string } }) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams?.lang);
  const t = translations[locale];
  const products = await getProducts();

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t.productsTitle}</p>
          <h1 className="text-4xl font-semibold text-slate-900">{t.productsTitle}</h1>
          <p className="max-w-2xl text-slate-600">{t.homeDescription}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </main>
    </div>
  );
}
