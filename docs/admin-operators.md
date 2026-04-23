# Admin operators (`master_admin_users`)

Platform admin access is **not** controlled by an email allowlist in environment variables. Operators are rows in **`public.master_admin_users`**, keyed by **`auth.users.id`**.

| Surface | Path | Extra gate |
|--------|------|------------|
| In-app admin | `/dashboard/admin`, `GET /api/admin/stats` | Signed-in user’s id must exist in `master_admin_users` |
| Master Admin UI + APIs | `/master-admin/*`, `/api/master-admin/*` | Same **plus** request `Host` must appear in **`ADMIN_HOSTS`** |

Implementation references: [`lib/admin-privileges.ts`](../lib/admin-privileges.ts), [`middleware.ts`](../middleware.ts), [`lib/admin-host.ts`](../lib/admin-host.ts).

## Schema

Defined in [`supabase/database.sql`](../supabase/database.sql):

- **`user_id`** — `UUID`, primary key, `REFERENCES auth.users(id) ON DELETE CASCADE`
- **`created_at`** — `TIMESTAMPTZ`
- **`note`** — optional `TEXT` (e.g. role label)

**RLS** is enabled with **no policies** for the `authenticated` role, so only the **Supabase service role** can read or write this table from server code. That matches how the app checks privileges (service role + `userHasAdminPrivileges`).

## Requirements

1. **`SUPABASE_SERVICE_ROLE_KEY`** must be set wherever the app runs (local `.env.local`, Vercel, etc.). Middleware and API routes use it to verify operator membership.
2. Schema must include `master_admin_users` (apply or re-run the relevant section from `supabase/database.sql`).
3. At least one **`INSERT`** for each operator account (see below).

## Grant access

1. In Supabase: **Authentication → Users** — copy the user’s UUID.
2. In **SQL Editor**:

```sql
INSERT INTO public.master_admin_users (user_id, note)
VALUES ('00000000-0000-0000-0000-000000000000', 'founder')
ON CONFLICT (user_id) DO NOTHING;
```

Replace the UUID with the real id. Use `ON CONFLICT` if you re-run scripts idempotently.

## Revoke access

```sql
DELETE FROM public.master_admin_users WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

## Relation to `profiles`

Operators are normal Supabase users: they usually still have a **`profiles`** row and **`subscriptions`** row (created by `handle_new_user`). **Product analytics** in Master Admin (user list, signup trend, top users by usage, legacy admin “total users”) **exclude** ids present in `master_admin_users` so operator activity is not mixed with customer metrics.

## Master Admin host allowlist (`ADMIN_HOSTS`)

Comma-separated **`Host`** header values (include port in local dev, e.g. `localhost:3000`, `127.0.0.1:3000`). If **`ADMIN_HOSTS`** is empty, **`/master-admin`** and **`/api/master-admin`** return **404** on every host (fail closed).

`/dashboard/admin` is **not** host-gated; any allowed operator can open it on the main app origin.

## Troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| 404 on `/master-admin` | Host not in `ADMIN_HOSTS`, or variable unset |
| Redirect to `/dashboard` or 403 on Master Admin APIs | User id not in `master_admin_users`, or missing/invalid service role key |
| Locked out after deploy | Table missing, or no rows; run schema + `INSERT` |
| Operators still “missing” from Users list | By design — excluded from customer-facing lists when they appear in `master_admin_users` |

## Deprecated configuration

**`ADMIN_EMAILS`** is no longer read by the application. Remove it from env files to avoid confusion.
