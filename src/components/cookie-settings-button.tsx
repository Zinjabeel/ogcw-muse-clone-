import { openConsent } from "@/lib/consent";

/** Reopens the cookie choices (Cookie Policy page, footer, menu) */
export function CookieSettingsButton({ className, children = "Cookie settings" }: { className?: string; children?: string }) {
  return <button type="button" className={className} onClick={openConsent}>{children}</button>;
}
