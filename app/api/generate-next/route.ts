import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { createClient } from "@/lib/supabase/server"
import { runAiRateLimits } from "@/lib/ai-rate-limits"
import { getEffectivePlan } from "@/lib/subscription"
import { buildTextCompletionInput, getReplicateModel, getStreamOutputText } from "@/lib/replicate-model"

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
const model = getReplicateModel()

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ── Subscription check ────────────────────────────────────────────────────
    const { data: subscription } = await (supabase.from("subscriptions") as any)
      .select("plan, status")
      .eq("user_id", user.id)
      .single()

    const effectivePlan = getEffectivePlan(subscription ?? null)
    const rate = await runAiRateLimits(req, effectivePlan, user.id)
    if (!rate.ok) return rate.response
    const { planQuota } = rate

    const { screenplay, genre, characters, mood } = await req.json()

    if (!screenplay || screenplay.trim().length < 100) {
      return NextResponse.json({ error: "Existing screenplay is too short to continue" }, { status: 400 })
    }

    // Fire-and-forget usage log
    void (supabase as any).from("usage_logs")
      .insert({ user_id: user.id, endpoint: "generate-next", plan: effectivePlan })

    const systemPrompt = `You are an expert Tamil cinema screenplay writer continuing an existing screenplay.

RULES:
1. Read the existing screenplay carefully — understand the story so far
2. Continue EXACTLY where it left off — same tone, same characters, same style
3. Write 3-5 NEW scenes that advance the story logically
4. Follow the same format: scene headings in ENGLISH, content in TAMIL
5. Keep character names consistent with what's already written
6. Do NOT repeat scenes that already exist
7. End with a clear narrative beat (not mid-sentence)
8. Do NOT include the original screenplay in your response — only the NEW scenes`

    const userPrompt = `EXISTING SCREENPLAY:
${screenplay}

---
CONTINUE the story with 3-5 new scenes.
Genre: ${genre || "drama"}
Characters: ${characters || "same as existing"}
Mood: ${mood || "same as existing"}

Write only the NEW continuation scenes starting from where the screenplay ended:`

    const input = buildTextCompletionInput(model, {
      systemPrompt: systemPrompt,
      userPrompt,
      maxTokens: parseInt(process.env.MAX_TOKENS || "8000", 10),
      temperature: 0.75,
      topP: 0.9,
      llama: { minTokens: 400, presencePenalty: 0.3 },
    })

    const stream = await replicate.stream(model as `${string}/${string}`, { input })

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of stream) {
          const text = getStreamOutputText(chunk)
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(planQuota.remaining),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate next scene" },
      { status: 500 }
    )
  }
}
