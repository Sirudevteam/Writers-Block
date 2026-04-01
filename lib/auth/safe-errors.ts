/**
 * Map Supabase auth errors to fixed, non-sensitive strings (no raw echo — reduces XSS/info leak).
 */
export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "Invalid email or password."
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email before signing in."
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists."
  }
  if (m.includes("password") && m.includes("least")) {
    return "Password does not meet the requirements."
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait and try again."
  }
  if (m.includes("signup_disabled") || m.includes("signups not allowed")) {
    return "New registrations are temporarily unavailable."
  }

  return "Something went wrong. Please try again."
}
