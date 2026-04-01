import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildScreenplayPdfBuffer } from "@/lib/screenplay-pdf"
import { sendScreenplayPdfEmail } from "@/lib/email"
import { getApiRatelimit, getClientIP } from "@/lib/ratelimit"

export const dynamic = "force-dynamic"

const MAX_BODY_CONTENT_CHARS = 600_000

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ipResult = await getApiRatelimit().limit(getClientIP(req))
  if (!ipResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 }
    )
  }

  let bodyContent: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.content === "string") {
      bodyContent = body.content
    }
  } catch {
    /* optional body */
  }

  if (bodyContent !== undefined && bodyContent.length > MAX_BODY_CONTENT_CHARS) {
    return NextResponse.json({ error: "Content too large" }, { status: 400 })
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, content")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const content = (bodyContent ?? project.content ?? "").trim()
  if (!content) {
    return NextResponse.json(
      { error: "No screenplay content to send. Add text or save your draft first." },
      { status: 400 }
    )
  }

  const title = project.title?.trim() || "Untitled Screenplay"

  try {
    const pdfBuffer = await buildScreenplayPdfBuffer(title, content)
    const sent = await sendScreenplayPdfEmail(user.email, title, pdfBuffer)

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "Email could not be sent. Ensure RESEND_API_KEY and RESEND_FROM_EMAIL are configured.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, message: `PDF sent to ${user.email}` },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to build PDF"
    console.error("[send-pdf]", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
