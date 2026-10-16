import { Link } from "react-router";
import { BoxCubeIcon, CartIcon, DollarLineIcon, GroupIcon } from "@/icons";
import { money } from "@/lib/format";
import type { DashboardData } from "@/types/api";
import { cn } from "@/utils";

interface Metric {
  label: string;
  value: string;
  icon: React.ReactNode;
  to: string;
  tone: string;
  note?: string;
}

/** Headline numbers from GET /admin/dashboard. */
export default function MetricCards({ totals, revenueDefinition }: { totals: DashboardData["totals"]; revenueDefinition: string }) {
  const metrics: Metric[] = [
    { label: "Revenue", value: money(totals.revenue), icon: <DollarLineIcon className="size-6" />, to: "/orders?status=delivered", tone: "bg-brand-500 text-white", note: revenueDefinition },
    { label: "Orders", value: totals.orders.toLocaleString(), icon: <CartIcon className="size-6" />, to: "/orders", tone: "bg-ink-900 text-white dark:bg-white/10" },
    { label: "Customers", value: totals.customers.toLocaleString(), icon: <GroupIcon className="size-6" />, to: "/customers", tone: "bg-cream text-ink-900 dark:bg-white/10 dark:text-white" },
    { label: "Products", value: totals.products.toLocaleString(), icon: <BoxCubeIcon className="size-6" />, to: "/products", tone: "bg-cream text-ink-900 dark:bg-white/10 dark:text-white" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <Link
          key={m.label}
          to={m.to}
          title={m.note}
          className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/3"
        >
          <span className={cn("flex size-12 items-center justify-center rounded-xl", m.tone)}>{m.icon}</span>
          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">{m.label}</p>
          <p className="mt-1 text-title-sm font-bold text-ink-900 dark:text-white/90">{m.value}</p>
        </Link>
      ))}
    </div>
  );
}

/** Small status counters (pending / completed / cancelled / low stock). */
export function StatusStrip({ totals }: { totals: DashboardData["totals"] }) {
  const items = [
    { label: "Pending orders", value: totals.pending_orders, to: "/orders?status=pending", dot: "bg-warning-500" },
    { label: "Delivered", value: totals.completed_orders, to: "/orders?status=delivered", dot: "bg-success-500" },
    { label: "Cancelled", value: totals.cancelled_orders, to: "/orders?status=cancelled", dot: "bg-gray-400" },
    { label: "Low-stock variants", value: totals.low_stock_variants, to: "/inventory?low_stock=1", dot: "bg-brand-500" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <Link key={i.label} to={i.to} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-200 dark:border-gray-800 dark:bg-white/3">
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className={cn("size-2 rounded-full", i.dot)} aria-hidden="true" />
            {i.label}
          </span>
          <span className="text-lg font-semibold text-ink-900 dark:text-white">{i.value}</span>
        </Link>
      ))}
    </div>
  );
}
