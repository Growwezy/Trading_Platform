import type { TenantConfig } from "@growwezy/api-client";

function hexToRgbTriplet(hex: string): string | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  const [, r, g, b] = match;
  return `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`;
}

/** Applies the tenant's accent color as a CSS custom property, overriding the
 * default in index.css. Never hard-coded — engineering rule in CLAUDE.md. */
export function applyBranding(tenant: TenantConfig | null | undefined) {
  const accentHex = tenant?.brandColors?.accent;
  if (!accentHex) return;

  const triplet = hexToRgbTriplet(accentHex);
  if (triplet) document.documentElement.style.setProperty("--accent", triplet);
}
