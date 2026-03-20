-- Add public read access to ayn_market_snapshot
-- This allows logged-out users to view the World Intelligence dashboard

CREATE POLICY "Public read access for snapshot" ON ayn_market_snapshot
  FOR SELECT USING (true);
