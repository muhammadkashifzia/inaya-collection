import { cn } from "@/lib/utils";
import { Container, Icon, type IconName } from "@/components/atoms";
import type { TrustItem } from "@/lib/types";

const iconMap: Record<string, IconName> = {
  truck: "truck",
  shield: "shield",
  lock: "lock",
  map: "map",
};

interface TrustBarProps {
  items: TrustItem[];
}

export function TrustBar({ items }: TrustBarProps) {
  if (items.length === 0) return null;

  return (
    <section className="bg-cream py-8 md:py-10">
      <Container>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-3 text-center",
                i > 0 && "lg:border-l lg:border-line",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Icon
                  name={iconMap[item.icon] ?? "check"}
                  size={22}
                  className="text-brand"
                />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
