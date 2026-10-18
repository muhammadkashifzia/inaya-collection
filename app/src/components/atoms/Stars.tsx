/** Read-only star rating. Fractional ratings are rounded to the nearest star. */
export function Stars({ rating, max = 5, className }: { rating: number; max?: number; className?: string }) {
  const filled = Math.min(max, Math.max(0, Math.round(rating)));
  return (
    <span className={`tracking-widest text-amber-500 ${className ?? ""}`} role="img" aria-label={`${rating} out of ${max} stars`}>
      {"★".repeat(filled)}
      <span className="text-gray-300">{"★".repeat(max - filled)}</span>
    </span>
  );
}
