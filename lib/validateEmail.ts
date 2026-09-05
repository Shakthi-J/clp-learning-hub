/**
 * A pragmatic email format check - not RFC 5322, just enough to catch typos
 * and placeholder junk (missing @, no domain, no TLD) before an account gets
 * created. Format alone can't prove an address is real or reachable; the
 * password-reset-by-email flow is what actually confirms that.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
