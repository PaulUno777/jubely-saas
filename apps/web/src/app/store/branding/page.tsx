import { redirect } from "next/navigation";

/** Branding is configured on the enrollment QR page. */
export default function StoreBrandingRedirect() {
  redirect("/store/enrollment-qr");
}
