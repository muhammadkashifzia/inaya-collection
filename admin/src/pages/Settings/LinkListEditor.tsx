interface Link {
  label: string;
  href: string;
}

const input = "h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Editable list of label + URL pairs with reordering. */
export default function LinkListEditor({ links, onChange, max, placeholderHref = "/collections/…" }: { links: Link[]; onChange: (links: Link[]) => void; max: number; placeholderHref?: string }) {
  const update = (i: number, patch: Partial<Link>) => onChange(links.map((l, li) => (li === i ? { ...l, ...patch } : l)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex flex-wrap gap-2">
          <div className="flex flex-col text-theme-xs leading-none">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="text-gray-400 disabled:opacity-20">▲</button>
            <button type="button" aria-label="Move down" disabled={i === links.length - 1} onClick={() => move(i, 1)} className="text-gray-400 disabled:opacity-20">▼</button>
          </div>
          <input aria-label="Label" className={`${input} w-48`} value={l.label} maxLength={60} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
          <input aria-label="Link" className={`${input} min-w-48 flex-1`} value={l.href} maxLength={255} placeholder={placeholderHref} onChange={(e) => update(i, { href: e.target.value })} />
          <button type="button" aria-label="Remove link" className="px-2 text-gray-400 hover:text-error-500" onClick={() => onChange(links.filter((_, li) => li !== i))}>×</button>
        </div>
      ))}
      {links.length < max && (
        <button type="button" className="text-sm font-medium text-brand-500" onClick={() => onChange([...links, { label: "", href: "" }])}>
          + Add link
        </button>
      )}
    </div>
  );
}
