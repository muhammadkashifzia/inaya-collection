import Link from "next/link";
import type { FooterColumn } from "@/types";

export function FooterLinks({ column }: { column: FooterColumn }) {
  return (
    <nav aria-label={column.heading}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{column.heading}</h2>
      <ul className="space-y-2">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
