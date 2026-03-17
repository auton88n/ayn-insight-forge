

## Problem

Two features needed:

1. **Forgot password for unregistered emails**: Supabase's `resetPasswordForEmail` does NOT return an error for non-existent emails (security by design — prevents email enumeration). The current code shows "Reset Link Sent!" even for unregistered emails. We need a server-side check.

2. **Google Sign In/Sign Up**: No Google OAuth is currently implemented. Need to add Google sign-in buttons to the AuthModal.

## Plan

### 1. Create an Edge Function to verify email existence

Since Supabase intentionally hides whether an email exists from the client, we need a secure edge function that checks the `auth.users` table using the service role key before sending the reset email.

**New file: `supabase/functions/check-email-exists/index.ts`**
- Accepts `{ email }` in the request body
- Uses the service role key to query `auth.admin.listUsers()` filtered by email
- Returns `{ exists: true/false }`
- Rate-limited to prevent email enumeration abuse (check `security_logs` for repeated attempts)

### 2. Update `AuthModal.tsx` — Forgot Password flow

In `handleForgotPassword`:
- Before calling `resetPasswordForEmail`, call the `check-email-exists` edge function
- If email doesn't exist, show a toast: "This email is not registered. Please sign up first."
- If it exists, proceed with the reset flow as normal

### 3. Update `AuthModal.tsx` — Add Google Sign In/Sign Up

Add a "Continue with Google" button to both the Sign In and Sign Up tabs:
- Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- Add a visual divider ("or") between the Google button and the email/password form
- Style the button with Google branding (Google icon + white background)

### 4. Add translation keys

Add new keys to `en.ts`, `ar.ts`, and `fr.ts`:
- `auth.emailNotRegistered` / `auth.emailNotRegisteredDesc`
- `auth.continueWithGoogle`
- `auth.orDivider` ("or")

### 5. Handle Google OAuth profile creation

The existing `handle_new_user` database trigger already creates profiles from `auth.users` metadata. For Google OAuth users, Supabase populates `raw_user_meta_data` with `full_name` and `avatar_url`. The trigger maps `full_name` to `contact_person` — this should work. However, `company_name` won't be provided by Google, so it will be NULL. This is acceptable since users can fill it in later from settings.

### Prerequisites (user action required)

Before Google Sign In works, you must configure Google OAuth in your Supabase dashboard:
1. Go to **Authentication > Providers > Google** in Supabase dashboard
2. Create OAuth credentials in Google Cloud Console
3. Add the Supabase callback URL as an authorized redirect URI
4. Add your site URL (`https://aynn.io`) as an authorized JavaScript origin
5. Enter the Client ID and Client Secret in Supabase

