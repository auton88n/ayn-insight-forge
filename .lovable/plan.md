

## Problem

The screenshot shows a **404 page on aynn.io** when clicking the password reset link from the email. This is caused by two issues:

1. **Hostinger SPA routing**: Hostinger doesn't know about client-side routes like `/reset-password`. The `_redirects` file works for Netlify/Cloudflare Pages but **not for Hostinger**. Hostinger uses Apache, so you need an `.htaccess` file in the `public` folder to rewrite all routes to `index.html`.

2. **PKCE flow mismatch**: The Supabase client uses `flowType: 'pkce'` (line 16 of `client.ts`), which means the redirect URL contains a `?code=XXX` query parameter. But `ResetPassword.tsx` only looks for hash-based tokens (`#access_token=...&type=recovery`), which is the **implicit flow** pattern. The code parameter is never exchanged for a session, so even if the page loaded, it would show "Reset Link Expired."

## Plan

### 1. Add `.htaccess` for Hostinger (Apache) SPA routing

Create `public/.htaccess` with Apache rewrite rules that serve `index.html` for all non-file routes. This is what Hostinger needs instead of `_redirects` (which is Netlify-specific).

```
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### 2. Fix `ResetPassword.tsx` for PKCE flow

Rewrite the session validation logic to:
- Check for `?code=` query parameter (PKCE flow)
- Call `supabase.auth.exchangeCodeForSession(code)` to exchange the code for a session
- Set up `onAuthStateChange` listener **before** the exchange call
- Listen for `PASSWORD_RECOVERY` event to confirm recovery session
- Clean the `code` param from the URL after exchange
- Keep the existing hash-based fallback for backward compatibility

### 3. Fix `Index.tsx` recovery flow detection

Update the recovery flow detection to also check for the `code` query parameter on the `/reset-password` path, so the Index page doesn't intercept the session and redirect to the dashboard before the password is reset.

### 4. Redeploy email Edge Function

Reduce `letter-spacing` from `3px` to `1px` in the AYN header and redeploy.

