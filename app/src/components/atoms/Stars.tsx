export function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="tracking-widest text-amber-500" role="img" aria-label={`${rating} out of ${max} stars`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(Math.max(0, max - rating))}</span>
    </span>
  );
}
