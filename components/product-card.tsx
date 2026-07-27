import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import type { ProductItem } from "@/lib/db";

export default function ProductCard({
  product,
  locale,
}: {
  product: ProductItem;
  locale: Locale;
}) {
  const t = translations[locale];

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 h-48 overflow-hidden rounded-3xl bg-slate-100"></div>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
        <p className="text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="flex items-center justify-between gap-3 pt-4">
          <span className="text-lg font-semibold text-slate-900">${product.price.toFixed(2)}</span>
          <Link
            href={`/products/${product.slug}?lang=${locale}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {t.viewDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}
