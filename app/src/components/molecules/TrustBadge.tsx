import { Icon } from "@/components/atoms";
import type { TrustItem } from "@/types";

export function TrustBadge({ item }: { item: TrustItem }) {
  return (
    <div className="flex items-center gap-3 px-2 py-4 md:justify-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand">
        <Icon name={item.icon} />
      </span>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">{item.title}</h3>
        <p className="text-xs uppercase text-muted">{item.text}</p>
      </div>
    </div>
  );
}
