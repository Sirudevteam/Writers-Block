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

    const { screenplay } = await req.json()

    if (!screenplay || screenplay.trim().length < 50) {
      return NextResponse.json({ error: "Screenplay is too short to improve" }, { status: 400 })
    }

    // Fire-and-forget usage log
    void (supabase as any).from("usage_logs")
      .insert({ user_id: user.id, endpoint: "improve-dialogue", plan: effectivePlan })

    const systemPrompt = `You are an expert Tamil cinema dialogue writer. You improve screenplay dialogue to make it more:
- Emotionally authentic (உண்மையான உணர்ச்சி)
- Natural and conversational (இயற்கையான பேச்சுவழக்கு)
- Cinematic and impactful (திரைப்படத்திற்கு ஏற்ற)
- Character-specific (கதாபாத்திரத்திற்கு ஏற்ற)

RULES:
- Keep ALL scene headings, transitions, and action lines EXACTLY as they are
- Only improve DIALOGUE lines (lines after character names)
- Keep character names exactly the same
- Keep the same format (scene headings in ENGLISH, dialogue in TAMIL)
- Do NOT add new scenes or characters
- Return the COMPLETE improved screenplay, not just the dialogue`

    const input = buildTextCompletionInput(model, {
      systemPrompt: systemPrompt,
      userPrompt: `Improve the dialogue in this Tamil screenplay while keeping everything else identical:\n\n${screenplay}`,
      maxTokens: parseInt(process.env.MAX_TOKENS || "8000", 10),
      temperature: 0.7,
      topP: 0.9,
      llama: { minTokens: 200, topK: 40, presencePenalty: 0.3 },
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
      { error: error?.message || "Failed to improve dialogue" },
      { status: 500 }
    )
  }
}
