// Reserved subdomains, per CLAUDE.md "Domains". Checked here as defense in
// depth — the real enforcement point is client-application submission,
// which must never let one of these become a tenant row in the first place.
export const RESERVED_SUBDOMAINS = ["admin", "api", "www", "trade", "mail"];
