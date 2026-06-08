"use client";

import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
} from "@jubely/ui";
import { ApiResponseError } from "@jubely/api-schemas";

type MerchantDataTableProps<T> = Omit<
  DataTableProps<T>,
  "getErrorMessage"
> & {
  errorLabel: string;
};

/** @deprecated Prefer `@jubely/ui` `DataTable` directly. */
export function MerchantDataTable<T>({
  error,
  errorLabel,
  ...props
}: MerchantDataTableProps<T>) {
  return (
    <DataTable
      {...props}
      error={error}
      getErrorMessage={(err) =>
        err instanceof ApiResponseError ? err.message : errorLabel
      }
    />
  );
}

export type { DataTableColumn as MerchantDataTableColumn };
