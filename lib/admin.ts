/** Comma-separated list in ADMIN_EMAILS (server-only). */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS ?? ""
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}
