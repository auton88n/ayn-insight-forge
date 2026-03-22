
-- Custom orders table for admin-created deals
CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Company info
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  company_phone TEXT,
  company_address TEXT,
  -- Order details
  order_title TEXT NOT NULL,
  order_description TEXT,
  -- Services & pricing
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 15,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  -- Contract terms
  terms_and_conditions TEXT,
  privacy_notes TEXT,
  after_sale_services TEXT,
  delivery_timeline TEXT,
  -- Signatures
  admin_signature_url TEXT,
  client_signature_url TEXT,
  admin_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  -- Stripe
  stripe_payment_link TEXT,
  stripe_payment_id TEXT,
  -- PDF
  contract_pdf_url TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'paid', 'completed', 'cancelled')),
  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Only admins can manage custom orders
CREATE POLICY "Admins can manage custom orders"
  ON public.custom_orders
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read access for clients via their email (for payment/signing pages)
CREATE POLICY "Clients can view their orders"
  ON public.custom_orders
  FOR SELECT
  TO anon
  USING (status IN ('sent', 'viewed', 'signed', 'paid', 'completed'));

-- Updated_at trigger
CREATE TRIGGER set_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();
