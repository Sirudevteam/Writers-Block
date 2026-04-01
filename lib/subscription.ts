import type { Subscription as DbSubscription } from "@/types/database"
import type { Subscription as UISubscription } from "@/types/project"
import { PLAN_LIMITS, type SubscriptionPlan } from "@/types/project"

type SubscriptionEntitlementRow = Pick<DbSubscription, "plan" | "status">

/**
 * Aligns with AI routes: only `active` subscriptions get paid plan entitlements.
 * Expired / cancelled / missing → free tier.
 */
export function getEffectivePlan(
  subscription: SubscriptionEntitlementRow | null | undefined
): SubscriptionPlan {
  if (!subscription || subscription.status !== "active") {
    return "free"
  }
  return subscription.plan
}

export function getEffectiveProjectsLimit(
  subscription: Pick<DbSubscription, "plan" | "status" | "projects_limit"> | null | undefined
): number {
  if (!subscription || subscription.status !== "active") {
    return PLAN_LIMITS.free
  }
  const n = subscription.projects_limit
  if (typeof n === "number" && n >= 0) {
    return n
  }
  return PLAN_LIMITS[subscription.plan] ?? PLAN_LIMITS.free
}

/** Subscription panel + dashboard: consistent plan name and limits vs AI usage. */
export function toUISubscription(
  dbSub: DbSubscription | null,
  projectsUsed: number
): UISubscription {
  const plan = getEffectivePlan(dbSub)
  const projectsLimit = getEffectiveProjectsLimit(dbSub)
  return {
    plan,
    projectsLimit,
    projectsUsed,
    // Only show billing period end when the paid row is still active; avoids
    // showing a Pro end date while the UI reflects free (expired/cancelled).
    expiresAt:
      dbSub?.status === "active" && dbSub?.current_period_end
        ? new Date(dbSub.current_period_end)
        : undefined,
  }
}
