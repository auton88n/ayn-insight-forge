import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    if (!roleData) throw new Error('Admin access required');

    const { orderId, contractPdfUrl } = await req.json();
    if (!orderId) throw new Error('orderId required');

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new Error('Order not found');

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY not configured');

    const resend = new Resend(resendKey);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-SA', { style: 'currency', currency: order.currency || 'SAR' }).format(amount);
    };

    const emailHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #000; color: white; padding: 32px; text-align: center; }
    .header h1 { font-size: 36px; font-weight: 900; letter-spacing: -2px; margin: 0; }
    .header .sub { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; margin-top: 8px; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .text { font-size: 14px; color: #555; margin-bottom: 16px; }
    .order-box { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .order-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .order-detail { font-size: 13px; color: #666; margin-bottom: 4px; }
    .amount-box { background: #000; color: white; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .amount { font-size: 32px; font-weight: 900; }
    .amount-label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 8px; }
    .btn { display: inline-block; background: #000; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .pdf-link { display: inline-block; background: #f0f0f0; color: #333; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 12px; margin-top: 12px; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; }
    .services-list { list-style: none; padding: 0; margin: 0; }
    .services-list li { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; display: flex; justify-content: space-between; }
    .services-list li:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AYN</h1>
      <div class="sub">Service Agreement</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${escapeHtml(order.contact_person)},</div>
      <p class="text">
        Thank you for choosing AYN. We're excited to work with <strong>${escapeHtml(order.company_name)}</strong>. 
        Please find below the details of your service agreement and payment link.
      </p>
      
      <div class="order-box">
        <div class="order-title">${escapeHtml(order.order_title)}</div>
        ${order.order_description ? `<div class="order-detail">${escapeHtml(order.order_description)}</div>` : ''}
        <div style="margin-top: 12px;">
          <ul class="services-list">
            ${((order.services || []) as Array<{ name: string; price: number; quantity: number }>).map((s: any) => 
              `<li><span>${escapeHtml(s.name)}</span><span style="font-weight:600;">${formatCurrency(s.price * (s.quantity || 1))}</span></li>`
            ).join('')}
          </ul>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">Total Amount Due</div>
        <div class="amount">${formatCurrency(order.total_amount)}</div>
      </div>

      ${order.stripe_payment_link ? `
      <div class="btn-container">
        <a href="${order.stripe_payment_link}" class="btn" target="_blank">Complete Payment →</a>
      </div>` : ''}

      ${contractPdfUrl ? `
      <div class="btn-container">
        <a href="${contractPdfUrl}" class="pdf-link" target="_blank">📄 View & Download Contract PDF</a>
      </div>` : ''}

      <p class="text" style="font-size: 12px; color: #888;">
        If you have any questions regarding this agreement, please don't hesitate to contact us at contact@ayn.sa.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} AYN AI Technologies. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'AYN <noreply@ayn.sa>';

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [order.company_email],
      subject: `AYN Service Agreement: ${order.order_title} — ${formatCurrency(order.total_amount)}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('[send-contract-email] Resend error:', emailError);
      throw new Error(`Email send failed: ${emailError.message}`);
    }

    // Update order status
    await supabase
      .from('custom_orders')
      .update({ 
        status: 'sent',
        email_sent_at: new Date().toISOString(),
        contract_pdf_url: contractPdfUrl || null,
      })
      .eq('id', orderId);

    console.log('[send-contract-email] Email sent:', emailData?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailData?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[send-contract-email]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
