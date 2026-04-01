// Tamil Cinematic Shot Suggestions API using Replicate (default: google/gemini-2.5-flash)

import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { createClient } from "@/lib/supabase/server"
import { runAiRateLimits } from "@/lib/ai-rate-limits"
import { getEffectivePlan } from "@/lib/subscription"
import { buildTextCompletionInput, getReplicateModel } from "@/lib/replicate-model"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

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

    const { sceneText } = await req.json()

    if (!sceneText || sceneText.trim().length < 50) {
      return NextResponse.json(
        { error: "Scene text is too short. Please provide a complete scene." },
        { status: 400 }
      )
    }

    // Fire-and-forget usage log
    void (supabase as any).from("usage_logs")
      .insert({ user_id: user.id, endpoint: "shots", plan: effectivePlan })

    const systemPrompt = `நீ ஒரு தொழில்முறை திரைப்பட இயக்குநர் மற்றும் ஒளிப்பதிவாளர்.

கொடுக்கப்பட்ட காட்சியின் அடிப்படையில் திரைப்பட ஷாட் பரிந்துரைகளை உருவாக்கவும்.

4-6 ஷாட்களுக்கு பின்வரும் விவரங்களை வழங்கவும்:

1. ஷாட் எண்
2. ஷாட் வகை (Wide, Medium, Close-Up, Extreme Close-Up போன்றவை)
3. கேமரா கோணம் (Low angle, High angle, Eye level, Dutch angle போன்றவை)
4. கம்போசிஷன் (Rule of thirds, Center frame, Leading lines போன்றவை)
5. கேமரா இயக்கம் (Static, Pan, Tilt, Dolly, Track, Handheld போன்றவை)
6. ஷாட்டின் நோக்கம் (Emotional beat, Reveal, Transition போன்றவை)

JSON வடிவத்தில் மட்டும் பதிலளிக்கவும்:
[
  {
    "shotNumber": 1,
    "shotType": "Wide",
    "cameraAngle": "Eye level",
    "composition": "Rule of thirds",
    "cameraMovement": "Static",
    "purpose": "Establish location",
    "description": "Brief description"
  }
]

காட்சியின் உணர்வுகள், செயல்கள், இடம், கதாபாத்திர இடைவினைகளின் அடிப்படையில் பரிந்துரைகள் செய்யவும்.`

    const input = buildTextCompletionInput(model, {
      systemPrompt: systemPrompt,
      userPrompt: `இந்த காட்சிக்கு ஷாட் பரிந்துரைகளை உருவாக்கவும்:\n\n${sceneText}`,
      maxTokens: 2048,
      temperature: 0.6,
      topP: 0.9,
      llama: { minTokens: 0, presencePenalty: 1.15 },
    })

    const output = await replicate.run(model as `${string}/${string}`, { input })

    let text = ""
    if (Array.isArray(output)) {
      text = output.join("")
    } else if (typeof output === "string") {
      text = output
    }

    let shots
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        shots = JSON.parse(jsonMatch[0])
      } else {
        shots = JSON.parse(text)
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse shot suggestions. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ shots })
  } catch (error: any) {
    if (error?.status === 401 || error?.message?.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate shot suggestions" },
      { status: 500 }
    )
  }
}
