import { getProductBySlug } from "@/lib/db";
import { getLocale, translations } from "@/lib/i18n";
import SiteHeader from "@/components/site-header";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { lang?: string };
}) {
  const locale = getLocale(searchParams?.lang);
  const t = translations[locale];
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return (
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
          <p className="rounded-3xl bg-white p-8 text-center text-slate-700 shadow-lg">محصول یافت نشد.</p>
        </main>
      </div>
    );
  }

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <div className="mb-6 h-72 rounded-[1.75rem] bg-slate-100" />
            <h1 className="text-4xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-4 text-slate-600">{product.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-3xl font-semibold text-slate-900">${product.price.toFixed(2)}</span>
              <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                افزودن به سبد خرید
              </button>
            </div>
          </div>

          <aside className="space-y-4 rounded-[2rem] bg-white p-8 shadow-xl">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">{t.price}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${product.price.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">{t.productDescription}</p>
              <p className="mt-2 text-slate-600">{product.description}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
