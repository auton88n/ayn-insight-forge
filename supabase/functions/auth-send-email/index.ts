import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// The secret comes as "v1,whsec_BASE64SECRET" - extract just the base64 part
const rawSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
// Extract just the base64 secret (after whsec_ prefix)
const hookSecret = rawSecret.includes("whsec_") 
  ? rawSecret.split("whsec_").pop() || ""
  : rawSecret;

// AYN branded email header - clean minimal design
const AYN_HEADER = `
<div style="background: #1a1a1a; padding: 50px 20px 30px; text-align: center;">
  <h1 style="font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 0;">AYN</h1>
  <div style="width: 60px; height: 3px; background: #ffffff; margin: 20px auto 0;"></div>
</div>
`;

// AYN branded email footer - minimal
const AYN_FOOTER = `
<div style="background: #1a1a1a; padding: 25px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
  <p style="color: #4b5563; font-size: 12px; margin: 0;">
    © ${new Date().getFullYear()} AYN. All rights reserved.
  </p>
</div>
`;

// Email template wrapper
const wrapEmail = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a;">
    ${AYN_HEADER}
    ${content}
    ${AYN_FOOTER}
  </div>
</body>
</html>
`;

// CTA button style - clean white button
const ctaButton = (url: string, text: string): string => `
<div style="text-align: center; margin: 35px 0;">
  <a href="${url}" style="display: inline-block; background: #f5f5f5; color: #1a1a1a; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
    ${text}
  </a>
</div>
`;

// Generate templates based on email type
function getTemplate(
  emailType: string,
  user: { email: string; user_metadata?: { full_name?: string } },
  confirmationUrl: string
): { subject: string; html: string } {
  const userName = user.user_metadata?.full_name || user.email.split('@')[0];

  switch (emailType) {
    case 'signup':
      return {
        subject: 'Confirm your AYN account',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #9ca3af;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
              Welcome to AYN
            </h1>
            
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 10px 0; font-size: 16px;">
              Hi ${userName},
            </p>
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              Thank you for signing up. Please confirm your email address to get started.
            </p>
            
            ${ctaButton(confirmationUrl, 'Verify Email')}
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin-top: 40px;">
              This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        `)
      };

    case 'recovery':
      return {
        subject: 'Reset your password | AYN',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #9ca3af;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
              Reset your password
            </h1>
            
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 10px 0; font-size: 16px;">
              Hi ${userName},
            </p>
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            ${ctaButton(confirmationUrl, 'Reset Password')}
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin-top: 40px;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `)
      };

    case 'magiclink':
      return {
        subject: 'Your login link | AYN',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #9ca3af;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
              Your Login Link
            </h1>
            
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 10px 0; font-size: 16px;">
              Hi ${userName},
            </p>
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              Click the button below to securely log in to your AYN account.
            </p>
            
            ${ctaButton(confirmationUrl, 'Log In')}
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin-top: 40px;">
              This link expires in 1 hour and can only be used once.
            </p>
          </div>
        `)
      };

    case 'email_change':
      return {
        subject: 'Confirm your new email | AYN',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #9ca3af;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
              Confirm Your New Email
            </h1>
            
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 10px 0; font-size: 16px;">
              Hi ${userName},
            </p>
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              You requested to change your email address. Please confirm this change by clicking the button below.
            </p>
            
            ${ctaButton(confirmationUrl, 'Confirm Email Change')}
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin-top: 40px;">
              If you didn't request this change, please contact support immediately.
            </p>
          </div>
        `)
      };

    default:
      return {
        subject: 'AYN Authentication',
        html: wrapEmail(`
          <div style="padding: 40px 30px; color: #9ca3af;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 24px 0; font-weight: 600;">
              Complete Your Action
            </h1>
            
            <p style="color: #9ca3af; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              Click the button below to continue.
            </p>
            
            ${ctaButton(confirmationUrl, 'Continue')}
          </div>
        `)
      };
  }
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the raw payload for signature verification
    const payload = await req.text();
    
    console.log('[auth-send-email] Received request, hookSecret configured:', !!hookSecret);
    
    // Verify webhook signature
    if (!hookSecret) {
      console.error('[auth-send-email] SEND_EMAIL_HOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    let webhookData: {
      user: { id: string; email: string; user_metadata?: { full_name?: string } };
      email_data: {
        email_action_type: string;
        token_hash: string;
        token: string;
        redirect_to: string;
        site_url: string;
      };
    };

    try {
      webhookData = wh.verify(payload, headers) as typeof webhookData;
    } catch (verifyError) {
      console.error('[auth-send-email] Webhook verification failed:', verifyError);
      console.error('[auth-send-email] Secret length:', hookSecret.length);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user, email_data } = webhookData;
    
    console.log(`[auth-send-email] Processing ${email_data.email_action_type} for ${user.email}`);

    // Build the confirmation URL
    const confirmationUrl = `https://dfkoxuokfkttjhfjcecx.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || email_data.site_url)}`;

    // Get the appropriate template
    const { subject, html } = getTemplate(email_data.email_action_type, user, confirmationUrl);

    // Send via Resend
    const emailResult = await resend.emails.send({
      from: 'AYN <noreply@mail.aynn.io>',
      to: [user.email],
      subject,
      html
    });

    console.log(`[auth-send-email] Email sent successfully:`, emailResult);

    // Return success - Supabase expects empty object on success
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[auth-send-email] Error:', error);
    
    // Return error so Supabase can retry
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
