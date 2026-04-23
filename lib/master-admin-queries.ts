import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { MASTER_ADMIN_PAGE_SIZE } from "@/lib/master-admin-range"
import { getRazorpayOrderAmountPaise, isPaidPlan } from "@/lib/razorpay-pricing"
import type { BillingCycle } from "@/types/project"

export type AdminProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type AdminSubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"]

export type ProfileWithSubscription = AdminProfileRow & {
  subscription: Pick<
    AdminSubscriptionRow,
    "plan" | "status" | "billing_cycle" | "updated_at"
  > | null
}

/** Operator auth user ids (platform admins); excluded from customer-facing lists/metrics. */
export async function fetchMasterAdminUserIds(admin: SupabaseClient<Database>): Promise<string[]> {
  const { data, error } = await admin.from("master_admin_users").select("user_id")
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.user_id)
}

/** PostgREST `not.in` parenthesized list for UUIDs */
export function notInTuple(ids: string[]): string | null {
  if (ids.length === 0) return null
  return `(${ids.join(",")})`
}

export async function fetchProfilesInRange(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string,
  page: number,
  searchEmail?: string
): Promise<{ rows: ProfileWithSubscription[]; total: number }> {
  const start = (page - 1) * MASTER_ADMIN_PAGE_SIZE
  const end = start + MASTER_ADMIN_PAGE_SIZE - 1

  const excludeIds = await fetchMasterAdminUserIds(admin)
  const excludeTuple = notInTuple(excludeIds)

  let q = admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, bio, created_at, updated_at", { count: "exact" })
    .gte("created_at", fromIso)
    .lte("created_at", toIso)

  if (excludeTuple) {
    q = q.not("id", "in", excludeTuple)
  }

  if (searchEmail && searchEmail.trim()) {
    const v = searchEmail.trim().slice(0, 120)
    q = q.ilike("email", `%${v}%`)
  }

  const { data: profiles, error, count } = await q.order("created_at", { ascending: false }).range(start, end)

  if (error) throw new Error(error.message)

  const ids = (profiles ?? []).map((p) => p.id)
  if (ids.length === 0) {
    return { rows: [], total: count ?? 0 }
  }

  const { data: subs, error: subErr } = await admin
    .from("subscriptions")
    .select("user_id, plan, status, billing_cycle, updated_at")
    .in("user_id", ids)

  if (subErr) throw new Error(subErr.message)

  const latestByUser = new Map<
    string,
    Pick<AdminSubscriptionRow, "plan" | "status" | "billing_cycle" | "updated_at">
  >()
  for (const s of subs ?? []) {
    const prev = latestByUser.get(s.user_id)
    if (!prev || new Date(s.updated_at).getTime() > new Date(prev.updated_at).getTime()) {
      latestByUser.set(s.user_id, {
        plan: s.plan,
        status: s.status,
        billing_cycle: s.billing_cycle,
        updated_at: s.updated_at,
      })
    }
  }

  const rows: ProfileWithSubscription[] = (profiles ?? []).map((p) => ({
    ...p,
    subscription: latestByUser.get(p.id) ?? null,
  }))

  return { rows, total: count ?? 0 }
}

export async function fetchSubscriptionsInRange(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string,
  page: number,
  filters?: { status?: string; plan?: string; billing_cycle?: string; user_id?: string }
): Promise<{ rows: AdminSubscriptionRow[]; total: number }> {
  const start = (page - 1) * MASTER_ADMIN_PAGE_SIZE
  const end = start + MASTER_ADMIN_PAGE_SIZE - 1

  let q = admin
    .from("subscriptions")
    .select("*", { count: "exact" })
    .gte("updated_at", fromIso)
    .lte("updated_at", toIso)

  if (filters?.status && ["active", "cancelled", "expired"].includes(filters.status)) {
    q = q.eq("status", filters.status as "active" | "cancelled" | "expired")
  }
  if (filters?.plan && ["free", "pro", "premium"].includes(filters.plan)) {
    q = q.eq("plan", filters.plan as "free" | "pro" | "premium")
  }
  if (filters?.billing_cycle && ["monthly", "annual"].includes(filters.billing_cycle)) {
    q = q.eq("billing_cycle", filters.billing_cycle as "monthly" | "annual")
  }
  if (filters?.user_id) {
    q = q.eq("user_id", filters.user_id)
  }

  const { data, error, count } = await q
    .order("updated_at", { ascending: false })
    .range(start, end)

  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as AdminSubscriptionRow[], total: count ?? 0 }
}

export type UsageDayBucket = { day: string; count: number }

const USAGE_SAMPLE_CAP = 10_000
const SIGNUP_SAMPLE_CAP = 10_000
const MRR_SAMPLE_CAP = 10_000
const TOP_USERS_SAMPLE_CAP = 20_000

function isoDay(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

export type DayBucket = { day: string; count: number }

export async function fetchUsageDailyBuckets(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string
): Promise<{ buckets: UsageDayBucket[]; totalInRange: number; truncated: boolean }> {
  const { count: totalInRange, error: countErr } = await admin
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso)

  if (countErr) throw new Error(countErr.message)

  const { data: rows, error } = await admin
    .from("usage_logs")
    .select("created_at")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true })
    .limit(USAGE_SAMPLE_CAP)

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  for (const r of rows ?? []) {
    const d = new Date(r.created_at)
    const day = d.toISOString().slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + 1)
  }

  const buckets = Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return {
    buckets,
    totalInRange: totalInRange ?? 0,
    truncated: (rows?.length ?? 0) >= USAGE_SAMPLE_CAP,
  }
}

export async function fetchUsageEndpointBreakdown(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string,
  cap = 5000
): Promise<{ byEndpoint: Record<string, number>; truncated: boolean }> {
  const limit = Math.max(200, Math.min(10_000, cap))
  const { data: rows, error } = await admin
    .from("usage_logs")
    .select("endpoint")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  const byEndpoint = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.endpoint] = (acc[r.endpoint] ?? 0) + 1
    return acc
  }, {})
  return { byEndpoint, truncated: (rows?.length ?? 0) >= limit }
}

export async function fetchSignupDailyBuckets(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string
): Promise<{ buckets: DayBucket[]; totalInRange: number; truncated: boolean }> {
  const excludeIds = await fetchMasterAdminUserIds(admin)
  const excludeTuple = notInTuple(excludeIds)

  let countQ = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
  if (excludeTuple) countQ = countQ.not("id", "in", excludeTuple)
  const { count: totalInRange, error: countErr } = await countQ
  if (countErr) throw new Error(countErr.message)

  let sampleQ = admin
    .from("profiles")
    .select("id, created_at")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true })
    .limit(SIGNUP_SAMPLE_CAP)
  if (excludeTuple) sampleQ = sampleQ.not("id", "in", excludeTuple)
  const { data: rows, error } = await sampleQ

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  for (const r of rows ?? []) {
    const day = isoDay(r.created_at)
    map.set(day, (map.get(day) ?? 0) + 1)
  }
  const buckets = Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return { buckets, totalInRange: totalInRange ?? 0, truncated: (rows?.length ?? 0) >= SIGNUP_SAMPLE_CAP }
}

export type UpcomingRenewalRow = Pick<
  AdminSubscriptionRow,
  "user_id" | "plan" | "status" | "billing_cycle" | "current_period_end" | "updated_at"
>

export async function fetchUpcomingRenewals(
  admin: SupabaseClient<Database>,
  nowIso: string,
  days: number
): Promise<{ rows: UpcomingRenewalRow[]; truncated: boolean }> {
  const toIso = addDays(new Date(nowIso), Math.max(1, Math.min(60, days))).toISOString()

  const { data, error } = await admin
    .from("subscriptions")
    .select("user_id, plan, status, billing_cycle, current_period_end, updated_at")
    .gte("current_period_end", nowIso)
    .lte("current_period_end", toIso)
    .order("current_period_end", { ascending: true })
    .limit(50)

  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as UpcomingRenewalRow[], truncated: (data?.length ?? 0) >= 50 }
}

export type TopUserUsageRow = {
  user_id: string
  count: number
  email?: string
  full_name?: string | null
}

export async function fetchTopUsersByUsage(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string,
  limit: number
): Promise<{ rows: TopUserUsageRow[]; truncated: boolean }> {
  const cap = Math.max(1000, Math.min(TOP_USERS_SAMPLE_CAP, 50_000))
  const adminIds = await fetchMasterAdminUserIds(admin)
  const adminSet = new Set(adminIds)

  const { data: rows, error } = await admin
    .from("usage_logs")
    .select("user_id")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false })
    .limit(cap)

  if (error) throw new Error(error.message)

  const counts = new Map<string, number>()
  for (const r of rows ?? []) {
    if (!r.user_id || adminSet.has(r.user_id)) continue
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1)
  }

  const topN = Math.max(3, Math.min(50, limit))
  const ranked = Array.from(counts.entries())
    .map(([user_id, count]) => ({ user_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)

  const ids = ranked.map((r) => r.user_id)
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", ids)

  if (profErr) throw new Error(profErr.message)
  const byId = new Map<string, { email: string; full_name: string | null }>()
  for (const p of profiles ?? []) {
    byId.set(p.id, { email: p.email, full_name: p.full_name })
  }

  return {
    rows: ranked.map((r) => ({ ...r, ...byId.get(r.user_id) })),
    truncated: (rows?.length ?? 0) >= cap,
  }
}

export type MrrDayBucket = { day: string; mrrInr: number; activePaid: number }

function perSubMrrInr(plan: string, billing_cycle: string | null) {
  if (!isPaidPlan(plan)) return 0
  const cycle: BillingCycle = billing_cycle === "annual" ? "annual" : "monthly"
  const paise = getRazorpayOrderAmountPaise(plan, cycle)
  return cycle === "annual" ? Math.round(paise / 12 / 100) : Math.round(paise / 100)
}

export async function fetchMrrDailyBuckets(
  admin: SupabaseClient<Database>,
  fromIso: string,
  toIso: string
): Promise<{ buckets: MrrDayBucket[]; truncated: boolean }> {
  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("updated_at, plan, status, billing_cycle")
    .gte("updated_at", fromIso)
    .lte("updated_at", toIso)
    .order("updated_at", { ascending: true })
    .limit(MRR_SAMPLE_CAP)

  if (error) throw new Error(error.message)

  const map = new Map<string, { mrrInr: number; activePaid: number }>()
  for (const s of subs ?? []) {
    const day = isoDay(s.updated_at)
    const prev = map.get(day) ?? { mrrInr: 0, activePaid: 0 }
    if (s.status === "active" && isPaidPlan(s.plan)) {
      prev.activePaid += 1
      prev.mrrInr += perSubMrrInr(s.plan, s.billing_cycle)
    }
    map.set(day, prev)
  }

  const buckets = Array.from(map.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return { buckets, truncated: (subs?.length ?? 0) >= MRR_SAMPLE_CAP }
}
