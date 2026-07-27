"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { ProductInput } from "@/lib/dashboard";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
};

export type OrderRow = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  product?: { name?: string };
  user?: { name?: string };
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
};

export default function AdminDashboard({
  initialProducts,
  initialOrders,
  locale,
}: {
  initialProducts: ProductRow[];
  initialOrders: OrderRow[];
  locale: Locale;
}) {
  void locale;
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);

  const resetForm = () => {
    setEditingProductId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const payload: ProductInput = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: Number(form.price),
      image: form.image || "#",
    };

    const endpoint = editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
    const response = await fetch(endpoint, {
      method: editingProductId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to save product.");
      return;
    }

    if (editingProductId) {
      setProducts((current) => current.map((item) => (item.id === editingProductId ? data : item)));
    } else {
      setProducts((current) => [data, ...current]);
    }

    setMessage(editingProductId ? "Product updated successfully." : "Product created successfully.");
    resetForm();
  };

  const startEdit = (product: ProductRow) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      image: product.image,
    });
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to update order status.");
      return;
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: data.status } : order)));
    setMessage("Order status updated.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Add or edit products</h2>
            <p className="mt-2 text-sm text-slate-600">Create new inventory items or update existing ones directly here.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Revenue: ${totalRevenue.toFixed(2)}
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Product name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Slug
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-2 min-h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Price
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Image URL
            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            />
          </label>
          <div className="flex items-center gap-3 lg:col-span-2">
            <button type="submit" disabled={isSaving} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              {editingProductId ? "Save changes" : "Create product"}
            </button>
            {editingProductId ? (
              <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">Products</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{products.length} items</span>
          </div>
          <div className="mt-6 space-y-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${Number(product.price).toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{product.slug}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={() => startEdit(product)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Edit product
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">Orders</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{orders.length} orders</span>
          </div>
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.product?.name ?? "Product"}</p>
                    <p className="text-sm text-slate-600">{order.user?.name ?? "Customer"}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white uppercase">{order.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    defaultValue={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span className="text-sm text-slate-600">Total: ${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
