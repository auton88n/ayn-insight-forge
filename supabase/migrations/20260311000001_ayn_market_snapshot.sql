-- AYN Market Snapshot Table
-- Stores pre-fetched intelligence snapshot updated every 4 hours
-- One row only — always the latest snapshot

CREATE TABLE IF NOT EXISTS ayn_market_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sources_used TEXT[] DEFAULT '{}',
  fetch_errors TEXT[] DEFAULT '{}'
);

-- Only one row ever exists — the latest snapshot
-- We use upsert with a fixed singleton_key to enforce this
ALTER TABLE ayn_market_snapshot ADD COLUMN IF NOT EXISTS singleton_key INTEGER DEFAULT 1 UNIQUE;

-- Index for fast reads
CREATE INDEX IF NOT EXISTS idx_market_snapshot_fetched_at ON ayn_market_snapshot(fetched_at DESC);

-- RLS: Only service role can write, authenticated users can read
ALTER TABLE ayn_market_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON ayn_market_snapshot
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read snapshot" ON ayn_market_snapshot
  FOR SELECT TO authenticated USING (true);

-- pg_cron: Run ayn-pulse-engine every 4 hours
-- Requires pg_cron extension (already enabled in Supabase)
SELECT cron.schedule(
  'ayn-pulse-engine-cron',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/ayn-pulse-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON TABLE ayn_market_snapshot IS 'Pre-fetched market intelligence snapshot — updated every 4 hours by ayn-pulse-engine cron job. Single row always contains latest data.';
