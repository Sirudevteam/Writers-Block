/**
 * Replicate text models use different input schemas (Gemini vs Llama instruct).
 * Default production model: google/gemini-2.5-flash
 */

import type { SubscriptionPlan } from "@/types/project"

export const DEFAULT_REPLICATE_MODEL = "google/gemini-2.5-flash"

export function isGeminiModel(model: string): boolean {
  return model.startsWith("google/gemini-")
}

export function getReplicateModel(): string {
  return process.env.REPLICATE_MODEL || DEFAULT_REPLICATE_MODEL
}

/** Per-plan Replicate model; each tier falls back to `REPLICATE_MODEL` then `DEFAULT_REPLICATE_MODEL`. */
export function getReplicateModelForPlan(plan: SubscriptionPlan): string {
  const base = getReplicateModel()
  if (plan === "free") {
    return process.env.REPLICATE_MODEL_FREE || base
  }
  if (plan === "pro") {
    return process.env.REPLICATE_MODEL_PRO || base
  }
  return process.env.REPLICATE_MODEL_PREMIUM || process.env.REPLICATE_MODEL_PRO || base
}

export function buildTextCompletionInput(
  model: string,
  opts: {
    systemPrompt: string
    userPrompt: string
    maxTokens: number
    temperature: number
    topP?: number
    /** Llama instruct only */
    llama?: {
      minTokens: number
      topK?: number
      presencePenalty?: number
    }
  }
): Record<string, unknown> {
  const topP = opts.topP ?? 0.9

  if (isGeminiModel(model)) {
    const maxOut = Math.min(Math.max(1, opts.maxTokens), 65535)
    return {
      prompt: opts.userPrompt,
      system_instruction: opts.systemPrompt,
      max_output_tokens: maxOut,
      temperature: opts.temperature,
      top_p: topP,
      thinking_budget: 0,
    }
  }

  const llama = opts.llama ?? { minTokens: 0 }
  return {
    top_k: llama.topK ?? 50,
    top_p: topP,
    prompt: opts.userPrompt,
    max_tokens: opts.maxTokens,
    min_tokens: llama.minTokens,
    temperature: opts.temperature,
    system_prompt: opts.systemPrompt,
    length_penalty: 1,
    stop_sequences: "<|end_of_text|>,<|eot_id|>",
    prompt_template:
      "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
    presence_penalty: llama.presencePenalty ?? 0.3,
    log_performance_metrics: false,
  }
}

/** Normalize Replicate stream chunks (ServerSentEvent or legacy string). */
export function getStreamOutputText(chunk: unknown): string | null {
  if (chunk == null) return null
  const ev = chunk as { event?: string; data?: unknown }
  if (ev.event === "output") {
    const d = ev.data
    if (typeof d === "string" && d.length > 0) return d
    return null
  }
  if (typeof chunk === "string" && chunk.length > 0) return chunk
  return null
}
