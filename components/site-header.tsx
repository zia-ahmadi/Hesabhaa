"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getLocale, translations } from "@/lib/i18n";

export default function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = getLocale(searchParams?.get("lang") ?? undefined);
  const t = translations[locale];
  const session = useSession();
  const nextLocale = locale === "en" ? "fa" : "en";
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@bastaha.com").toLowerCase();
  const isAdmin = session.data?.user?.email?.toLowerCase() === adminEmail;
  const isAuthenticated = session.status === "authenticated";

  return (
    <header className="border-b border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href={`/?lang=${locale}`} className="text-xl font-semibold tracking-tight text-slate-900">
          {t.siteName}
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-4 text-sm font-medium text-slate-700 sm:gap-6">
          <Link href={`/?lang=${locale}`} className="transition hover:text-slate-900">
            {t.home}
          </Link>
          <Link href={`/products?lang=${locale}`} className="transition hover:text-slate-900">
            {t.productsTitle}
          </Link>
          {isAuthenticated ? (
            <>
              <Link href={`/dashboard?lang=${locale}`} className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href={`/profile?lang=${locale}`} className="hover:text-slate-900">
                {t.profile}
              </Link>
              {isAdmin ? (
                <Link href={`/admin?lang=${locale}`} className="hover:text-slate-900">
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/?lang=${locale}` })}
                className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <Link href={`/auth/login?lang=${locale}`} className="hover:text-slate-900">
                {t.login}
              </Link>
              <Link
                href={`/auth/register?lang=${locale}`}
                className="rounded-full bg-amber-700 px-4 py-2 text-white transition hover:bg-amber-800"
              >
                {t.register}
              </Link>
            </>
          )}
          <Link
            href={`${pathname}?lang=${nextLocale}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {t.language}
          </Link>
        </nav>
      </div>
    </header>
  );
}
