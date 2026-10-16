import Badge from "@/components/ui/badge/Badge";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/types/api";

type Color = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const ORDER_COLOR: Record<OrderStatus, Color> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "light",
  refunded: "error",
};

const PAYMENT_COLOR: Record<PaymentStatus, Color> = {
  pending: "warning",
  paid: "success",
  failed: "error",
  refunded: "error",
  cancelled: "light",
};

const PRODUCT_COLOR: Record<ProductStatus, Color> = { active: "success", draft: "warning", archived: "light" };

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge size="sm" color={ORDER_COLOR[status]}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge size="sm" color={PAYMENT_COLOR[status]}>
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge size="sm" color={PRODUCT_COLOR[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function ActiveBadge({ active, on = "Active", off = "Inactive" }: { active: boolean; on?: string; off?: string }) {
  return (
    <Badge size="sm" color={active ? "success" : "light"}>
      {active ? on : off}
    </Badge>
  );
}
