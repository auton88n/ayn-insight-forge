import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const { orderId } = await req.json();
    if (!orderId) throw new Error('orderId required');

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new Error('Order not found');

    const services = (order.services || []) as Array<{ name: string; description: string; price: number; quantity: number }>;

    // Generate HTML for PDF
    const html = generateContractHTML(order, services);

    // Store the HTML as a file for now (client will render to PDF)
    return new Response(JSON.stringify({ 
      success: true, 
      html,
      order 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-contract-pdf]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateContractHTML(order: any, services: any[]) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: order.currency || 'SAR' }).format(amount);
  };

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
    .page { width: 210mm; min-height: 297mm; padding: 30mm 25mm; background: white; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #000; }
    .brand h1 { font-size: 42px; font-weight: 900; letter-spacing: -2px; margin: 0; }
    .brand .sub { font-size: 11px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .contract-info { text-align: right; font-size: 11px; color: #555; }
    .contract-info .num { font-size: 14px; font-weight: 700; color: #000; margin-bottom: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
    .parties { display: flex; gap: 40px; }
    .party { flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px; }
    .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .party-detail { font-size: 11px; color: #555; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #000; color: white; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 12px; }
    tr:nth-child(even) td { background: #fafafa; }
    .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
    .totals-table .row.total { font-size: 18px; font-weight: 900; border-top: 2px solid #000; padding-top: 10px; margin-top: 6px; }
    .terms { font-size: 11px; color: #444; white-space: pre-wrap; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; padding-top: 30px; border-top: 2px solid #000; }
    .sig-block { flex: 1; }
    .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .sig-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 8px; position: relative; }
    .sig-line img { position: absolute; bottom: 5px; left: 10px; max-height: 50px; max-width: 200px; }
    .sig-name { font-size: 11px; color: #555; }
    .sig-date { font-size: 10px; color: #888; margin-top: 4px; }
    .payment-box { background: #000; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-top: 30px; }
    .payment-box h3 { font-size: 14px; margin-bottom: 8px; }
    .payment-box .amount { font-size: 28px; font-weight: 900; margin-bottom: 12px; }
    .payment-box a { display: inline-block; background: white; color: #000; padding: 10px 30px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 13px; }
    .footer { position: absolute; bottom: 15mm; left: 25mm; right: 25mm; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
    .after-sale { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; font-size: 11px; color: #166534; }
    .privacy { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; font-size: 11px; color: #1e40af; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <h1>AYN</h1>
        <div class="sub">Service Agreement & Contract</div>
      </div>
      <div class="contract-info">
        <div class="num">Contract #${order.id.substring(0, 8).toUpperCase()}</div>
        <div>Date: ${today}</div>
        <div>Status: ${order.status.toUpperCase()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Parties</div>
      <div class="parties">
        <div class="party">
          <div class="party-label">Service Provider</div>
          <div class="party-name">AYN AI Technologies</div>
          <div class="party-detail">AI-Powered Business Solutions</div>
          <div class="party-detail">contact@ayn.sa</div>
        </div>
        <div class="party">
          <div class="party-label">Client</div>
          <div class="party-name">${escapeHtml(order.company_name)}</div>
          <div class="party-detail">${escapeHtml(order.contact_person)}</div>
          <div class="party-detail">${escapeHtml(order.company_email)}</div>
          ${order.company_phone ? `<div class="party-detail">${escapeHtml(order.company_phone)}</div>` : ''}
          ${order.company_address ? `<div class="party-detail">${escapeHtml(order.company_address)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Project: ${escapeHtml(order.order_title)}</div>
      ${order.order_description ? `<p style="font-size: 12px; color: #555; margin-bottom: 16px;">${escapeHtml(order.order_description)}</p>` : ''}
      
      <table>
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th style="width:35%">Service</th>
            <th style="width:30%">Description</th>
            <th style="width:10%; text-align:center;">Qty</th>
            <th style="width:10%; text-align:right;">Price</th>
            <th style="width:10%; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${services.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-weight:600;">${escapeHtml(s.name)}</td>
              <td style="color:#666;">${escapeHtml(s.description || '')}</td>
              <td style="text-align:center;">${s.quantity || 1}</td>
              <td style="text-align:right;">${formatCurrency(s.price)}</td>
              <td style="text-align:right; font-weight:600;">${formatCurrency(s.price * (s.quantity || 1))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-table">
          <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
          ${Number(order.discount_percent) > 0 ? `<div class="row" style="color:#dc2626;"><span>Discount (${order.discount_percent}%)</span><span>-${formatCurrency(order.subtotal * order.discount_percent / 100)}</span></div>` : ''}
          ${Number(order.tax_percent) > 0 ? `<div class="row"><span>VAT (${order.tax_percent}%)</span><span>${formatCurrency((order.subtotal - order.subtotal * (order.discount_percent || 0) / 100) * order.tax_percent / 100)}</span></div>` : ''}
          <div class="row total"><span>Total</span><span>${formatCurrency(order.total_amount)}</span></div>
        </div>
      </div>
    </div>

    ${order.delivery_timeline ? `
    <div class="section">
      <div class="section-title">Delivery Timeline</div>
      <p style="font-size: 12px; color: #444;">${escapeHtml(order.delivery_timeline)}</p>
    </div>` : ''}

    ${order.after_sale_services ? `
    <div class="section">
      <div class="section-title">After-Sale Services</div>
      <div class="after-sale">${escapeHtml(order.after_sale_services)}</div>
    </div>` : ''}

    ${order.terms_and_conditions ? `
    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <div class="terms">${escapeHtml(order.terms_and_conditions)}</div>
    </div>` : ''}

    ${order.privacy_notes ? `
    <div class="section">
      <div class="section-title">Privacy & Data Protection</div>
      <div class="privacy">${escapeHtml(order.privacy_notes)}</div>
    </div>` : ''}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-label">Service Provider (AYN)</div>
        <div class="sig-line">
          ${order.admin_signature_url ? `<img src="${order.admin_signature_url}" alt="Admin Signature" />` : ''}
        </div>
        <div class="sig-name">Authorized Representative</div>
        ${order.admin_signed_at ? `<div class="sig-date">Signed: ${new Date(order.admin_signed_at).toLocaleDateString()}</div>` : '<div class="sig-date">Pending signature</div>'}
      </div>
      <div class="sig-block">
        <div class="sig-label">Client (${escapeHtml(order.company_name)})</div>
        <div class="sig-line">
          ${order.client_signature_url ? `<img src="${order.client_signature_url}" alt="Client Signature" />` : ''}
        </div>
        <div class="sig-name">${escapeHtml(order.contact_person)}</div>
        ${order.client_signed_at ? `<div class="sig-date">Signed: ${new Date(order.client_signed_at).toLocaleDateString()}</div>` : '<div class="sig-date">Pending signature</div>'}
      </div>
    </div>

    ${order.stripe_payment_link ? `
    <div class="payment-box">
      <h3>Complete Your Payment</h3>
      <div class="amount">${formatCurrency(order.total_amount)}</div>
      <a href="${order.stripe_payment_link}" target="_blank">Pay Now →</a>
    </div>` : ''}

    <div class="footer">
      © ${new Date().getFullYear()} AYN AI Technologies. All rights reserved. This document is a legally binding agreement between the parties named above.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
