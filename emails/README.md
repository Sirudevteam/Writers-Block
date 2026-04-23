# Email templates

- **Resend (app):** Branded layout is built in code via [`../lib/email-theme.ts`](../lib/email-theme.ts) and used from [`../lib/email.ts`](../lib/email.ts).
- **Supabase Auth:** These HTML files are **not** used by the app at runtime. Copy them into the [Supabase Dashboard](https://supabase.com/docs/guides/auth/auth-email-templates) (Authentication → Email templates). See [`../docs/supabase-auth-email-templates.md`](../docs/supabase-auth-email-templates.md).
- **Admin operators** (who can open `/dashboard/admin` and Master Admin) are configured in the database, not via email templates — see [`../docs/admin-operators.md`](../docs/admin-operators.md).

| File | Supabase template |
|------|-------------------|
| [supabase-confirm-signup.html](supabase-confirm-signup.html) | Confirm signup |
| [supabase-magic-link.html](supabase-magic-link.html) | Magic link |
| [supabase-reset-password.html](supabase-reset-password.html) | Reset password |
| [supabase-change-email.html](supabase-change-email.html) | Change email address |
