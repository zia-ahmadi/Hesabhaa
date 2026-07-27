"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { getLocale, translations } from "@/lib/i18n";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = getLocale(searchParams?.get("lang") ?? undefined);
  const t = translations[locale];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/auth/login?lang=${locale}`);
    }
  };

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">{t.createAccount}</h1>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-slate-700">
            {t.name}
            <input
              type="text"
              {...register("name")}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {t.email}
            <input
              type="email"
              {...register("email")}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {t.password}
            <input
              type="password"
              {...register("password")}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            />
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.register}
          </button>
        </form>
      </div>
    </div>
  );
}
