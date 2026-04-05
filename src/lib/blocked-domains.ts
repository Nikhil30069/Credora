const BLOCKED = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "yahoo.co.jp",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.it",
  "yahoo.es",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.de",
  "hotmail.it",
  "outlook.com",
  "outlook.in",
  "live.com",
  "live.co.uk",
  "live.in",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "zoho.com",
  "zohomail.in",
  "mail.com",
  "email.com",
  "yandex.com",
  "yandex.ru",
  "rediffmail.com",
  "inbox.com",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "tuta.io",
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "10minutemail.com",
]);

export function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

export function isBlockedDomain(email: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return true;
  return BLOCKED.has(domain);
}

export function domainDisplayName(domain: string): string {
  const parts = domain.split(".");
  if (parts.length < 2) return domain;
  const name = parts.slice(0, -1).join(".");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
