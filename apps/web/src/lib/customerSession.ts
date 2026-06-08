"use client";

const key = "jubely_customer_session_v1";
const customerQrChangeEvent = "jubely_customer_qr_change";

export function loadCustomerQr(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function subscribeCustomerQr(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const fn = () => onChange();
  window.addEventListener(customerQrChangeEvent, fn);
  return () => window.removeEventListener(customerQrChangeEvent, fn);
}

export function saveCustomerQr(qr: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, qr);
  window.dispatchEvent(new Event(customerQrChangeEvent));
}

export function clearCustomerQr() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.dispatchEvent(new Event(customerQrChangeEvent));
}

