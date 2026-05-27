import { env } from "@/config/env";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Compare login form values to env-configured admin credentials. */
export function verifyAdminCredentials(email: string, password: string) {
  const inputEmail = normalizeEmail(email);
  const configuredEmail = normalizeEmail(env.ADMIN_EMAIL);
  return inputEmail === configuredEmail && password === env.ADMIN_PASSWORD;
}

/** Mask email for login hint (e.g. ad***@example.com). */
export function maskAdminEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
