const EMAIL_MAX = 254
const NAME_MAX = 100
const PASSWORD_MIN = 8
/** bcrypt / common auth limit */
const PASSWORD_MAX = 72

export function validateEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const email = raw.trim().toLowerCase()
  if (!email || email.length > EMAIL_MAX) return null
  if (/[<>\"'`\s]/.test(email)) return null
  const re = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i
  if (!re.test(email)) return null
  return email
}

export function validatePasswordSignIn(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  if (raw.length < 1 || raw.length > PASSWORD_MAX) return null
  return raw
}

export function validatePasswordSignUp(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  if (raw.length < PASSWORD_MIN || raw.length > PASSWORD_MAX) return null
  if (!/[A-Z]/.test(raw) || !/[0-9]/.test(raw)) return null
  return raw
}

export function validateDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const name = raw.trim().replace(/\s+/g, " ")
  if (name.length < 1 || name.length > NAME_MAX) return null
  if (/[<>]/.test(name) || /[\u0000-\u001f]/.test(name)) return null
  return name
}
