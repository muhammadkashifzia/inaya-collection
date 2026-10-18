import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import Card from "@/components/admin/Card";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import type { DashboardData, OrderStatus } from "@/types/api";

const COLORS: Record<OrderStatus, string> = {
  pending: "#f79009",
  confirmed: "#0ba5ec",
  processing: "#2b4670",
  shipped: "#0b1d36",
  out_for_delivery: "#f97316",
  delivered: "#12b76a",
  cancelled: "#98a2b3",
  refunded: "#c4122f",
};

/** Donut of all orders by status. */
export default function OrderStatusChart({ counts }: { counts: DashboardData["status_counts"] }) {
  const entries = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => [s, counts[s] ?? 0] as const).filter(([, n]) => n > 0);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);

  const options: ApexOptions = {
    chart: { fontFamily: "Jost, sans-serif" },
    labels: entries.map(([s]) => ORDER_STATUS_LABEL[s]),
    colors: entries.map(([s]) => COLORS[s]),
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    plotOptions: { pie: { donut: { size: "70%", labels: { show: true, total: { show: true, label: "Orders" } } } } },
  };

  return (
    <Card title="Orders by status">
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">No orders yet.</p>
      ) : (
        <Chart type="donut" options={options} series={entries.map(([, n]) => n)} height={300} />
      )}
    </Card>
  );
}
