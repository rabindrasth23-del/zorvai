"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Example type for Session History
export type SessionData = {
  id: string;
  date: string;
  subject: string;
  duration: number; // minutes
  masteryScore: number;
  status: "completed" | "interrupted" | "scheduled";
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-md border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-sm font-sans text-left">
          <thead className="bg-[var(--color-muted)] text-[var(--color-text-muted)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            header.column.getCanSort() ? "cursor-pointer select-none" : ""
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border bg-surface text-[var(--color-text)]">
            {isLoading ? (
              // Skeleton rows for loading state
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((_, colIndex) => (
                    <td key={`skeleton-col-${colIndex}`} className="px-4 py-3 whitespace-nowrap">
                      <div className="h-5 w-3/4 bg-[var(--color-muted)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[var(--color-muted)] transition-colors data-[state=selected]:bg-[var(--color-muted)]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-[var(--color-text-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-[var(--text-body-sm)] font-medium">No sessions found.</span>
                    <span className="text-[var(--text-caption)]">Complete an onboarding check-in to start.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <button
          className="px-3 py-1 text-sm border border-border rounded hover:bg-[var(--color-muted)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text)] font-sans"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 text-sm border border-border rounded hover:bg-[var(--color-muted)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text)] font-sans"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
