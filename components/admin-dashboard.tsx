"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { ProductInput } from "@/lib/dashboard";
import type { Customer, DashboardStats, Payment, SiteSettings } from "@/lib/admin";
import { translations } from "@/lib/i18n";

type AdminTab = "overview" | "products" | "orders" | "customers" | "payments" | "settings";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
  isActive?: boolean;
};

export type OrderRow = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  quantity?: number;
  product?: { name?: string };
  user?: { name?: string; email?: string };
  payment?: { status?: string } | null;
};

type _SiteSettings = SiteSettings;

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🛒" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const emptyProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
  stock: "0",
};

const DEFAULT_SETTINGS_VALUES: _SiteSettings = {
  siteName: "بازار بستها",
  siteDescription: "مارکت‌پلیس پاسخگو با Next.js و Prisma",
  supportEmail: "support@bastaha.com",
  currency: "USD",
  paymentInstructions: "Please complete the payment via bank transfer and submit the reference number.",
  isShopOpen: true,
};

function classNames(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white shadow-md"
          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function AdminDashboard({
  initialProducts,
  initialOrders,
  initialStats,
  initialCustomers,
  initialPayments,
  initialSettings,
  locale,
}: {
  initialProducts: ProductRow[];
  initialOrders: OrderRow[];
  initialStats: DashboardStats;
  initialCustomers: Customer[];
  initialPayments: Payment[];
  initialSettings: _SiteSettings;
  locale: Locale;
}) {
  void locale;
  const t = translations[locale];

  const [tab, setTab] = useState<AdminTab>("overview");
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [stats] = useState<DashboardStats>(initialStats);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [settings, setSettings] = useState<_SiteSettings>({ ...DEFAULT_SETTINGS_VALUES, ...initialSettings });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [message, setMessage] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);

  const flash = (text: string, kind: "ok" | "err" = "ok") => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 4500);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("product");

    const payload: ProductInput & { stock?: number } = {
      name: productForm.name,
      slug: productForm.slug,
      description: productForm.description,
      price: Number(productForm.price),
      image: productForm.image || "#",
      stock: Number(productForm.stock || 0),
    };

    const endpoint = editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
    const response = await fetch(endpoint, {
      method: editingProductId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setBusy(null);

    if (!response.ok) {
      flash(data.error || "Unable to save product.", "err");
      return;
    }

    if (editingProductId) {
      setProducts((current) => current.map((item) => (item.id === editingProductId ? { ...data, price: Number(data.price) } : item)));
    } else {
      setProducts((current) => [{ ...data, price: Number(data.price) }, ...current]);
    }
    flash(editingProductId ? "Product updated successfully." : "Product created successfully.");
    resetProductForm();
  };

  const startEditProduct = (product: ProductRow) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      image: product.image,
      stock: String(product.stock ?? 0),
    });
    setTab("products");
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setBusy(`delete-${id}`);
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(null);
    if (response.ok) {
      setProducts((c) => c.filter((p) => p.id !== id));
      flash("Product deleted.");
    } else {
      flash("Could not delete product.", "err");
    }
  };

  const handleToggleProduct = async (id: string, isActive: boolean) => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (response.ok) {
      setProducts((c) => c.map((p) => (p.id === id ? { ...p, isActive } : p)));
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      flash(data.error || "Unable to update order status.", "err");
      return;
    }
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: data.status || status } : order)));
    flash("Order status updated.");
  };

  const handleCustomerRole = async (customerId: string, role: string) => {
    const response = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await response.json();
    if (!response.ok) {
      flash(data.error || "Unable to update customer.", "err");
      return;
    }
    setCustomers((c) => c.map((cust) => (cust.id === customerId ? data : cust)));
    flash("Customer role updated.");
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Delete this customer and all their orders/payments?")) return;
    setBusy(`cust-${customerId}`);
    const response = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
    setBusy(null);
    if (response.ok) {
      setCustomers((c) => c.filter((x) => x.id !== customerId));
      flash("Customer deleted.");
    } else {
      flash("Could not delete customer.", "err");
    }
  };

  const handlePaymentStatus = async (paymentId: string, status: Payment["status"]) => {
    const response = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      flash(data.error || "Unable to update payment.", "err");
      return;
    }
    setPayments((p) => p.map((x) => (x.id === paymentId ? { ...x, status: data.status || status } : x)));
    flash("Payment status updated.");
  };

  const saveSettings = async () => {
    setBusy("settings");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) {
      flash(data.error || "Unable to save settings.", "err");
      return;
    }
    setSettings(data);
    flash("Settings saved.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-[2rem] bg-white p-5 shadow-sm">
        {TABS.map((t) => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} label={t.label} icon={t.icon} />
        ))}
      </div>

      {message ? (
        <div className={classNames("rounded-3xl p-4 text-sm font-medium shadow-sm", message.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800")}>
          {message.text}
        </div>
      ) : null}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Revenue" value={`$${Number(stats.totalRevenue || totalRevenue).toFixed(2)}`} accent="text-emerald-700" />
            <StatCard label="Total Orders" value={stats.totalOrders || orders.length} accent="text-slate-900" />
            <StatCard label="Total Products" value={stats.totalProducts || products.length} accent="text-amber-700" />
            <StatCard label="Total Customers" value={stats.totalCustomers || customers.length} accent="text-indigo-700" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Recent Orders</h2>
              <div className="mt-6 space-y-3">
                {orders.slice(0, 5).length === 0 ? (
                  <p className="text-slate-500">No orders yet.</p>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-medium">{order.product?.name ?? "Product"}</p>
                        <p className="text-sm text-slate-600">{order.user?.name ?? order.user?.email ?? "Customer"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">${Number(order.total).toFixed(2)}</span>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase text-white">{order.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Revenue (Last 7 Days)</h2>
              <div className="mt-6 space-y-3">
                {(stats.revenueByDay || []).map((day) => {
                  const max = Math.max(...(stats.revenueByDay || []).map((d) => d.total), 1);
                  const pct = Math.round((day.total / max) * 100);
                  return (
                    <div key={day.date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{day.date}</span>
                        <span className="font-medium text-slate-900">${day.total.toFixed(2)}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{editingProductId ? "Edit Product" : "Add New Product"}</h2>
              <p className="mt-1 text-sm text-slate-600">Publish products for customers to browse and order.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{products.length} items</div>
          </div>

          <form onSubmit={handleProductSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Product name
              <input
                value={productForm.name}
                onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Slug
              <input
                value={productForm.slug}
                onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Description
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-2 min-h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Stock
              <input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Image URL
              <input
                value={productForm.image}
                onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <div className="flex items-center gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={busy === "product"}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy === "product" ? "Saving..." : editingProductId ? "Save changes" : "Publish product"}
              </button>
              {editingProductId ? (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h3 className="text-xl font-semibold text-slate-900">Product Inventory</h3>
            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{product.description}</p>
                      <p className="mt-2 text-xs text-slate-500">Slug: {product.slug}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-2xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</p>
                      <p className="text-sm text-slate-500">Stock: {product.stock ?? 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEditProduct(product)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProduct(product.id, !(product.isActive ?? true))}
                      className={classNames(
                        "rounded-full border px-4 py-2 text-sm font-semibold",
                        product.isActive ?? true
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-slate-300 bg-white text-slate-700"
                      )}
                    >
                      {(product.isActive ?? true) ? "Active" : "Inactive"}
                    </button>
                    <button
                      type="button"
                      disabled={busy === `delete-${product.id}`}
                      onClick={() => handleDeleteProduct(product.id)}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 ? <p className="text-slate-500">No products yet.</p> : null}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">Orders</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{orders.length} total</span>
          </div>
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.product?.name ?? "Product"}</p>
                    <p className="text-sm text-slate-600">
                      {order.user?.name ?? "Customer"} · {order.user?.email ?? ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{t.quantity}: {order.quantity ?? 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">${Number(order.total).toFixed(2)}</p>
                    <span className="mt-1 inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase text-white">{order.status}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    defaultValue={order.status}
                    onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {order.payment?.status ? (
                    <span className={classNames(
                      "rounded-full px-3 py-1 text-xs font-medium uppercase",
                      order.payment.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.payment.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : order.payment.status === "refunded"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-amber-100 text-amber-900"
                    )}>
                      Payment: {order.payment.status}
                    </span>
                  ) : null}
                  <span className="text-sm text-slate-600">{order.createdAt}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 ? <p className="text-slate-500">No orders yet.</p> : null}
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">Customers</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{customers.length} users</span>
          </div>
          <div className="mt-6 space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[200px]">
                    <p className="text-lg font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-600">{customer.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Member since {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right min-w-[140px]">
                    <p className="text-lg font-semibold text-slate-900">{customer.totalOrders} orders</p>
                    <p className="text-sm text-emerald-700 font-medium">${Number(customer.totalSpent).toFixed(2)} spent</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={customer.role}
                    onChange={(event) => handleCustomerRole(customer.id, event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    disabled={busy === `cust-${customer.id}`}
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {customers.length === 0 ? <p className="text-slate-500">No customers yet.</p> : null}
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-900">Payments</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
              ${payments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)} processed
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[200px]">
                    <p className="text-lg font-semibold text-slate-900">
                      {payment.order?.product?.name ?? `Order ${payment.orderId}`}
                    </p>
                    <p className="text-sm text-slate-600">{payment.user?.name ?? "Customer"} · {payment.user?.email ?? ""}</p>
                    {payment.reference ? (
                      <p className="mt-1 text-xs text-slate-500">Reference: {payment.reference}</p>
                    ) : null}
                  </div>
                  <div className="text-right min-w-[140px]">
                    <p className="text-2xl font-bold text-slate-900">${Number(payment.amount).toFixed(2)}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{payment.method}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={payment.status}
                    onChange={(event) => handlePaymentStatus(payment.id, event.target.value as Payment["status"])}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <span className={classNames(
                    "rounded-full px-3 py-1 text-xs font-medium uppercase",
                    payment.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : payment.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : payment.status === "refunded"
                      ? "bg-slate-200 text-slate-800"
                      : "bg-amber-100 text-amber-900"
                  )}>
                    {payment.status}
                  </span>
                  <span className="text-sm text-slate-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {payments.length === 0 ? <p className="text-slate-500">No payments yet. Payments will appear here once customers check out.</p> : null}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Website Settings</h2>
              <p className="mt-1 text-sm text-slate-600">Manage global store configuration.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Site name
              <input
                value={settings.siteName}
                onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Support email
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Currency
              <input
                value={settings.currency}
                onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Site description
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings((s) => ({ ...s, siteDescription: e.target.value }))}
                className="mt-2 min-h-20 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Payment instructions
              <textarea
                value={settings.paymentInstructions}
                onChange={(e) => setSettings((s) => ({ ...s, paymentInstructions: e.target.value }))}
                className="mt-2 min-h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <label className="flex items-center gap-3 lg:col-span-2">
              <input
                type="checkbox"
                checked={settings.isShopOpen}
                onChange={(e) => setSettings((s) => ({ ...s, isShopOpen: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Shop is open for orders</span>
            </label>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={saveSettings}
              disabled={busy === "settings"}
              className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {busy === "settings" ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { Customer, Payment, SiteSettings, DashboardStats };
