import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { createClient } from "@/lib/supabase/server"
import { runAiRateLimits } from "@/lib/ai-rate-limits"
import { getEffectivePlanForApiUser } from "@/lib/ai-effective-plan"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"
import { buildTextCompletionInput, getReplicateModelForPlan, getStreamOutputText } from "@/lib/replicate-model"
import type { SubscriptionPlan } from "@/types/project"

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const PRESETS: Record<string, { label: string; systemExtra: string }> = {
  mass_action: {
    label: "High-energy mass (Tamil commercial)",
    systemExtra:
      "Rewrite toward Tamil mass-commercial blocking: big hero beats, crowd energy, build-up and payoffs, punchy one-liners where natural. Keep story logic.",
  },
  snappy_dialogue: {
    label: "Snappy, dialogue-driven",
    systemExtra:
      "Prioritize lean, cutting dialogue: subtext, rhythm, and conflict in lines. Tighten or expand lines for impact; keep characters true.",
  },
  emotional_lyrical: {
    label: "Emotional, lyrical",
    systemExtra:
      "Heighten inner life and family/emotion beats. More sensory detail in action lines, poetic but not purple; dialogue stays speakable for actors.",
  },
  realistic_grounded: {
    label: "Grounded / realistic",
    systemExtra:
      "Ground the scene in everyday speech and real stakes; reduce melodrama where it helps; keep Tamil natural for the setting.",
  },
}

const ALLOWED: SubscriptionPlan[] = ["pro", "premium"]

function buildSystemPrompt(styleId: string): string {
  const base = `You are an expert Tamil cinema co-writer. You REWRITE the screenplay the user provides.

STRICT FORMAT RULES:
- Scene headings in ENGLISH, body and dialogue in TAMIL (as in the original)
- Preserve character names, locations, and plot outcomes unless a small fix improves clarity
- Do not add meta-commentary or notes; output the screenplay only
- Return the full rewritten screenplay, not a summary

Style direction:
`
  const extra = PRESETS[styleId]?.systemExtra ?? PRESETS.mass_action.systemExtra
  return base + extra
}

export async function POST(req: NextRequest) {
  try {
    const tooMany = await apiIpLimitOr429(req)
    if (tooMany) return tooMany

    const token = process.env.REPLICATE_API_TOKEN
    if (!token || token.length < 20) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const effectivePlan = await getEffectivePlanForApiUser(supabase, user.id)
    if (!ALLOWED.includes(effectivePlan)) {
      return NextResponse.json(
        { error: "Style rewrite is available on Pro and Premium. Upgrade to unlock." },
        { status: 403 }
      )
    }

    const rate = await runAiRateLimits(req, effectivePlan, user.id)
    if (!rate.ok) return rate.response
    const { planQuota } = rate
    const model = getReplicateModelForPlan(effectivePlan)

    const { screenplay, styleId } = await req.json()
    const resolvedStyle = typeof styleId === "string" && styleId in PRESETS ? styleId : "mass_action"

    if (!screenplay || String(screenplay).trim().length < 80) {
      return NextResponse.json({ error: "Screenplay is too short to rewrite" }, { status: 400 })
    }

    void (supabase as any).from("usage_logs").insert({
      user_id: user.id,
      endpoint: "rewrite-style",
      plan: effectivePlan,
    })

    const systemPrompt = buildSystemPrompt(resolvedStyle)
    const userPrompt = `Rewrite this entire screenplay in the chosen style.\n\n${screenplay}`

    const input = buildTextCompletionInput(model, {
      systemPrompt,
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
        "X-RateLimit-Limit": String(planQuota.limit),
        "X-RateLimit-Remaining": String(planQuota.remaining),
        "X-RateLimit-Reset": String(Math.ceil(planQuota.reset / 1000)),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to rewrite"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
