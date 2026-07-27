"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export default function OrderButton({ productId, locale }: { productId: string; locale: Locale }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Order created successfully.");
      router.push(`/dashboard?lang=${locale}`);
      return;
    }

    setMessage(data.error || "Unable to place order.");
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleOrder}
        disabled={isCreating}
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? "Placing order..." : "Add to order"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
