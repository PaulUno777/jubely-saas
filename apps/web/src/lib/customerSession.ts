"use client";

const key = "jubely_customer_session_v1";

export function loadCustomerQr(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function saveCustomerQr(qr: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, qr);
}

export function clearCustomerQr() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

