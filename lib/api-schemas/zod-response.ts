import { NextResponse } from "next/server"
import type { ZodError } from "zod"

/**
 * Safe 400 for Zod validation — first issue only, no stack or raw input.
 */
export function zodErrorJsonResponse(
  err: ZodError,
  headers?: HeadersInit
): NextResponse {
  const first = err.issues[0]
  const message = first
    ? `${first.path.length ? `${first.path.join(".")}: ` : ""}${first.message}`
    : "Invalid request body"
  return NextResponse.json({ error: message }, { status: 400, headers })
}
