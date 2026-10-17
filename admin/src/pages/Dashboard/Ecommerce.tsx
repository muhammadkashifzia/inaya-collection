import { useState } from "react";
import { Link } from "react-router";
import DataState from "@/components/admin/DataState";
import PageHeader from "@/components/admin/PageHeader";
import PageMeta from "@/components/common/PageMeta";
import { BestSellers, LowStock, RecentOrders } from "@/components/dashboard/DashboardLists";
import MetricCards, { StatusStrip } from "@/components/dashboard/MetricCards";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import SalesChart from "@/components/dashboard/SalesChart";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { http } from "@/lib/api";
import type { DashboardData } from "@/types/api";

/** Dashboard overview — every number comes from GET /api/v1/admin/dashboard. */
export default function Ecommerce() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useApi(() => http.get<{ data: DashboardData }>("/admin/dashboard", { days }).then((r) => r.data), [days]);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageMeta title="Dashboard | Anaya Collection Admin" description="Store overview: revenue, orders, customers and stock." />
      <PageHeader
        title={`${greeting}, ${user?.name.split(" ")[0] ?? ""}`}
        description="Here's how the store is doing."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={reload} loading={loading && Boolean(data)}>
              Refresh
            </Button>
            <Link to="/products/new" className="inline-flex items-center rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600">
              + Add product
            </Link>
          </>
        }
      />
      <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(data)}>
        {data && (
          <div className="space-y-6">
            <MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />
            <StatusStrip totals={data.totals} />
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8">
                <SalesChart sales={data.sales} days={days} onDaysChange={setDays} />
              </div>
              <div className="col-span-12 xl:col-span-4">
                <OrderStatusChart counts={data.status_counts} />
              </div>
              <div className="col-span-12 xl:col-span-8">
                <RecentOrders orders={data.recent_orders} />
              </div>
              <div className="col-span-12 space-y-6 xl:col-span-4">
                <BestSellers items={data.best_sellers} />
                <LowStock items={data.low_stock} />
              </div>
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}
