"use client";

import { useCallback, useMemo, useState } from "react";

export type UsePaginationOptions = {
  defaultLimit?: number;
  total?: number;
};

export function usePagination({ defaultLimit = 25, total = 0 }: UsePaginationOptions = {}) {
  const [offset, setOffset] = useState(0);
  const [limit, setLimitState] = useState(defaultLimit);

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / limit) || 1);
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  const setPage = useCallback(
    (nextPage: number) => {
      const safePage = Math.min(Math.max(1, nextPage), totalPages);
      setOffset((safePage - 1) * limit);
    },
    [limit, totalPages],
  );

  const setLimit = useCallback((nextLimit: number) => {
    setLimitState(nextLimit);
    setOffset(0);
  }, []);

  const reset = useCallback(() => setOffset(0), []);

  return useMemo(
    () => ({
      offset,
      limit,
      page,
      totalPages,
      from,
      to,
      setOffset,
      setPage,
      setLimit,
      reset,
    }),
    [offset, limit, page, totalPages, from, to, setPage, setLimit, reset],
  );
}
