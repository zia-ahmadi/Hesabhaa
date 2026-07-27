"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { getLocale, translations } from "@/lib/i18n";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = getLocale(searchParams?.get("lang") ?? undefined);
  const t = translations[locale];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const response = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (response?.ok) {
      router.push(`/?lang=${locale}`);
    }
  };

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">{t.signIn}</h1>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
            {t.login}
          </button>
        </form>
      </div>
    </div>
  );
}
