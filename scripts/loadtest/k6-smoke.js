/**
 * Smoke / baseline load test for ~1M requests/day capacity planning.
 * Install k6: https://k6.io/docs/get-started/installation/
 *
 * Usage:
 *   k6 run scripts/loadtest/k6-smoke.js
 *   k6 run --env BASE_URL=https://your-app.vercel.app scripts/loadtest/k6-smoke.js
 *   k6 run --env BASE_URL=http://localhost:3000 --env COOKIE="sb-xxx=..." scripts/loadtest/k6-smoke.js
 *
 * For authenticated /api/* stages, set COOKIE to a valid Supabase session cookie.
 */

import http from "k6/http"
import { check, sleep } from "k6"

const BASE = __ENV.BASE_URL || "http://localhost:3000"
const COOKIE = __ENV.COOKIE || ""

export const options = {
  vus: 10,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.1"],
  },
}

export default function () {
  // 1) Public home (RSC + static) — no auth
  const home = http.get(`${BASE}/`, { tags: { name: "GET /" } })
  check(home, { "home 200 or 3xx": (r) => r.status >= 200 && r.status < 400 })

  sleep(0.3)

  // 2) Optional: authenticated API (set COOKIE in env)
  if (COOKIE) {
    const res = http.get(`${BASE}/api/projects`, {
      headers: { Cookie: COOKIE },
      tags: { name: "GET /api/projects" },
    })
    check(res, { "api projects 200 or 401": (r) => r.status === 200 || r.status === 401 })
  }

  sleep(0.2)
}
