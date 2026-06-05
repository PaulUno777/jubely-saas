"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";

type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type MerchantDataTableProps<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
};

export function MerchantDataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  loadingLabel,
  errorLabel,
  emptyLabel,
}: MerchantDataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-sm text-muted-foreground">
              {loadingLabel}
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-sm text-destructive">
              {error instanceof ApiResponseError ? error.message : errorLabel}
            </TableCell>
          </TableRow>
        ) : rows?.length ? (
          rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-sm text-muted-foreground">
              {emptyLabel}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
