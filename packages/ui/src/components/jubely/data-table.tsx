import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "../../cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  getErrorMessage?: (error: unknown) => string;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  loadingLabel = "Loading…",
  errorLabel = "Failed to load data.",
  emptyLabel = "No results.",
  getErrorMessage,
  onRowClick,
  footer,
  className,
}: DataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <div data-slot="data-table" className={cn("flex flex-col", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName ?? col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="py-8 text-sm text-muted-foreground">
                {loadingLabel}
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="py-8 text-sm text-destructive">
                {getErrorMessage ? getErrorMessage(error) : errorLabel}
              </TableCell>
            </TableRow>
          ) : rows?.length ? (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                data-clickable={onRowClick ? true : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="py-8 text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
