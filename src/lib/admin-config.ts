/**
 * Admin configuration — single source of truth for admin access control.
 *
 * Used by both the admin layout guard and the admin API routes.
 * If you need to add another admin, update the ADMIN_EMAILS array.
 */

export const ADMIN_EMAILS: readonly string[] = [
  process.env.ADMIN_EMAIL || 'skillmakers246@gmail.com',
];

/**
 * Check if an email is an admin email.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
