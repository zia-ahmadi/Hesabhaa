"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

export default function OrderButton({ productId, locale }: { productId: string; locale: Locale }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [reference, setReference] = useState("");
  const [settings, setSettings] = useState<{ paymentInstructions?: string } | null>(null);
  const t = translations[locale];
  void t;
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch {
      setSettings({
        paymentInstructions: "Please complete the payment via bank transfer and submit the reference number.",
      });
    }
  };

  const handleOrder = async () => {
    if (!session?.user) {
      router.push(`/auth/login?lang=${locale}`);
      return;
    }

    setIsCreating(true);
    setMessage("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await response.json();
    setIsCreating(false);

    if (response.ok) {
      setPendingOrderId(data.id ?? null);
      setShowPayment(true);
      setMessage("Order created. Please submit payment details to confirm.");
      void loadSettings();
      return;
    }

    setMessage(data.error || "Unable to place order.");
  };

  const submitPayment = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as { id?: string })?.id ?? "",
          orderId: pendingOrderId ?? "",
          amount: 0,
          method: "manual",
          reference: reference.trim() || undefined,
        }),
      });
      if (response.ok) {
        setMessage("Payment submitted. Redirecting to dashboard...");
      } else {
        setMessage("Payment noted. Check dashboard for order status.");
      }
    } catch {
      setMessage("Payment noted. Check dashboard for order status.");
    }
    setIsCreating(false);
    setTimeout(() => router.push(`/dashboard?lang=${locale}`), 600);
  };

  return (
    <div className="space-y-3">
      {!showPayment ? (
        <button
          type="button"
          onClick={handleOrder}
          disabled={isCreating}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Placing order..." : "Add to order / Checkout"}
        </button>
      ) : (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Complete your payment</h3>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {settings?.paymentInstructions ??
              "Please complete the payment via bank transfer and submit the reference number."}
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Payment reference number (optional)
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-20250101-AB12"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submitPayment}
              disabled={isCreating}
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {isCreating ? "Submitting..." : "Submit payment reference"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPayment(false);
                router.push(`/dashboard?lang=${locale}`);
              }}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Skip and view dashboard
            </button>
          </div>
        </div>
      )}
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
