// Tamil story generation via Replicate (default: google/gemini-2.5-flash)

import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { buildTextCompletionInput, getReplicateModel, getStreamOutputText } from "@/lib/replicate-model"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const model = getReplicateModel()

export async function POST(req: NextRequest) {
  try {
    // Validate API token
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN not configured. Please add your token to .env.local" },
        { status: 500 }
      )
    }

    // Check for placeholder
    const placeholders = [
      "r8_your_replicate_api_token_here",
      "r8_paste_your_real_token_here",
      "r8_..."
    ]
    if (!token || placeholders.some(p => token.includes(p)) || token.length < 20) {
      return NextResponse.json(
        { 
          error: "Invalid API token: You're using a placeholder",
          details: `Current token: ${token?.substring(0, 15) || 'none'}...`,
          solution: "Get your real token from https://replicate.com/account/api-tokens",
          steps: [
            "1. Go to https://replicate.com/",
            "2. Sign up / Log in",
            "3. Go to Account Settings → API Tokens",
            "4. Create a new token",
            "5. Copy the token (starts with r8_)",
            "6. Paste it in .env.local file"
          ]
        },
        { status: 500 }
      )
    }

    const { genre, characters, location, mood, sceneDescription } = await req.json()

    // Validate required fields
    if (!genre || !characters || !location || !sceneDescription) {
      return NextResponse.json(
        { error: "Missing required fields: genre, characters, location, sceneDescription" },
        { status: 400 }
      )
    }

    // Construct the prompt for Tamil story generation
    const systemPrompt = `நீ ஒரு தமிழ் கதை எழுத்தாளர். நீங்கள் தமிழில் சிறந்த கதைகள் எழுதுவதில் வல்லுநர்.

உங்கள் பணி: கொடுக்கப்பட்ட விவரங்களின் அடிப்படையில் ஒரு அழகான தமிழ் கதை எழுதுவது.

வழிகாட்டுதல்கள்:
1. கதை தமிழில் மட்டுமே எழுத வேண்டும்
2. வாசகர்களை கவரும் வகையில் கதையமைப்பு இருக்க வேண்டும்
3. கதாபாத்திரங்களின் உணர்வுகளை ஆழமாக விவரிக்கவும்
4. இடங்களை விவரித்து காட்சிகளை கண்முன் நிறுத்தவும்
5. உரையாடல்கள் இயல்பாகவும் உயிரோட்டமாகவும் இருக்க வேண்டும்
6. ஒரு நல்ல முடிவு கொடுக்கவும்

கதை அமைப்பு:
- தலைப்பு
- அறிமுகம் (இடம், காலம்)
- கதாநாயகர்கள்
- சம்பவங்கள்
- முடிவு`

    const userPrompt = `பின்வரும் விவரங்களின் அடிப்படையில் ஒரு தமிழ் கதை எழுதுங்கள்:

துறை (Genre): ${genre}
கதாபாத்திரங்கள்: ${characters}
இடம்: ${location}
மனநிலை (Mood): ${mood || "விறுவிறுப்பான"}
காட்சி விவரம்: ${sceneDescription}

தமிழில் ஒரு முழுமையான கதை எழுதுங்கள். கதையில் உரையாடல்கள், விவரிப்புகள் மற்றும் உணர்ச்சிகள் இருக்க வேண்டும்.`

    const input = buildTextCompletionInput(model, {
      systemPrompt: systemPrompt,
      userPrompt,
      maxTokens: parseInt(process.env.MAX_TOKENS || "4096", 10),
      temperature: 0.7,
      topP: 0.9,
      llama: { minTokens: 0, presencePenalty: 1.15 },
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

        // Send end signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("Error generating Tamil story:", error)
    
    // Handle specific error types
    if (error?.response?.status === 401 || error?.message?.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Invalid Replicate API token. Please check your REPLICATE_API_TOKEN in .env.local" },
        { status: 500 }
      )
    }

    if (error?.response?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate Tamil story. Please try again." },
      { status: 500 }
    )
  }
}
