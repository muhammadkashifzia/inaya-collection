"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/format";

// ---------------------------------------------------------------------------
// Simulated purchase data
// ---------------------------------------------------------------------------

const BUYERS = [
  { name: "Olivia", location: "Germany" },
  { name: "Fatima", location: "Karachi" },
  { name: "Sarah", location: "Lahore" },
  { name: "Ayesha", location: "Dubai" },
  { name: "Zara", location: "London" },
  { name: "Hina", location: "Islamabad" },
  { name: "Amina", location: "Riyadh" },
  { name: "Nadia", location: "Toronto" },
  { name: "Sana", location: "Rawalpindi" },
  { name: "Maria", location: "New York" },
  { name: "Kiran", location: "Faisalabad" },
  { name: "Rabia", location: "Manchester" },
  { name: "Aisha", location: "Multan" },
  { name: "Mehreen", location: "Sydney" },
  { name: "Bushra", location: "Peshawar" },
];

interface SocialProofProduct {
  title: string;
  image: string | null;
}

interface Purchase {
  buyer: (typeof BUYERS)[number];
  product: SocialProofProduct;
  minutesAgo: number;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQueue(products: SocialProofProduct[]): Purchase[] {
  const shuffled = [...BUYERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(products.length, shuffled.length)).map((buyer, i) => ({
    buyer,
    product: products[i % products.length],
    minutesAgo: randomInt(2, 58),
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const STORAGE_KEY = "social-proof-dismissed";
/** Delay before the first toast (ms). */
const INITIAL_DELAY = 8_000;
/** How long a toast stays visible (ms). */
const SHOW_DURATION = 6_000;
/** Gap between toasts (ms). */
const GAP_DURATION = 20_000;

/**
 * Bottom-left "Someone just purchased …" social-proof notification.
 *
 * It collects product titles & images from `data-sp-title` / `data-sp-image`
 * attributes on the page (set by server-rendered product cards/grids) so the
 * shown products are always real catalogue items. When no products are found
 * it falls back to generic titles.
 */
export function SocialProofToast() {
  const [current, setCurrent] = useState<Purchase | null>(null);
  const [visible, setVisible] = useState(false);
  const queue = useRef<Purchase[]>([]);
  const idx = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
    clearTimeout(timerRef.current);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Don't show if already dismissed this session.
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }

    // Collect real products from the DOM (ProductGrid/ProductRail render cards
    // with data-sp-title on the outer element). Fall back to generic titles.
    const cards = document.querySelectorAll<HTMLElement>("[data-sp-title]");
    let products: SocialProofProduct[];
    if (cards.length > 0) {
      products = Array.from(cards).map((el) => ({
        title: el.dataset.spTitle!,
        image: el.dataset.spImage ?? null,
      }));
    } else {
      products = [
        { title: "Khaddar 3-Piece Suit", image: null },
        { title: "Cotton Viscose Collection", image: null },
        { title: "Embroidered Karandi Suit", image: null },
        { title: "Premium Winter Shawl", image: null },
      ];
    }

    // Shuffle and build the queue.
    products.sort(() => Math.random() - 0.5);
    queue.current = buildQueue(products);

    function showNext() {
      if (idx.current >= queue.current.length) {
        idx.current = 0; // loop
      }
      const purchase = queue.current[idx.current++];
      setCurrent(purchase);
      setVisible(true);

      // Auto-hide after SHOW_DURATION, then schedule next.
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = setTimeout(showNext, GAP_DURATION);
      }, SHOW_DURATION);
    }

    timerRef.current = setTimeout(showNext, INITIAL_DELAY);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-4 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-line bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      {/* Product image */}
      {current.product.image && (
        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-cream">
          <Image
            src={current.product.image}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted">
          <span className="font-semibold text-ink">{current.buyer.name}</span>
          {" "}({current.buyer.location}) purchased
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{current.product.title}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span>{current.minutesAgo} minutes ago</span>
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Icon name="check" size={12} strokeWidth={2.5} />
            Verified
          </span>
        </p>
      </div>

      {/* Close */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="shrink-0 cursor-pointer text-muted transition-colors hover:text-ink"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
