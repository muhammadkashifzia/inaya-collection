import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "start" | "end";
}

/** Thin column-config wrapper over the template's Table primitives. */
export default function DataTable<T>({ columns, rows, rowKey, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <Table className="text-sm">
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
          <TableRow>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                isHeader
                className={cn("px-4 py-3 text-theme-xs font-semibold tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400", c.align === "end" ? "text-end" : "text-start", c.className)}
              >
                {c.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className="hover:bg-gray-50/60 dark:hover:bg-white/2">
              {columns.map((c) => (
                <TableCell key={c.key} className={cn("px-4 py-3 text-gray-700 dark:text-gray-300", c.align === "end" ? "text-end" : "text-start", c.className)}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
