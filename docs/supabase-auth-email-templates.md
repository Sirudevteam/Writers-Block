# Supabase auth email templates (Writers Block)

Sign-up and password emails are **sent by Supabase Auth**, not by the Next.js app. The app only sets `emailRedirectTo` in [`lib/auth/actions.ts`](../lib/auth/actions.ts) so the confirmation link returns users to [`/auth/callback`](../app/auth/callback/route.ts).

This guide explains how to apply the **Writers Block** dark / cinematic-styled HTML from [`emails/`](../emails/) in the Supabase Dashboard.

**Official reference:** [Supabase — Email templates](https://supabase.com/docs/guides/auth/auth-email-templates) (Go template variables such as `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`).

## 1. Open email templates

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **Email** (or **Email Templates** depending on UI version).
3. For each flow below, open the matching template, set the **Subject**, and paste the **entire** HTML from the file (from `<!DOCTYPE html>` through `</html>`).

| Template in Supabase | Suggested subject | File in this repo |
|---------------------|-------------------|-------------------|
| Confirm signup | `Confirm your email — Writers Block` | [`emails/supabase-confirm-signup.html`](../emails/supabase-confirm-signup.html) |
| Magic link | `Your sign-in link — Writers Block` | [`emails/supabase-magic-link.html`](../emails/supabase-magic-link.html) |
| Reset password | `Reset your password — Writers Block` | [`emails/supabase-reset-password.html`](../emails/supabase-reset-password.html) |
| Change email address | `Confirm your new email — Writers Block` | [`emails/supabase-change-email.html`](../emails/supabase-change-email.html) |

If a variable (e.g. for email change) does not work in a template, check the [current Supabase list](https://supabase.com/docs/guides/auth/auth-email-templates) and adjust the HTML accordingly. The dashboard’s template preview will show errors.

## 2. URL configuration (required for links to work)

After a user clicks **Verify email** (or **Magic link** / **Reset password**), Supabase redirects to a URL you allow.

1. **Authentication** → **URL Configuration** (or **Settings** under Auth).
2. **Site URL:** production app origin, e.g. `https://yourdomain.com`.
3. **Redirect URLs:** add:
   - Production: `https://yourdomain.com/**` or the exact callback path `https://yourdomain.com/auth/callback`
   - Local dev: `http://localhost:3000/**` and/or `http://localhost:3000/auth/callback`

The app’s sign-up action uses a redirect to `/auth/callback?next=…`; that final URL must be allowed or Supabase will block the redirect.

## 3. Test

Use **Send test email** (if your Supabase project offers it) or register a new user with a real inbox. Confirm that:

- The message matches the dark Writers Block style.
- The primary button opens a valid Supabase verify URL, then lands on your app (via `/auth/callback` for email confirmation).

## 4. Resend / SMTP (optional)

If you use **Custom SMTP** (e.g. Resend) in Supabase, the same HTML is used; only the **sender** changes. The Next.js app’s own transactional email (billing, PDF, etc.) is sent via Resend in [`lib/email.ts`](../lib/email.ts) and uses the same visual system as [`lib/email-theme.ts`](../lib/email-theme.ts) for a consistent look with these Supabase auth emails.

## See also

- [Admin operators (`master_admin_users`)](admin-operators.md) — separate from auth templates; defines who may use `/dashboard/admin` and Master Admin.
