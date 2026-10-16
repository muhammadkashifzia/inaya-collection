import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import Card from "@/components/admin/Card";
import { money } from "@/lib/format";
import type { DashboardData } from "@/types/api";

const RANGES = [7, 30, 90] as const;

interface SalesChartProps {
  sales: DashboardData["sales"];
  days: number;
  onDaysChange: (days: number) => void;
}

/** Daily revenue (area) and orders (column) for the selected range. */
export default function SalesChart({ sales, days, onDaysChange }: SalesChartProps) {
  const labels = sales.map((d) => new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
  const total = sales.reduce((sum, d) => sum + d.revenue, 0);
  const orders = sales.reduce((sum, d) => sum + d.orders, 0);

  const options: ApexOptions = {
    chart: { fontFamily: "Jost, sans-serif", toolbar: { show: false }, height: 320, stacked: false },
    colors: ["#c4122f", "#0b1d36"],
    stroke: { curve: "smooth", width: [2.5, 0] },
    fill: { type: ["gradient", "solid"], gradient: { opacityFrom: 0.35, opacityTo: 0 } },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 3 } },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left" },
    grid: { borderColor: "#e4e7ec", strokeDashArray: 4, xaxis: { lines: { show: false } } },
    xaxis: { categories: labels, tickAmount: Math.min(labels.length, 10), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: [
      { title: { text: "Revenue" }, labels: { formatter: (v) => `Rs ${Math.round(v / 1000)}k` } },
      { opposite: true, title: { text: "Orders" }, labels: { formatter: (v) => String(Math.round(v)) } },
    ],
    tooltip: { shared: true, y: { formatter: (v, opts) => (opts?.seriesIndex === 0 ? money(v) : `${v} orders`) } },
  };

  return (
    <Card
      title="Sales overview"
      description={`${money(total)} from ${orders} order${orders === 1 ? "" : "s"} in the last ${days} days (excludes pending, cancelled and refunded)`}
      actions={
        <div role="group" aria-label="Date range" className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={days === r}
              onClick={() => onDaysChange(r)}
              className={`rounded-md px-3 py-1.5 text-theme-xs font-medium ${days === r ? "bg-white text-ink-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      }
    >
      <div className="-ms-3">
        <Chart
          options={options}
          series={[
            { name: "Revenue", type: "area", data: sales.map((d) => d.revenue) },
            { name: "Orders", type: "column", data: sales.map((d) => d.orders) },
          ]}
          height={320}
        />
      </div>
    </Card>
  );
}
